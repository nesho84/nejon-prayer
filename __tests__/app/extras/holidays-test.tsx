import HolidaysScreen from '@/app/extras/holidays';
import { useHolidaysStore } from '@/store/holidaysStore';
import { useLanguageStore } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { YearlyHolidays } from '@/types/holiday.types';
import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
// holidaysStore → deviceSettingsStore → react-native-notify-kit (native, unavailable in jest).
// The screen never calls loadHolidays, so a light getState stub is enough.
jest.mock('@/store/deviceSettingsStore', () => ({
  useDeviceSettingsStore: { getState: jest.fn(() => ({ internetConnection: true })) },
}));
jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  init: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, null, children);
  },
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-navigation-bar', () => ({ NavigationBar: () => null }));
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: ({ name }: any) => React.createElement(View, { testID: `mci-${name}` }),
    Feather: ({ name }: any) => React.createElement(View, { testID: `feather-${name}` }),
  };
});
// Render header, items and footer so the year badges (header) are testable
jest.mock('@shopify/flash-list', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    FlashList: React.forwardRef(
      ({ data, renderItem, ListHeaderComponent, ListFooterComponent }: any, _ref: any) =>
        React.createElement(
          View,
          null,
          ListHeaderComponent ? React.createElement(View, null, ListHeaderComponent) : null,
          data?.map((item: any, i: number) => React.createElement(View, { key: i }, renderItem({ item }))),
          ListFooterComponent ? React.createElement(View, null, ListFooterComponent) : null,
        )
    ),
  };
});

const mockTheme = {
  bg: '#fff', text: '#111', textMuted: '#888', placeholder: '#999',
  card: '#f5f5f5', gray: '#888', borderCard: '#eee', divider2: '#ddd',
  success: '#34c759', islamicGreen: '#0a0', gold: '#fc0', accent: '#07f',
  info: '#09f', violet: '#84f', secondary: '#666', pink: '#f6a',
} as any;

function setHolidays(yearlyHolidays: YearlyHolidays | null) {
  useHolidaysStore.setState({ yearlyHolidays });
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-06-16T12:00:00Z')); // "today" → past/future deterministic
  useThemeStore.setState({ theme: mockTheme, resolvedTheme: 'light' as any });
  useLanguageStore.setState({ language: 'en' as any });
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('HolidaysScreen', () => {
  it('renders the localized header title', () => {
    setHolidays({ eid_fitr: ['2026-12-10'] });
    render(<HolidaysScreen />);
    expect(screen.getByText('Islamic Holidays')).toBeTruthy();
  });

  it('hides year badges when only one year is available', () => {
    // all dates fall in 2026 → AVAILABLE_YEARS = [2026]
    setHolidays({ eid_fitr: ['2026-03-20'], eid_adha: ['2026-12-10'] });
    render(<HolidaysScreen />);
    // a bare year string only appears as a badge (dates render as "DD.MM.YYYY")
    expect(screen.queryByText('2026')).toBeNull();
    expect(screen.queryByText('2027')).toBeNull();
  });

  it('shows year badges when two or more years are available', () => {
    setHolidays({ eid_fitr: ['2026-03-20'], ramadan_start: ['2027-02-08'] });
    render(<HolidaysScreen />);
    expect(screen.getByText('2026')).toBeTruthy();
    expect(screen.getByText('2027')).toBeTruthy();
  });

  it('dims past holidays and keeps upcoming ones fully opaque', () => {
    setHolidays({
      ramadan_start: ['2026-02-18'], // past
      eid_adha: ['2026-12-10'],      // upcoming
    });
    render(<HolidaysScreen />);

    const past = screen.getByTestId('holiday-ramadan_start');
    const upcoming = screen.getByTestId('holiday-eid_adha');
    expect(StyleSheet.flatten(past.props.style).opacity).toBe(0.4);
    expect(StyleSheet.flatten(upcoming.props.style).opacity).toBe(1);
  });

  it('sorts holidays chronologically regardless of input order', () => {
    setHolidays({
      eid_adha: ['2026-12-10'],
      ramadan_start: ['2026-02-18'],
      eid_fitr: ['2026-03-20'],
    });
    render(<HolidaysScreen />);

    const names = screen.getAllByText(/^(Ramadan|Eid al-Fitr|Eid al-Adha)$/);
    expect(names.map((n) => n.props.children)).toEqual(['Ramadan', 'Eid al-Fitr', 'Eid al-Adha']);
  });
});
