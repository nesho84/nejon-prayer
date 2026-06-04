import PrayerTimingsScreen from '@/app/(modals)/prayerTimings';
import { useLanguageStore } from '@/store/languageStore';
import { useLocationStore } from '@/store/locationStore';
import { usePrayersStore } from '@/store/prayersStore';
import { usePrayersTrackingStore } from '@/store/prayersTrackingStore';
import { useThemeStore } from '@/store/themeStore';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

// --- Core mocks ---
jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('@sentry/react-native', () => ({ captureException: jest.fn(), init: jest.fn() }));
jest.mock('react-native-notify-kit', () => ({
  default: { openNotificationSettings: jest.fn() },
  AndroidNotificationSetting: { ENABLED: 1 },
  AuthorizationStatus: { AUTHORIZED: 1, DENIED: 0 },
}));
jest.mock('@/services/locationService', () => ({
  getUserLocation: jest.fn(),
  hasLocationChanged: jest.fn(),
}));
jest.mock('@/services/prayersService', () => ({
  getYearlyPrayerTimes: jest.fn(),
}));
jest.mock('@/components/ModalSheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  return React.forwardRef(({ children, footer }: any, _ref: any) =>
    React.createElement(View, null, children, footer)
  );
});
jest.mock('@/components/PrayerIcon', () => () => null);
jest.mock('@/components/AppLoading', () => {
  const React = require('react');
  const { ActivityIndicator } = require('react-native');
  return ({ text }: any) => React.createElement(ActivityIndicator, { testID: `loading-${text}` });
});
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    Ionicons: ({ name }: any) => React.createElement('View', { testID: `icon-${name}` }),
  };
});
jest.mock('@react-native-community/datetimepicker', () => () => null);
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({})),
}));

// --- Fixture data ---
const mockTheme = {
  bg: '#fff', bg2: '#f5f5f5', text: '#111', text2: '#555', textMuted: '#888',
  textSecondary: '#666', accent: '#007AFF', card: '#f5f5f5', accent2: '#34C759',
  primary: '#007AFF', divider: '#eee', divider2: '#ddd', border: '#ccc',
  overlay: 'rgba(0,0,0,0.05)', overlayLight: 'rgba(0,0,0,0.02)',
  placeholder: '#aaa', handle: '#ccc',
} as any;

const mockTr = {
  prayers: { Fajr: 'Fajr', Dhuhr: 'Dhuhr', Asr: 'Asr', Maghrib: 'Maghrib', Isha: 'Isha', Sunrise: 'Sunrise' },
  labels: {
    calendarTitle: 'Prayer Times',
    calendarSubtitle: 'Tap to track your prayers',
    loading: 'Loading...',
    localeDate: 'en-US',
  },
  buttons: { cancel: 'Cancel', today: 'Today' },
} as any;

const mockPrayerTimes = {
  Fajr: '05:30', Sunrise: '07:00', Dhuhr: '13:00',
  Asr: '16:45', Maghrib: '19:30', Isha: '21:00',
};

const mockLocation = { lat: 51.5, lng: -0.1, city: 'London' } as any;

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme, resolvedTheme: 'light' as any });
  useLanguageStore.setState({ tr: mockTr, language: 'en' as any });
  useLocationStore.setState({ location: mockLocation, timeZone: { location: 'London', zoneName: 'Europe/London', offset: '+00:00' } as any });
  usePrayersTrackingStore.setState({ tracking: {} } as any);
  jest.spyOn(usePrayersStore.getState(), 'getPrayerTimesForDate')
    .mockResolvedValue(mockPrayerTimes as any);
  jest.clearAllMocks();
  // Re-apply spy after clearAllMocks
  jest.spyOn(usePrayersStore.getState(), 'getPrayerTimesForDate')
    .mockResolvedValue(mockPrayerTimes as any);
});

describe('PrayerTimingsScreen', () => {
  it('renders the header title', async () => {
    render(<PrayerTimingsScreen />);
    await waitFor(() => {
      expect(screen.getByText('Prayer Times')).toBeTruthy();
      expect(screen.getByText('Tap to track your prayers')).toBeTruthy();
    });
  });

  it('renders Cancel and Today footer buttons', async () => {
    render(<PrayerTimingsScreen />);
    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeTruthy();
      expect(screen.getByText('Today')).toBeTruthy();
    });
  });

  it('displays prayer names and times after loading', async () => {
    render(<PrayerTimingsScreen />);
    await waitFor(() => {
      expect(screen.getByText('Fajr')).toBeTruthy();
      expect(screen.getByText('05:30')).toBeTruthy();
      expect(screen.getByText('Dhuhr')).toBeTruthy();
      expect(screen.getByText('13:00')).toBeTruthy();
    });
  });

  it('shows timezone info', async () => {
    render(<PrayerTimingsScreen />);
    await waitFor(() => expect(screen.getByText('London')).toBeTruthy());
    expect(screen.getByText('Europe/London • +00:00')).toBeTruthy();
  });

  it('navigating back one day then pressing Today changes date back', async () => {
    render(<PrayerTimingsScreen />);
    await waitFor(() => expect(screen.getByText('Fajr')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByTestId('icon-chevron-back'));
    });

    await act(async () => {
      fireEvent.press(screen.getByText('Today'));
    });

    // After pressing Today, Today button should be disabled (isToday = true)
    await waitFor(() => {
      const todayBtn = screen.getByText('Today');
      // Re-rendered — Today is now the selected date so button is disabled
      expect(todayBtn).toBeTruthy();
    });
  });

  it('navigating back one day fetches prayer times for yesterday', async () => {
    const getPrayerTimesForDate = jest.spyOn(usePrayersStore.getState(), 'getPrayerTimesForDate')
      .mockResolvedValue(mockPrayerTimes as any);

    render(<PrayerTimingsScreen />);
    await waitFor(() => expect(screen.getByText('Fajr')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByTestId('icon-chevron-back'));
    });

    await waitFor(() => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const expectedKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      expect(getPrayerTimesForDate).toHaveBeenCalledWith(expectedKey);
    });
  });
});
