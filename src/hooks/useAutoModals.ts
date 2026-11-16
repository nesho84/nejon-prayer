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

// App start — a startup modal shown after this makes Rate App wait for a later session
const APP_START = Date.now();

// ------------------------------------------------------------
// Update — can show unless waiting after a show
// ------------------------------------------------------------
export function canShowUpdate() {
  const { updateNextShowAt } = useAutoModalsStore.getState();

  // Still waiting after a show
  if (updateNextShowAt !== null && Date.now() < updateNextShowAt) {
    return false;
  }
  return true;
}

// ------------------------------------------------------------
// Notif reminder — can show while notifications are off, after its wait, until done
// ------------------------------------------------------------
export function canShowNotifReminder() {
  const { notifReminderNextShowAt, notifReminderDone } = useAutoModalsStore.getState();

  // Notifications are on
  if (useDeviceSettingsStore.getState().notificationPermission) {
    return false;
  }
  // Shown 3 times
  if (notifReminderDone) {
    return false;
  }
  // First wait not started yet
  if (notifReminderNextShowAt === null) {
    return false;
  }
  // Still waiting
  if (Date.now() < notifReminderNextShowAt) {
    return false;
  }
  return true;
}

// ------------------------------------------------------------
// Rate App (Android only) — can show after "Later", until done, apart from the other auto modals
// ------------------------------------------------------------
export function canShowRateApp() {
  const { rateAppNextShowAt, rateAppDone, feedbackShownAt, updateShownAt, notifReminderShownAt } = useAutoModalsStore.getState();
  const now = Date.now();

  // Android only
  if (Platform.OS !== "android") {
    return false;
  }
  // "Open Store", "Already rated", or shown 3 times
  if (rateAppDone) {
    return false;
  }
  // Still waiting after "Later"
  if (rateAppNextShowAt !== null && now < rateAppNextShowAt) {
    return false;
  }
  // Feedback shown in the last 7 days
  if (feedbackShownAt !== null && now < feedbackShownAt + RATE_FEEDBACK_GAP_DAYS * DAY_MS) {
    return false;
  }
  // Update or Notif reminder already showed this session
  if (updateShownAt !== null && updateShownAt >= APP_START) {
    return false;
  }
  if (notifReminderShownAt !== null && notifReminderShownAt >= APP_START) {
    return false;
  }
  // Another modal is open
  if (useModalStore.getState().visible) {
    return false;
  }
  return true;
}

// ------------------------------------------------------------
// Feedback — can show after its wait, until done, apart from Rate App
// ------------------------------------------------------------
export function canShowFeedback() {
  const { feedbackNextShowAt, feedbackDone, rateAppShownAt } = useAutoModalsStore.getState();
  const now = Date.now();

  // Sent, "Don't ask again", or shown 3 times
  if (feedbackDone) {
    return false;
  }
  // First show not set yet
  if (feedbackNextShowAt === null) {
    return false;
  }
  // Still waiting
  if (now < feedbackNextShowAt) {
    return false;
  }
  // Rate App shown in the last 7 days
  if (rateAppShownAt !== null && now < rateAppShownAt + RATE_FEEDBACK_GAP_DAYS * DAY_MS) {
    return false;
  }
  return true;
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
