import { scheduleNotificationsService } from '@/services/notificationsService';
import { useLanguageStore } from '@/store/languageStore';
import { useNotificationsStore } from '@/store/notificationsStore';
import { usePrayersStore } from '@/store/prayersStore';
import { PrayerTimes } from '@/types/prayer.types';
import notifee from 'react-native-notify-kit';

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

jest.mock('@/services/notificationsService', () => ({
  scheduleNotificationsService: jest.fn(),
}));

jest.mock('@/store/prayersStore', () => ({
  usePrayersStore: { getState: jest.fn() },
}));

jest.mock('@/store/languageStore', () => ({
  useLanguageStore: { getState: jest.fn() },
}));

jest.mock('react-native-notify-kit', () => ({
  __esModule: true,
  default: {
    getNotificationSettings: jest.fn(() => Promise.resolve({ authorizationStatus: 'authorized' })),
  },
  AuthorizationStatus: { AUTHORIZED: 'authorized' },
}));

const mockSchedule = scheduleNotificationsService as jest.Mock;
const mockPrayersGetState = (usePrayersStore as any).getState as jest.Mock;
const mockLanguageGetState = (useLanguageStore as any).getState as jest.Mock;
const mockGetNotifSettings = (notifee as any).getNotificationSettings as jest.Mock;

const PRAYER_TIMES: PrayerTimes = {
  Imsak: '04:30', Fajr: '04:50', Sunrise: '06:20',
  Dhuhr: '12:30', Asr: '15:45', Maghrib: '18:20', Isha: '19:45',
};

const TR_MOCK = {};

beforeEach(() => {
  jest.clearAllMocks();
  useNotificationsStore.setState({
    lastScheduledHash: null, lastBackgroundSync: null,
    isLoading: false, isReady: false,
  });
  mockLanguageGetState.mockReturnValue({ language: 'en', tr: TR_MOCK });
  mockPrayersGetState.mockReturnValue({ prayerTimes: PRAYER_TIMES, yearlyPrayerTimes: null, loadPrayerTimes: jest.fn() });
  mockGetNotifSettings.mockResolvedValue({ authorizationStatus: 'authorized' });
});

describe('notificationsStore — setters', () => {
  it('setSettings updates notifSettings', () => {
    useNotificationsStore.getState().setSettings({ volume: 0.8, vibration: 'long' });
    const { notifSettings } = useNotificationsStore.getState();
    expect(notifSettings.volume).toBe(0.8);
    expect(notifSettings.vibration).toBe('long');
  });

  it('setPrayer updates a specific prayer setting', () => {
    useNotificationsStore.getState().setPrayer('Fajr', { enabled: false, offset: -10 });
    expect(useNotificationsStore.getState().prayers.Fajr.enabled).toBe(false);
    expect(useNotificationsStore.getState().prayers.Fajr.offset).toBe(-10);
  });

  it('setEvent updates a specific event setting', () => {
    useNotificationsStore.getState().setEvent('Imsak', { enabled: true, offset: 5 });
    expect(useNotificationsStore.getState().events.Imsak.enabled).toBe(true);
    expect(useNotificationsStore.getState().events.Imsak.offset).toBe(5);
  });

  it('setSpecial updates a specific special setting', () => {
    useNotificationsStore.getState().setSpecial('Friday', { enabled: false });
    expect(useNotificationsStore.getState().specials.Friday.enabled).toBe(false);
  });
});

describe('notificationsStore — syncNotifications', () => {
  it('skips scheduling when notification permission is denied (read live from notifee)', async () => {
    mockGetNotifSettings.mockResolvedValue({ authorizationStatus: 'denied' });
    await useNotificationsStore.getState().syncNotifications();
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('skips scheduling when prayerTimes is null', async () => {
    mockPrayersGetState.mockReturnValue({ prayerTimes: null, yearlyPrayerTimes: null });
    await useNotificationsStore.getState().syncNotifications();
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('calls scheduleNotificationsService when conditions are met', async () => {
    mockSchedule.mockResolvedValue(undefined);
    await useNotificationsStore.getState().syncNotifications();
    expect(mockSchedule).toHaveBeenCalledTimes(1);
    expect(useNotificationsStore.getState().lastScheduledHash).not.toBeNull();
  });

  it('skips scheduling when hash is unchanged', async () => {
    mockSchedule.mockResolvedValue(undefined);
    await useNotificationsStore.getState().syncNotifications();
    await useNotificationsStore.getState().syncNotifications();
    expect(mockSchedule).toHaveBeenCalledTimes(1);
  });

  it('sets isLoading to false after completion', async () => {
    mockSchedule.mockResolvedValue(undefined);
    await useNotificationsStore.getState().syncNotifications();
    expect(useNotificationsStore.getState().isLoading).toBe(false);
  });
});

describe('notificationsStore — syncNotificationsInBackground', () => {
  it('reschedules in headless context where the store flag would be empty (permission read live)', async () => {
    mockSchedule.mockResolvedValue(undefined);
    await useNotificationsStore.getState().syncNotificationsInBackground();
    expect(mockSchedule).toHaveBeenCalledTimes(1);
  });

  it('marks lastBackgroundSync done when the reschedule succeeds', async () => {
    mockSchedule.mockResolvedValue(undefined);
    await useNotificationsStore.getState().syncNotificationsInBackground();
    expect(useNotificationsStore.getState().lastBackgroundSync).not.toBeNull();
  });

  it('does NOT mark lastBackgroundSync on failure, so the next delivery can retry', async () => {
    mockGetNotifSettings.mockResolvedValue({ authorizationStatus: 'denied' }); // → syncNotifications returns 'failed'
    await useNotificationsStore.getState().syncNotificationsInBackground();
    expect(useNotificationsStore.getState().lastBackgroundSync).toBeNull();
  });
});