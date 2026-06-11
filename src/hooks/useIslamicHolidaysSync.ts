import { useIslamicHolidaysStore } from '@/store/islamicHolidaysStore';
import { useEffect } from 'react';

export function useIslamicHolidaysSync() {
  const loadIslamicHolidays = useIslamicHolidaysStore((state) => state.loadIslamicHolidays);
  const isReady = useIslamicHolidaysStore((state) => state.isReady);

  // ------------------------------------------------------------
  // Fetch Islamic holiday dates once per year on app start
  // The fetchedYear guard in the store prevents unnecessary refetches
  // ------------------------------------------------------------
  useEffect(() => {
    if (!isReady) return;

    loadIslamicHolidays();
  }, [isReady]);
}