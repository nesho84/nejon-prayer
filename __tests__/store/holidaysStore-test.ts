jest.mock('@/store/storage', () => ({
  mmkvStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  init: jest.fn(),
}));

jest.mock('@/services/holidaysService', () => ({
  getYearlyHolidays: jest.fn(),
}));

jest.mock('@/store/deviceSettingsStore', () => ({
  useDeviceSettingsStore: { getState: jest.fn() },
}));

import { getYearlyHolidays } from '@/services/holidaysService';
import { useDeviceSettingsStore } from '@/store/deviceSettingsStore';
import { useHolidaysStore } from '@/store/holidaysStore';
import { YearlyHolidays } from '@/types/holiday.types';

const mockGetYearlyHolidays = getYearlyHolidays as jest.Mock;
const mockDeviceGetState = (useDeviceSettingsStore as any).getState as jest.Mock;

const CURRENT_YEAR = new Date().getFullYear();
const CACHED: YearlyHolidays = { ramadan_start: ['2026-02-18'] };
const FETCHED: YearlyHolidays = { eid_fitr: ['2026-03-20'] };

beforeEach(() => {
  jest.clearAllMocks();
  useHolidaysStore.setState({ yearlyHolidays: null, fetchedYear: null, isLoading: false });
  mockDeviceGetState.mockReturnValue({ internetConnection: true });
});

describe('holidaysStore — loadHolidays', () => {
  it('skips fetching when holidays were already fetched this year', async () => {
    useHolidaysStore.setState({ yearlyHolidays: CACHED, fetchedYear: CURRENT_YEAR });
    await useHolidaysStore.getState().loadHolidays();

    expect(mockGetYearlyHolidays).not.toHaveBeenCalled();
    expect(useHolidaysStore.getState().yearlyHolidays).toBe(CACHED);
  });

  it('offline with cached data: uses the cache and does not fetch', async () => {
    mockDeviceGetState.mockReturnValue({ internetConnection: false });
    useHolidaysStore.setState({ yearlyHolidays: CACHED, fetchedYear: null });
    await useHolidaysStore.getState().loadHolidays();

    expect(mockGetYearlyHolidays).not.toHaveBeenCalled();
    expect(useHolidaysStore.getState().yearlyHolidays).toBe(CACHED);
  });

  it('offline with no cache: degrades gracefully (no crash, stays null)', async () => {
    mockDeviceGetState.mockReturnValue({ internetConnection: false });
    await expect(useHolidaysStore.getState().loadHolidays()).resolves.toBeUndefined();

    expect(mockGetYearlyHolidays).not.toHaveBeenCalled();
    expect(useHolidaysStore.getState().yearlyHolidays).toBeNull();
  });

  it('online complete fetch: stores holidays and locks fetchedYear to the current year', async () => {
    mockGetYearlyHolidays.mockResolvedValue({ holidays: FETCHED, complete: true });
    await useHolidaysStore.getState().loadHolidays();

    expect(mockGetYearlyHolidays).toHaveBeenCalledTimes(1);
    expect(useHolidaysStore.getState().yearlyHolidays).toBe(FETCHED);
    expect(useHolidaysStore.getState().fetchedYear).toBe(CURRENT_YEAR);
  });

  it('online partial fetch: stores holidays but leaves fetchedYear null to retry next launch', async () => {
    mockGetYearlyHolidays.mockResolvedValue({ holidays: FETCHED, complete: false });
    await useHolidaysStore.getState().loadHolidays();

    expect(useHolidaysStore.getState().yearlyHolidays).toBe(FETCHED);
    expect(useHolidaysStore.getState().fetchedYear).toBeNull();
  });

  it('fetch failure: does not crash, leaves data null and resets isLoading', async () => {
    mockGetYearlyHolidays.mockRejectedValue(new Error('network down'));
    await expect(useHolidaysStore.getState().loadHolidays()).resolves.toBeUndefined();

    expect(useHolidaysStore.getState().yearlyHolidays).toBeNull();
    expect(useHolidaysStore.getState().fetchedYear).toBeNull();
    expect(useHolidaysStore.getState().isLoading).toBe(false);
  });
});
