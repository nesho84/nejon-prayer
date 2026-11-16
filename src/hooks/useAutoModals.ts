import { showFeedbackModal } from "@/components/FeedbackModal";
import { showNotifReminderModal } from "@/components/NotifReminderModal";
import { showUpdateModal } from "@/components/UpdateModal";
import { useDebugStore } from "@/debug/debugStore";
import {
  DAY_MS,
  FEEDBACK_FIRST_WAIT_DAYS,
  NOTIF_REMINDER_FIRST_WAIT_DAYS,
  RATE_FEEDBACK_GAP_DAYS,
  UPDATE_CHECK_TIMEOUT_MS,
  UpdateCheckResult,
  useAutoModalsStore,
} from "@/store/autoModalsStore";
import { useDeviceSettingsStore } from "@/store/deviceSettingsStore";
import { useModalStore } from "@/store/modalStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import NetInfo from "@react-native-community/netinfo";
import * as ExpoInAppUpdates from "expo-in-app-updates";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

// ------------------------------------------------------------
// Update — due unless waiting after a show
// ------------------------------------------------------------
export function canShowUpdate() {
  const { updateNextShowAt } = useAutoModalsStore.getState();
  return updateNextShowAt === null || Date.now() >= updateNextShowAt;
}

// ------------------------------------------------------------
// Notif reminder — due while notifications are off, after its wait, until done
// ------------------------------------------------------------
export function canShowNotifReminder() {
  const { notifReminderNextShowAt, notifReminderDone } = useAutoModalsStore.getState();
  if (useDeviceSettingsStore.getState().notificationPermission || notifReminderDone) {
    return false;
  }
  return notifReminderNextShowAt !== null && Date.now() >= notifReminderNextShowAt;
}

// ------------------------------------------------------------
// Rate App (Android only) — due after "Later", until done, apart from Feedback, no modal open
// ------------------------------------------------------------
export function canShowRateApp() {
  const { rateAppNextShowAt, rateAppDone, feedbackShownAt } = useAutoModalsStore.getState();
  const now = Date.now();

  if (Platform.OS !== "android" || rateAppDone) {
    return false;
  }
  if (rateAppNextShowAt && now < rateAppNextShowAt) {
    return false;
  }
  if (feedbackShownAt && now < feedbackShownAt + RATE_FEEDBACK_GAP_DAYS * DAY_MS) {
    return false;
  }
  return !useModalStore.getState().visible;
}

// ------------------------------------------------------------
// Feedback — due after its wait, until done, apart from Rate App
// ------------------------------------------------------------
export function canShowFeedback() {
  const { feedbackNextShowAt, feedbackDone, rateAppShownAt } = useAutoModalsStore.getState();
  const now = Date.now();

  if (feedbackDone || feedbackNextShowAt === null || now < feedbackNextShowAt) {
    return false;
  }
  return !rateAppShownAt || now >= rateAppShownAt + RATE_FEEDBACK_GAP_DAYS * DAY_MS;
}

// ------------------------------------------------------------
// Notif reminder resets when granted, and starts its first wait when seen off
// ------------------------------------------------------------
function syncNotifReminder() {
  const { notifReminderNextShowAt, notifReminderShownCount, notifReminderDone, setAutoModals } = useAutoModalsStore.getState();

  if (useDeviceSettingsStore.getState().notificationPermission) {
    if (notifReminderNextShowAt !== null || notifReminderShownCount !== 0 || notifReminderDone) {
      setAutoModals({ notifReminderNextShowAt: null, notifReminderShownCount: 0, notifReminderDone: false });
    }
    return;
  }
  if (notifReminderNextShowAt === null && !notifReminderDone) {
    setAutoModals({ notifReminderNextShowAt: Date.now() + NOTIF_REMINDER_FIRST_WAIT_DAYS * DAY_MS });
  }
}

// ------------------------------------------------------------
// Ask Play / App Store for an update
// ------------------------------------------------------------
async function checkStoreUpdate(): Promise<UpdateCheckResult> {
  try {
    const { updateAvailable } = await ExpoInAppUpdates.checkForUpdate();
    if (updateAvailable) {
      return "available";
    }
    // Play answers "no update" from its cache when offline
    const { isConnected } = await NetInfo.fetch();
    return isConnected ? "upToDate" : "offline";
  } catch {
    // Not installed via Play (dev/sideloaded build), or no AppStoreID on iOS yet
    return "error";
  }
}

// ------------------------------------------------------------
// Store check (with timeout), then at most one auto modal: Update → Notif reminder → Feedback
// ------------------------------------------------------------
export async function checkAutoModalsOnStart() {
  const { debugModeEnabled, forceUpdateOnLaunch } = useDebugStore.getState();
  const { feedbackNextShowAt, feedbackDone, setAutoModals } = useAutoModalsStore.getState();

  // Feedback: first show 7 days after onboarding
  if (feedbackNextShowAt === null && !feedbackDone) {
    setAutoModals({ feedbackNextShowAt: Date.now() + FEEDBACK_FIRST_WAIT_DAYS * DAY_MS });
  }

  // Debug "Update on launch" fakes an available update; dev builds skip the real check
  const result: UpdateCheckResult | null = debugModeEnabled && forceUpdateOnLaunch
    ? "available"
    : __DEV__
      ? null
      : await Promise.race([
        checkStoreUpdate(),
        new Promise<UpdateCheckResult>((resolve) => setTimeout(() => resolve("timeout"), UPDATE_CHECK_TIMEOUT_MS)),
      ]);

  if (result) {
    setAutoModals({ updateCheckedAt: Date.now(), updateCheckResult: result });
  }
  // Up to date — the next update starts a new cycle
  if (result === "upToDate") {
    setAutoModals({ updateNextShowAt: null, updateShownCount: 0 });
  }

  // Another modal is open (e.g. Rate App) — try next launch
  if (useModalStore.getState().visible) {
    return;
  }
  if (result === "available" && canShowUpdate()) {
    showUpdateModal();
    return;
  }
  if (canShowNotifReminder()) {
    showNotifReminderModal();
    return;
  }
  if (canShowFeedback()) {
    showFeedbackModal();
  }
}

// ------------------------------------------------------------
// Auto modals: notif reminder resets, and the startup check (once per launch)
// ------------------------------------------------------------
export function useAutoModals() {
  const onboardingComplete = useOnboardingStore((state) => state.onboardingComplete);
  const autoModalsReady = useAutoModalsStore((state) => state.isReady);
  // Not persisted — notificationPermission is only accurate after the first sync
  const deviceSettingsReady = useDeviceSettingsStore((state) => state.isReady);
  const notificationPermission = useDeviceSettingsStore((state) => state.notificationPermission);
  const launchDone = useRef(false);

  const isReady = onboardingComplete && autoModalsReady && deviceSettingsReady;

  // Notif reminder reset / first wait — on launch and on every permission change
  useEffect(() => {
    if (!isReady) return;

    syncNotifReminder();
  }, [isReady, notificationPermission]);

  // Startup check — once per launch
  useEffect(() => {
    if (!isReady || launchDone.current) return;

    launchDone.current = true;
    checkAutoModalsOnStart();
  }, [isReady]);
}
