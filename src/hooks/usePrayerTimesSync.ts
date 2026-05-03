import { usePrayersStore } from '@/store/prayersStore';
import { formatDateKey } from '@/utils/date';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export function usePrayerTimesSync() {
  const loadPrayerTimes = usePrayersStore((state) => state.loadPrayerTimes);

  const appStateRef = useRef(AppState.currentState);
  const loadedDateRef = useRef(formatDateKey());

  useEffect(() => {
    const timerRef = { current: 0 as ReturnType<typeof setTimeout> };

    // ------------------------------------------------------------
    // Schedule a reload at the next midnight (foreground case)
    // ------------------------------------------------------------
    const scheduleMidnightRefresh = () => {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
      const msUntilMidnight = midnight.getTime() - now.getTime();

      timerRef.current = setTimeout(() => {
        loadedDateRef.current = formatDateKey();
        loadPrayerTimes();
        scheduleMidnightRefresh();
      }, msUntilMidnight);
    };

    scheduleMidnightRefresh();

    // ------------------------------------------------------------
    // Reload when app comes to foreground on a new day (background case)
    // ------------------------------------------------------------
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        const todayKey = formatDateKey();
        if (todayKey !== loadedDateRef.current) {
          loadedDateRef.current = todayKey;
          loadPrayerTimes();
        }
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      clearTimeout(timerRef.current);
      subscription.remove();
    };
  }, [loadPrayerTimes]);
}
