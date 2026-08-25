import HolidaysCard from '@/components/HolidaysCard';
import { useDebugStore } from '@/debug/debugStore';
import { useHolidaysStore } from '@/store/holidaysStore';
import { useLanguageStore } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { YearlyHolidays } from '@/types/holiday.types';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Text } from 'react-native';

jest.mock('expo-router', () => ({ router: { navigate: jest.fn() } }));

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

  // Used as a list row by extras/holidays.tsx
  describe('given a holiday', () => {
    it('renders the passed holiday even when nothing is upcoming', () => {
      setHolidays({ eid_adha: ['2026-12-10'] }); // nothing in window → self-computing mode renders null
      render(<HolidaysCard holiday={{ name: 'eid_fitr', gregorianDate: '2027-03-09' }} />);
      expect(screen.getByText('Eid al-Fitr')).toBeTruthy();
      expect(screen.getByText('09.03.2027')).toBeTruthy();
      expect(screen.getByTestId('mci-creation-outline')).toBeTruthy();
    });

    it('renders the right node instead of the days block', () => {
      setHolidays({ eid_adha: ['2026-06-19'] }); // would be 3 days away in self-computing mode
      render(
        <HolidaysCard
          holiday={{ name: 'eid_adha', gregorianDate: '2026-06-19' }}
          right={<Text>share</Text>}
        />
      );
      expect(screen.getByText('share')).toBeTruthy();
      expect(screen.queryByText('3')).toBeNull();
      expect(screen.queryByText('days')).toBeNull();
    });

    it('is a plain row — only the self-computing card navigates on press', () => {
      setHolidays({ eid_adha: ['2026-06-19'] });

      render(<HolidaysCard testID="card" />);
      fireEvent.press(screen.getByTestId('card'));
      expect(router.navigate).toHaveBeenCalledWith('/extras/holidays');

      screen.rerender(
        <HolidaysCard testID="row" holiday={{ name: 'eid_adha', gregorianDate: '2026-06-19' }} />
      );
      expect(screen.getByTestId('row').props.onStartShouldSetResponder).toBeUndefined();
    });
  });
});
