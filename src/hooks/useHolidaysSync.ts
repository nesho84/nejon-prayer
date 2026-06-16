import { useDeviceSettingsStore } from '@/store/deviceSettingsStore';
import { useHolidaysStore } from '@/store/holidaysStore';
import { useEffect } from 'react';

export function useHolidaysSync() {
  // Wait for device settings to finish their first sync so that
  // internetConnection is accurate before we attempt to fetch.
  const deviceSettingsReady = useDeviceSettingsStore((state) => state.isReady);
  const isReady = useHolidaysStore((state) => state.isReady);
  const loadHolidays = useHolidaysStore((state) => state.loadHolidays);

  // ------------------------------------------------------------
  // Fetch Islamic holiday dates once per year on app start
  // The fetchedYear guard in the store prevents unnecessary refetches
  // ------------------------------------------------------------
  useEffect(() => {
    if (!isReady || !deviceSettingsReady) return;

    loadHolidays();
  }, [deviceSettingsReady, isReady]);
}