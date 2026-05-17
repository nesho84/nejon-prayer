import { usePrayersStore } from '@/store/prayersStore';
import { toDateKey } from '@/utils/dateKey';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export function usePrayerTimesSync() {
  const loadPrayerTimes = usePrayersStore((state) => state.loadPrayerTimes);

  const appStateRef = useRef(AppState.currentState);
  const loadedDateRef = useRef(toDateKey());

  useEffect(() => {
    // ------------------------------------------------------------
    // Poll every 60 seconds — catches midnight regardless of drift (foreground case)
    // ------------------------------------------------------------
    const intervalId = setInterval(() => {
      const todayKey = toDateKey();
      if (todayKey !== loadedDateRef.current) {
        loadedDateRef.current = todayKey;
        loadPrayerTimes();
      }
    }, 60_000);

    // ------------------------------------------------------------
    // Reload when app comes to foreground on a new day (background case)
    // ------------------------------------------------------------
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        const todayKey = toDateKey();
        if (todayKey !== loadedDateRef.current) {
          loadedDateRef.current = todayKey;
          loadPrayerTimes();
        }
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [loadPrayerTimes]);
}
