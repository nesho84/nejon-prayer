import { usePrayersStore } from '@/store/prayersStore';
import { toDateKey } from '@/utils/date';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export function usePrayerTimesSync() {
  const loadPrayerTimes = usePrayersStore((state) => state.loadPrayerTimes);

  const appStateRef = useRef(AppState.currentState);
  const loadedDateRef = useRef(toDateKey());

  useEffect(() => {
    // Poll every 60s to detect day change while app in foreground.
    // A long setTimeout is unreliable on Android release builds — OEM Doze
    // (especially Samsung) throttles JS timers scheduled hours in advance.
    const intervalId = setInterval(() => {
      if (AppState.currentState !== 'active') return;

      const todayKey = toDateKey();
      if (todayKey !== loadedDateRef.current) {
        loadedDateRef.current = todayKey;
        loadPrayerTimes();
      }
    }, 60000); // 60s

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