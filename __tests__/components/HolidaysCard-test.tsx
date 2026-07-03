import HolidaysCard from '@/components/HolidaysCard';
import { useDebugStore } from '@/debug/debugStore';
import { useHolidaysStore } from '@/store/holidaysStore';
import { useLanguageStore } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { YearlyHolidays } from '@/types/holiday.types';
import { render, screen } from '@testing-library/react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
// holidaysStore → deviceSettingsStore → react-native-notify-kit (native, unavailable in jest)
jest.mock('@/store/deviceSettingsStore', () => ({
  useDeviceSettingsStore: { getState: jest.fn(() => ({ internetConnection: true })) },
}));
jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  init: jest.fn(),
}));
jest.mock('@react-native-vector-icons/material-design-icons/static', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { MaterialDesignIcons: ({ name }: any) => React.createElement(View, { testID: `mci-${name}` }) };
});

const mockTheme = {
  card: '#f5f5f5', divider2: '#ddd', textMuted: '#888', placeholder: '#999',
  islamicGreen: '#0a0', pink: '#f6a',
} as any;

const mockTr = { labels: { days: 'days' } } as any;

function setHolidays(yearlyHolidays: YearlyHolidays | null) {
  useHolidaysStore.setState({ yearlyHolidays });
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-06-16T12:00:00Z'));
  useThemeStore.setState({ theme: mockTheme });
  useLanguageStore.setState({ tr: mockTr, language: 'en' as any });
  useDebugStore.setState({ forceHoliday: false });
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
  useDebugStore.setState({ forceHoliday: false });
});

describe('HolidaysCard', () => {
  it('renders nothing when there are no holidays loaded', () => {
    setHolidays(null);
    render(<HolidaysCard />);
    expect(screen.toJSON()).toBeNull();
  });

  describe('debug mode (forced fake holiday)', () => {
    beforeEach(() => {
      useDebugStore.setState({ forceHoliday: true });
    });

    it('renders the hardcoded Ramadan preview when holidays exist', () => {
      setHolidays({ ramadan_start: ['2026-02-18'] });
      render(<HolidaysCard />);
      expect(screen.getByText('Ramadan')).toBeTruthy();
      expect(screen.getByText('3')).toBeTruthy();          // daysUntil
      expect(screen.getByText('15.06.2026')).toBeTruthy();  // formatted fake date
      expect(screen.getByText('days')).toBeTruthy();
      expect(screen.getByTestId('mci-star-crescent')).toBeTruthy();
    });
  });

  describe('real computation (toggle off)', () => {
    it('renders the nearest in-window holiday with name, date, days and icon', () => {
      // today = 2026-06-16; eid_adha 3 days away, within its 7-day window
      setHolidays({ eid_adha: ['2026-06-19'] });
      render(<HolidaysCard />);
      expect(screen.getByText('Eid al-Adha')).toBeTruthy();
      expect(screen.getByText('3')).toBeTruthy();
      expect(screen.getByText('19.06.2026')).toBeTruthy();
      expect(screen.getByTestId('mci-sheep')).toBeTruthy();
    });

    it('renders nothing when no holiday is within its window', () => {
      setHolidays({ eid_adha: ['2026-12-10'] }); // far beyond the 7-day window
      render(<HolidaysCard />);
      expect(screen.toJSON()).toBeNull();
    });
  });
});
