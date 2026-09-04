import PrayerProgressCard from '@/components/PrayerProgressCard';
import { useLanguageStore } from '@/store/languageStore';
import { usePrayersStore } from '@/store/prayersStore';
import { usePrayersTrackingStore } from '@/store/prayersTrackingStore';
import { useThemeStore } from '@/store/themeStore';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

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
jest.mock('expo-router', () => ({ router: { navigate: jest.fn() } }));
jest.mock('@react-native-vector-icons/material-design-icons/static', () => {
  const React = require('react');
  return { MaterialDesignIcons: ({ name }: { name: string }) => React.createElement('View', { testID: `icon-${name}` }) };
});
jest.mock('@react-native-vector-icons/ionicons/static', () => {
  const React = require('react');
  return { Ionicons: ({ name }: { name: string }) => React.createElement('View', { testID: `icon-${name}` }) };
});

const mockTheme = {
  text2: '#555', accent: '#007AFF', surfaceBg: '#f0f0f0', borderCard: '#ddd',
  overlayLight: '#eee', white: '#fff', textSecondary: '#999', placeholder: '#aaa',
  card: '#f5f5f5', accent2: '#FF6B00', divider: '#eee', danger: '#FF3B30',
  brown: '#A0522D', gray: '#8E8E93', pink: '#FF2D55', green: '#34C759',
};
const mockTr = {
  labels: {
    myProgress: 'My Progress',
    week: 'Week',
    month: 'Month',
    localeDate: 'en-US', // pin locale so the badge isn't at the mercy of the runner's default
    dayNames: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  },
};

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme as any });
  useLanguageStore.setState({ tr: mockTr as any });
  usePrayersStore.setState({ prayerTimesDate: '2026-05-26' } as any);
  usePrayersTrackingStore.setState({ tracking: {} } as any);
});

describe('PrayerProgressCard', () => {
  it('renders week view by default with header', () => {
    render(<PrayerProgressCard />);
    expect(screen.getByText('My Progress')).toBeTruthy();
    expect(screen.getByText('Week')).toBeTruthy();
    expect(screen.getByText('Month')).toBeTruthy();
  });

  it('renders day name headers', () => {
    render(<PrayerProgressCard />);
    expect(screen.getByText('Su')).toBeTruthy();
    expect(screen.getByText('Mo')).toBeTruthy();
  });

  it('switches to month view on toggle press', () => {
    render(<PrayerProgressCard />);
    fireEvent.press(screen.getByText('Month'));
    // Month view renders multiple rows — still shows day names
    expect(screen.getByText('Su')).toBeTruthy();
  });
});

// prayerTimesDate is '2026-05-26' (Tue) → week Mon May 25 – Sun May 31.
describe('PrayerProgressCard — week row follows prayerTimesDate, not the device clock', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the prayerTimesDate week even when the device clock is in another week', () => {
    // Put the device clock in a different week (Mon Jun 29 – Sun Jul 5) to surface
    // any new Date() divergence — the regression that left the row stale at midnight.
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 5, 29));

    render(<PrayerProgressCard />);

    // Week of prayerTimesDate (May 25–31) is shown…
    expect(screen.getByText('25')).toBeTruthy();
    expect(screen.getByText('31')).toBeTruthy();
    // …not the device-clock week — Jul 4 would only render if the grid read new Date().
    expect(screen.queryByText('4')).toBeNull();
  });

  it('highlights the prayerTimesDate cell as today', () => {
    render(<PrayerProgressCard />);

    const todayNum = StyleSheet.flatten(screen.getByText('26').props.style);
    const otherNum = StyleSheet.flatten(screen.getByText('25').props.style);

    expect(todayNum.color).toBe('#FF6B00'); // theme.accent2 → today
    expect(otherNum.color).toBe('#aaa');    // theme.placeholder → not today
  });

  it('month view fills the final row with next-month days, matching the week view', () => {
    usePrayersStore.setState({ prayerTimesDate: '2026-06-30' } as any); // June ends Tue → Jul 1–5 trail
    render(<PrayerProgressCard />);
    fireEvent.press(screen.getByText('Month'));

    // Jul 1–5 render in addition to Jun 1–5, so each of these date numbers appears twice…
    expect(screen.getAllByText('1')).toHaveLength(2);
    expect(screen.getAllByText('5')).toHaveLength(2);
    // …while Jun 30 (last real day) is unique — no empty trailing cells.
    expect(screen.getAllByText('30')).toHaveLength(1);
  });

  it('badge always shows only the current month regardless of leading/trailing overflow cells', () => {
    usePrayersStore.setState({ prayerTimesDate: '2026-07-01' } as any); // Jun 29-30 lead, Aug 1-2 trail
    render(<PrayerProgressCard />);

    // Week view — "July 2026", not "June - July 2026"
    expect(screen.getAllByText(/July 2026/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/-/)).toBeNull();

    // Month view — same
    fireEvent.press(screen.getByText('Month'));
    expect(screen.getAllByText(/July 2026/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/-/)).toBeNull();
  });
});
