import { useHolidaysStore } from '@/store/holidaysStore';
import { useEffect } from 'react';

export function useHolidaysSync() {
  const loadIslamicHolidays = useHolidaysStore((state) => state.loadHolidays);
  const isReady = useHolidaysStore((state) => state.isReady);

  // ------------------------------------------------------------
  // Fetch Islamic holiday dates once per year on app start
  // The fetchedYear guard in the store prevents unnecessary refetches
  // ------------------------------------------------------------
  useEffect(() => {
    if (!isReady) return;

    loadIslamicHolidays();
  }, [isReady]);
}