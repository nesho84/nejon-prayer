import HolidaysCard from '@/components/HolidaysCard';
import { useDebugStore } from '@/debug/debugStore';
import { useHolidaysStore } from '@/store/holidaysStore';
import { useLanguageStore } from '@/store/languageStore';
import { useModalStore } from '@/store/modalStore';
import { useThemeStore } from '@/store/themeStore';
import { YearlyHolidays } from '@/types/holiday.types';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

// system.ts (shareText) imports react-native-notify-kit directly, which is native/unavailable in jest.
jest.mock('react-native-notify-kit', () => ({ __esModule: true, default: {} }));
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
jest.mock('@react-native-vector-icons/feather/static', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { Feather: ({ name }: any) => React.createElement(View, { testID: `feather-${name}` }) };
});

const mockTheme = {
  card: '#f5f5f5', divider2: '#ddd', textMuted: '#888', placeholder: '#999',
  islamicGreen: '#0a0', pink: '#f6a', accent: '#07a', accentLight: '#cef', text2: '#333',
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
  useModalStore.setState({ visible: false, options: null, resolve: null });
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
      expect(screen.getByText('3')).toBeTruthy();           // daysUntil
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
      // countdown replaces the action icons here
      expect(screen.queryByTestId('share-eid_adha')).toBeNull();
    });

    it('renders nothing when no holiday is within its window', () => {
      setHolidays({ eid_adha: ['2026-12-10'] }); // far beyond the 7-day window
      render(<HolidaysCard />);
      expect(screen.toJSON()).toBeNull();
    });

    it('opens the info modal on press instead of navigating', () => {
      setHolidays({ eid_adha: ['2026-06-19'] });
      render(<HolidaysCard testID="card" />);
      fireEvent.press(screen.getByTestId('card'));

      const { visible, options } = useModalStore.getState();
      expect(visible).toBe(true);

      // The banner carries the info icon, the holiday name and its info text
      render(options!.component as React.ReactElement);
      expect(screen.getByTestId('feather-info')).toBeTruthy();
      expect(screen.getByText('Eid al-Adha')).toBeTruthy();
      expect(screen.getByText(/Ibrahim/)).toBeTruthy();
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

    it('opens the info modal from the info icon, and is not itself pressable', () => {
      setHolidays({ eid_adha: ['2026-12-10'] }); // nothing upcoming — the row must still render
      render(
        <HolidaysCard testID="row" holiday={{ name: 'eid_fitr', gregorianDate: '2027-03-09' }} />
      );

      // the row is a plain view — no touch responder of its own
      expect(screen.getByTestId('row').props.onStartShouldSetResponder).toBeUndefined();

      expect(useModalStore.getState().visible).toBe(false);
      fireEvent.press(screen.getByTestId('info-eid_fitr'));

      const { visible, options } = useModalStore.getState();
      expect(visible).toBe(true);
      expect(options?.type).toBe('alert');
      expect(options?.buttons).toHaveLength(1);
    });

    it('shares the holiday and flips the icon to a checkmark', async () => {
      const { Share } = require('react-native');
      Share.share = jest.fn(() => Promise.resolve({ action: Share.sharedAction }));
      setHolidays({ eid_adha: ['2026-12-10'] });
      render(<HolidaysCard holiday={{ name: 'eid_fitr', gregorianDate: '2027-03-09' }} />);

      expect(screen.getByTestId('feather-share-2')).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByTestId('share-eid_fitr'));
      });

      expect(Share.share).toHaveBeenCalledWith(
        { title: 'Eid al-Fitr', message: 'Eid al-Fitr\n\nFeast of breaking the fast\n\n09.03.2027' },
        { dialogTitle: 'Eid al-Fitr', subject: 'Eid al-Fitr' }
      );
      expect(screen.getByTestId('feather-check')).toBeTruthy();
    });
  });
});
