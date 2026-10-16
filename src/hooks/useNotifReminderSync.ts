import { openNotifReminderModal } from "@/components/NotifReminder";
import { useDeviceSettingsStore } from "@/store/deviceSettingsStore";
import { useNotifReminderStore } from "@/store/notifReminderStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useEffect } from "react";

// ------------------------------------------------------------
// Remind to enable notifications on launch, and re-check when the permission changes
// (device settings re-sync on every resume). Waits and collisions live in openNotifReminderModal.
// ------------------------------------------------------------
export function useNotifReminderSync() {
  const onboardingComplete = useOnboardingStore((state) => state.onboardingComplete);
  const deviceSettingsReady = useDeviceSettingsStore((state) => state.isReady);
  const notificationPermission = useDeviceSettingsStore((state) => state.notificationPermission);
  // Wait for the reminder store's hydration (MMKV is sync, so this is already true by read time)
  const notifReminderReady = useNotifReminderStore((state) => state.isReady);

  useEffect(() => {
    if (!onboardingComplete || !deviceSettingsReady || !notifReminderReady) return;

    openNotifReminderModal();
  }, [onboardingComplete, deviceSettingsReady, notifReminderReady, notificationPermission]);
}
