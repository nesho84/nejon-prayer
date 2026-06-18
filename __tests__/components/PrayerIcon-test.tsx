import PrayerIcon from '@/components/PrayerIcon';
import { render, screen } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    Ionicons: ({ name }: { name: string }) => React.createElement('View', { testID: `ion-${name}` }),
    MaterialCommunityIcons: ({ name }: { name: string }) => React.createElement('View', { testID: `mci-${name}` }),
  };
});

describe('PrayerIcon', () => {
  it('renders moon-outline for Fajr', () => {
    render(<PrayerIcon name="Fajr" size={24} color="#fff" />);
    expect(screen.getByTestId('ion-moon-outline')).toBeTruthy();
  });

  it('renders time-outline for Imsak', () => {
    render(<PrayerIcon name="Imsak" size={24} color="#fff" />);
    expect(screen.getByTestId('ion-time-outline')).toBeTruthy();
  });

  it('renders weather-sunset-up for Sunrise', () => {
    render(<PrayerIcon name="Sunrise" size={24} color="#fff" />);
    expect(screen.getByTestId('mci-weather-sunset-up')).toBeTruthy();
  });

  it('renders sunny for Dhuhr', () => {
    render(<PrayerIcon name="Dhuhr" size={24} color="#fff" />);
    expect(screen.getByTestId('ion-sunny')).toBeTruthy();
  });

  it('renders partly-sunny-outline for Asr', () => {
    render(<PrayerIcon name="Asr" size={24} color="#fff" />);
    expect(screen.getByTestId('ion-partly-sunny-outline')).toBeTruthy();
  });

  it('renders weather-sunset-down for Maghrib', () => {
    render(<PrayerIcon name="Maghrib" size={24} color="#fff" />);
    expect(screen.getByTestId('mci-weather-sunset-down')).toBeTruthy();
  });

  it('renders moon-sharp for Isha', () => {
    render(<PrayerIcon name="Isha" size={24} color="#fff" />);
    expect(screen.getByTestId('ion-moon-sharp')).toBeTruthy();
  });

  it('falls back to time-outline for an unknown prayer name', () => {
    render(<PrayerIcon name="Midnight" size={24} color="#fff" />);
    expect(screen.getByTestId('ion-time-outline')).toBeTruthy();
  });

  it('is case-insensitive — FAJR renders same icon as fajr', () => {
    render(<PrayerIcon name="FAJR" size={24} color="#fff" />);
    expect(screen.getByTestId('ion-moon-outline')).toBeTruthy();
  });
});
