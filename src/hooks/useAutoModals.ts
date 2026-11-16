import { showFeedbackModal } from "@/components/FeedbackModal";
import { showNotifReminderModal } from "@/components/NotifReminderModal";
import { showStoreUpdateModal } from "@/components/StoreUpdateModal";
import { useDebugStore } from "@/debug/debugStore";
import {
  DAY_MS,
  FEEDBACK_FIRST_WAIT_DAYS,
  NOTIF_REMINDER_FIRST_WAIT_DAYS,
  RATE_FEEDBACK_GAP_DAYS,
  STORE_UPDATE_CHECK_TIMEOUT_MS,
  useAutoModalsStore,
} from "@/store/autoModalsStore";
import { useDeviceSettingsStore } from "@/store/deviceSettingsStore";
import { useModalStore } from "@/store/modalStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { checkStoreUpdate } from "@/services/storeUpdateService";
import { StoreUpdateResult } from "@/types/storeUpdate.types";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

// App start — a startup modal shown after this makes Rate App wait for a later session
const APP_START = Date.now();

// ------------------------------------------------------------
// Store update — can show on every start, except during the 3-day wait (from the 3rd show on)
// ------------------------------------------------------------
export function canShowStoreUpdate() {
  const { storeUpdateNextShowAt } = useAutoModalsStore.getState();

  // 3-day wait running
  if (storeUpdateNextShowAt !== null && Date.now() < storeUpdateNextShowAt) return false;

  return true;
}

// ------------------------------------------------------------
// Notif reminder — can show while notifications are off, after its wait, until done
// ------------------------------------------------------------
export function canShowNotifReminder() {
  const { notifReminderNextShowAt, notifReminderDone } = useAutoModalsStore.getState();

  // Notifications are on
  if (useDeviceSettingsStore.getState().notificationPermission) return false;
  // Shown 3 times
  if (notifReminderDone) return false;
  // First wait not started yet
  if (notifReminderNextShowAt === null) return false;
  // Still waiting
  if (Date.now() < notifReminderNextShowAt) return false;

  return true;
}

// ------------------------------------------------------------
// Rate App (Android only) — can show after "Later", until done, apart from the other auto modals
// ------------------------------------------------------------
export function canShowRateApp() {
  const { rateAppNextShowAt, rateAppDone, feedbackShownAt, storeUpdateShownAt, notifReminderShownAt } = useAutoModalsStore.getState();
  const now = Date.now();

  // Android only
  if (Platform.OS !== "android") return false;
  // "Open Store", "Already rated", or shown 3 times
  if (rateAppDone) return false;
  // Still waiting after "Later"
  if (rateAppNextShowAt !== null && now < rateAppNextShowAt) return false;
  // Feedback shown in the last 7 days
  if (feedbackShownAt !== null && now < feedbackShownAt + RATE_FEEDBACK_GAP_DAYS * DAY_MS) {
    return false;
  }
  // Store update or Notif reminder already showed this session
  if (storeUpdateShownAt !== null && storeUpdateShownAt >= APP_START) return false;
  if (notifReminderShownAt !== null && notifReminderShownAt >= APP_START) return false;
  // Another modal is open
  if (useModalStore.getState().visible) return false;

  return true;
}

// ------------------------------------------------------------
// Feedback — can show after its wait, until done, apart from Rate App
// ------------------------------------------------------------
export function canShowFeedback() {
  const { feedbackNextShowAt, feedbackDone, rateAppShownAt } = useAutoModalsStore.getState();
  const now = Date.now();

  // Sent, "Don't ask again", or shown 3 times
  if (feedbackDone) return false;
  // First show not set yet
  if (feedbackNextShowAt === null) return false;
  // Still waiting
  if (now < feedbackNextShowAt) return false;
  // Rate App shown in the last 7 days
  if (rateAppShownAt !== null && now < rateAppShownAt + RATE_FEEDBACK_GAP_DAYS * DAY_MS) {
    return false;
  }

  return true;
}

// ------------------------------------------------------------
// Notification permission changed (or app start) — reset the reminder when granted, start its first wait when off
// ------------------------------------------------------------
function onNotifPermissionChange() {
  const { notifReminderNextShowAt, notifReminderShownCount, notifReminderDone, setAutoModals } = useAutoModalsStore.getState();

  // Granted — reset, so a later "off" starts the cycle again
  if (useDeviceSettingsStore.getState().notificationPermission) {
    if (notifReminderNextShowAt !== null || notifReminderShownCount !== 0 || notifReminderDone) {
      setAutoModals({ notifReminderNextShowAt: null, notifReminderShownCount: 0, notifReminderDone: false });
    }
    return;
  }
  // Off and not seen off before — wait 3 days before the first reminder
  if (notifReminderNextShowAt === null && !notifReminderDone) {
    setAutoModals({ notifReminderNextShowAt: Date.now() + NOTIF_REMINDER_FIRST_WAIT_DAYS * DAY_MS });
  }
}

// ------------------------------------------------------------
// Store update result for this start
// ------------------------------------------------------------
async function getStoreUpdateResult(): Promise<StoreUpdateResult | null> {
  const { debugModeEnabled, forceStoreUpdateOnLaunch } = useDebugStore.getState();

  // Debug "Update available On Launch" — fake result, no real check
  if (debugModeEnabled && forceStoreUpdateOnLaunch) return "available";
  // Dev builds aren't installed from Play — skip the check
  if (__DEV__) return null;

  // Real check — give up after 5 s, so the other startup modals aren't held up
  try {
    return await Promise.race([
      checkStoreUpdate(),
      new Promise<StoreUpdateResult>((resolve) => setTimeout(() => resolve("timeout"), STORE_UPDATE_CHECK_TIMEOUT_MS)),
    ]);
  } catch {
    // Not installed via Play (dev/sideloaded build), or no AppStoreID on iOS yet
    return "error";
  }
}

// ------------------------------------------------------------
// Store update check, then at most one auto modal: Store update → Notif reminder → Feedback
// ------------------------------------------------------------
export async function checkAutoModalsOnStart() {
  const { feedbackNextShowAt, feedbackDone, setAutoModals } = useAutoModalsStore.getState();

  // Feedback: first show 7 days after onboarding
  if (feedbackNextShowAt === null && !feedbackDone) {
    setAutoModals({ feedbackNextShowAt: Date.now() + FEEDBACK_FIRST_WAIT_DAYS * DAY_MS });
  }

  const result = await getStoreUpdateResult();

  if (result !== null) {
    setAutoModals({ storeUpdateCheckedAt: Date.now(), storeUpdateCheckResult: result });
  }
  // Up to date — the next update starts a new cycle
  if (result === "upToDate") {
    setAutoModals({ storeUpdateNextShowAt: null, storeUpdateShownCount: 0 });
  }

  // Another modal is open (e.g. Rate App) — try next launch
  if (useModalStore.getState().visible) return;

  if (result === "available" && canShowStoreUpdate()) {
    showStoreUpdateModal();
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

    onNotifPermissionChange();
  }, [isReady, notificationPermission]);

  // Startup check — once per launch
  useEffect(() => {
    if (!isReady || launchDone.current) return;

    launchDone.current = true;
    checkAutoModalsOnStart();
  }, [isReady]);
}
