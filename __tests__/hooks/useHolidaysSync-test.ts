import { useHolidaysSync } from '@/hooks/useHolidaysSync';
import { useDeviceSettingsStore } from '@/store/deviceSettingsStore';
import { useHolidaysStore } from '@/store/holidaysStore';
import { renderHook } from '@testing-library/react-native';

jest.mock('@/store/deviceSettingsStore', () => ({ useDeviceSettingsStore: jest.fn() }));
jest.mock('@/store/holidaysStore', () => ({ useHolidaysStore: jest.fn() }));

let deviceReady: boolean;
let holidaysReady: boolean;
let mockLoadHolidays: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  deviceReady = true;
  holidaysReady = true;
  mockLoadHolidays = jest.fn();
  (useDeviceSettingsStore as unknown as jest.Mock).mockImplementation((selector: Function) =>
    selector({ isReady: deviceReady })
  );
  // Hook form supplies readiness; the effect calls loadHolidays via getState()
  (useHolidaysStore as unknown as jest.Mock).mockImplementation((selector: Function) =>
    selector({ isReady: holidaysReady })
  );
  (useHolidaysStore as unknown as { getState: jest.Mock }).getState = jest.fn(() => ({
    loadHolidays: mockLoadHolidays,
  }));
});

describe('useHolidaysSync', () => {
  it('calls loadHolidays once when both stores are ready', () => {
    renderHook(() => useHolidaysSync());
    expect(mockLoadHolidays).toHaveBeenCalledTimes(1);
  });

  it('does not call loadHolidays when the holidays store is not ready', () => {
    holidaysReady = false;
    renderHook(() => useHolidaysSync());
    expect(mockLoadHolidays).not.toHaveBeenCalled();
  });

  it('does not call loadHolidays when device settings are not ready', () => {
    deviceReady = false;
    renderHook(() => useHolidaysSync());
    expect(mockLoadHolidays).not.toHaveBeenCalled();
  });
});
