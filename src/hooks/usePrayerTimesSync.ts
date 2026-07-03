import { usePrayersStore } from '@/store/prayersStore';
import { toDateKey } from '@/utils/datetime';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export function usePrayerTimesSync() {
  const loadPrayerTimes = usePrayersStore((state) => state.loadPrayerTimes);

  const appStateRef = useRef(AppState.currentState);
  const loadedDateRef = useRef(toDateKey());

  useEffect(() => {
    // Sync check-and-claim — single-threaded JS, so interval + AppState can't double-fire
    const reloadOnDayChange = () => {
      const todayKey = toDateKey();
      if (todayKey === loadedDateRef.current) return;
      loadedDateRef.current = todayKey;
      loadPrayerTimes();
    };

    // Poll every 60s to detect day change while app in foreground.
    // A long setTimeout is unreliable on Android release builds — OEM Doze
    // (especially Samsung) throttles JS timers scheduled hours in advance.
    const intervalId = setInterval(() => {
      if (AppState.currentState !== 'active') return;
      reloadOnDayChange();
    }, 60000); // 60s

    // ------------------------------------------------------------
    // Reload when app comes to foreground on a new day (background case)
    // ------------------------------------------------------------
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        reloadOnDayChange();
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [loadPrayerTimes]);
}