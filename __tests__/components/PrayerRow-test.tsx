import PrayerRow from '@/components/PrayerRow';
import { useLanguageStore } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('@react-native-vector-icons/ionicons/static', () => {
  const React = require('react');
  return { Ionicons: ({ name }: { name: string }) => React.createElement('View', { testID: `ion-${name}` }) };
});
jest.mock('@react-native-vector-icons/material-design-icons/static', () => {
  const React = require('react');
  return { MaterialDesignIcons: ({ name }: { name: string }) => React.createElement('View', { testID: `mci-${name}` }) };
});

const mockTheme = {
  text: '#222', text2: '#555', accent: '#007AFF', accentLight: '#e0f0ff', card: '#fff',
  borderCard: '#ddd', placeholder: '#999', green: '#0a0', white: '#fff',
  surfaceBg: '#f0f0f0', divider2: '#eee', islamicGreen: '#0b6',
};
const mockTr = {
  prayers: { Fajr: 'Fajr', Dhuhr: 'Dhuhr', Sunrise: 'Sunrise' },
  labels: { jummah: 'Xhumaja' },
};

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme as any });
  useLanguageStore.setState({ tr: mockTr as any });
});

describe('PrayerRow', () => {
  it('renders the prayer name and time', () => {
    render(<PrayerRow prayerName="Fajr" prayerTime="04:50" isTrackable isPrayed={false} />);
    expect(screen.getByText('Fajr')).toBeTruthy();
    expect(screen.getByText('04:50')).toBeTruthy();
  });

  it('calls onTrackingPress when a trackable row is pressed', () => {
    const onTrackingPress = jest.fn();
    render(<PrayerRow prayerName="Fajr" prayerTime="04:50" isTrackable isPrayed={false} onTrackingPress={onTrackingPress} />);
    fireEvent.press(screen.getByText('Fajr'));
    expect(onTrackingPress).toHaveBeenCalledTimes(1);
  });

  it('renders a dash placeholder for a non-trackable row', () => {
    render(<PrayerRow prayerName="Sunrise" prayerTime="06:15" isTrackable={false} isPrayed={false} />);
    expect(screen.getByText('Sunrise')).toBeTruthy();
    expect(screen.getByTestId('mci-minus')).toBeTruthy();
  });

  it('renders the notification bell only when onNotifPress is provided', () => {
    const { rerender } = render(
      <PrayerRow prayerName="Fajr" prayerTime="04:50" isTrackable isPrayed={false} variant="card" notifState="off" onNotifIconPress={jest.fn()} />
    );
    expect(screen.getByTestId('mci-bell-off-outline')).toBeTruthy();

    rerender(<PrayerRow prayerName="Fajr" prayerTime="04:50" isTrackable isPrayed={false} variant="plain" />);
    expect(screen.queryByTestId('mci-bell-off-outline')).toBeNull();
  });

  it('maps notifState to the matching bell icon', () => {
    const { rerender } = render(
      <PrayerRow prayerName="Fajr" prayerTime="04:50" isTrackable isPrayed={false} notifState="on" onNotifIconPress={jest.fn()} />
    );
    expect(screen.getByTestId('mci-bell-outline')).toBeTruthy();

    rerender(<PrayerRow prayerName="Fajr" prayerTime="04:50" isTrackable isPrayed={false} notifState="custom" onNotifIconPress={jest.fn()} />);
    expect(screen.getByTestId('mci-bell-cog-outline')).toBeTruthy();
  });

  it('shows the Xhumaja badge for Dhuhr on Fridays', () => {
    const { rerender } = render(
      <PrayerRow prayerName="Dhuhr" prayerTime="12:00" isTrackable isPrayed={false} isFriday />
    );
    expect(screen.getByText('Xhumaja')).toBeTruthy();

    rerender(<PrayerRow prayerName="Dhuhr" prayerTime="12:00" isTrackable isPrayed={false} isFriday={false} />);
    expect(screen.queryByText('Xhumaja')).toBeNull();
  });
});
