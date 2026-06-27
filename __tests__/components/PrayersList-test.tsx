import PrayersList from '@/components/PrayersList';
import { useLanguageStore } from '@/store/languageStore';
import { usePrayersTrackingStore } from '@/store/prayersTrackingStore';
import { useThemeStore } from '@/store/themeStore';
import { toDateKey } from '@/utils/datetime';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('@sentry/react-native', () => ({ captureException: jest.fn(), captureMessage: jest.fn(), init: jest.fn() }));
jest.mock('react-native-notify-kit', () => ({
  __esModule: true,
  default: { getNotificationSettings: jest.fn() },
  AndroidNotificationSetting: { ENABLED: 1 },
  AuthorizationStatus: { AUTHORIZED: 1 },
}));
jest.mock('react-native-sound', () => ({ __esModule: true, default: function () { } }));
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));
jest.mock('expo-location', () => ({
  hasServicesEnabledAsync: jest.fn(() => Promise.resolve(true)),
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
}));
jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('expo-haptics', () => ({ notificationAsync: jest.fn(), NotificationFeedbackType: { Success: 'success' } }));
jest.mock('expo-router', () => ({ router: { navigate: jest.fn() } }));
jest.mock('@react-native-vector-icons/ionicons/static', () => {
  const React = require('react');
  return { Ionicons: ({ name }: { name: string }) => React.createElement('View', { testID: `ion-${name}` }) };
});
jest.mock('@react-native-vector-icons/material-design-icons/static', () => {
  const React = require('react');
  return { MaterialDesignIcons: ({ name }: { name: string }) => React.createElement('View', { testID: `mci-${name}` }) };
});

const mockTheme = {
  text2: '#555', accent: '#007AFF', accent2: '#FF6B00', card: '#fff',
  borderCard: '#ddd', accentLight: '#e0f0ff', surfaceBg: '#f0f0f0',
  textMuted: '#999', accentLight2: '#f0f8ff', divider2: '#eee',
};
const mockTr = {
  prayers: { Imsak: 'Imsak', Fajr: 'Fajr', Sunrise: 'Sunrise', Dhuhr: 'Dhuhr', Asr: 'Asr', Maghrib: 'Maghrib', Isha: 'Isha' },
  labels: { jummah: 'Xhumaja' },
};
const mockPrayerTimes = {
  Imsak: '04:30', Fajr: '04:50', Sunrise: '06:15',
  Dhuhr: '12:00', Asr: '15:30', Maghrib: '19:45', Isha: '21:15',
};

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme as any });
  useLanguageStore.setState({ tr: mockTr as any, language: 'en' as any });
  usePrayersTrackingStore.setState({ tracking: {}, celebratedDate: null } as any);
});

describe('PrayersList', () => {
  it('renders all prayer rows with times', () => {
    render(<PrayersList prayerTimes={mockPrayerTimes as any} prayerTimesDate={toDateKey()} currentPrayerName={null} />);
    expect(screen.getByText('Fajr')).toBeTruthy();
    expect(screen.getByText('Dhuhr')).toBeTruthy();
    expect(screen.getByText('Isha')).toBeTruthy();
    expect(screen.getByText('04:50')).toBeTruthy();
    expect(screen.getByText('21:15')).toBeTruthy();
  });

  it('marks a prayer as prayed on press', () => {
    const markPrayed = jest.fn(() => false);
    usePrayersTrackingStore.setState({ tracking: {}, celebratedDate: null, markPrayed } as any);
    render(<PrayersList prayerTimes={mockPrayerTimes as any} prayerTimesDate={toDateKey()} currentPrayerName="Fajr" />);
    fireEvent.press(screen.getByText('Fajr'));
    expect(markPrayed).toHaveBeenCalledWith('Fajr');
  });
});

describe('PrayersList — past / future / unmark logic', () => {
  // Pin time to noon so Fajr (04:50) is past and Isha (21:15) is future
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-28T12:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('pressing a past prayer calls markPrayed', () => {
    const markPrayed = jest.fn(() => false);
    usePrayersTrackingStore.setState({ tracking: {}, celebratedDate: null, markPrayed } as any);
    render(<PrayersList prayerTimes={mockPrayerTimes as any} prayerTimesDate={toDateKey()} currentPrayerName={null} />);
    fireEvent.press(screen.getByText('Fajr')); // 04:50 — past at noon
    expect(markPrayed).toHaveBeenCalledWith('Fajr');
  });

  it('pressing a future prayer does nothing', () => {
    const markPrayed = jest.fn(() => false);
    usePrayersTrackingStore.setState({ tracking: {}, celebratedDate: null, markPrayed } as any);
    render(<PrayersList prayerTimes={mockPrayerTimes as any} prayerTimesDate={toDateKey()} currentPrayerName={null} />);
    fireEvent.press(screen.getByText('Isha')); // 21:15 — future at noon
    expect(markPrayed).not.toHaveBeenCalled();
  });

  it('pressing an already-prayed prayer calls unmarkPrayed', () => {
    const unmarkPrayed = jest.fn();
    const today = toDateKey();
    usePrayersTrackingStore.setState({
      tracking: { [today]: { Fajr: 'prayed' } },
      celebratedDate: null,
      markPrayed: jest.fn(() => false),
      unmarkPrayed,
    } as any);
    render(<PrayersList prayerTimes={mockPrayerTimes as any} prayerTimesDate={today} currentPrayerName={null} />);
    fireEvent.press(screen.getByText('Fajr')); // already prayed → unmark
    expect(unmarkPrayed).toHaveBeenCalledWith('Fajr');
  });
});
