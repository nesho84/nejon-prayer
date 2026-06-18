import PrayerCountdownCard from '@/components/PrayerCountdownCard';
import { useLanguageStore } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { render, screen } from '@testing-library/react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('react-native-svg', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }: any) => React.createElement('View', { testID: 'svg' }, children),
    Circle: () => React.createElement('View', { testID: 'circle' }),
  };
});
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    Ionicons: ({ name }: { name: string }) =>
      React.createElement('View', { testID: `icon-${name}` }),
    MaterialCommunityIcons: ({ name }: { name: string }) =>
      React.createElement('View', { testID: `icon-${name}` }),
  };
});

const mockTheme = { text: '#111', text2: '#555', accent: '#007AFF' };
const mockTr = { prayers: { Fajr: 'Fajr', Dhuhr: 'Dhuhr', Asr: 'Asr' } };

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme as any });
  useLanguageStore.setState({ tr: mockTr as any });
});

const baseProps = {
  prevPrayer: { name: 'Fajr' as any, time: '05:00' },
  nextPrayerName: 'Dhuhr' as any,
  afterNextPrayer: { name: 'Asr' as any, time: '15:30' },
  prayerCountdown: { hours: '02', minutes: '30', seconds: '15' },
  remainingSeconds: 9015,
  totalSeconds: 18000,
};

describe('PrayerCountdownCard', () => {
  it('renders next prayer name and countdown', () => {
    render(<PrayerCountdownCard {...baseProps} />);
    expect(screen.getByText('» Dhuhr «')).toBeTruthy();
    // countdown digits are inline text nodes — match via regex on parent text content
    expect(screen.getByText(/02.*30.*15/s)).toBeTruthy();
    // side prayers render
    expect(screen.getByText('05:00')).toBeTruthy();
    expect(screen.getByText('15:30')).toBeTruthy();
  });

  it('renders nothing when required props are missing', () => {
    const { toJSON } = render(
      <PrayerCountdownCard {...baseProps} nextPrayerName={null} />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders SVG circle', () => {
    render(<PrayerCountdownCard {...baseProps} />);
    expect(screen.getByTestId('svg')).toBeTruthy();
  });
});
