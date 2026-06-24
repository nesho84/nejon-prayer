import NamaziPlusScreen from '@/app/extras/namazi/namazi-plus';
import { NAMAZI_PLUS_TR } from '@/constants/translations/namazi-plus.tr';
import { useLanguageStore } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
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
jest.mock('expo-navigation-bar', () => ({ NavigationBar: { setStyle: jest.fn() } }));
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const stub = ({ name }: { name: string }) =>
    React.createElement('View', { testID: `icon-${name}` });
  return {
    Ionicons: stub,
    MaterialCommunityIcons: stub,
  };
});
// Render header, items and footer so titles and rows are queryable.
jest.mock('@shopify/flash-list', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    FlashList: React.forwardRef(
      ({ data, renderItem, ListHeaderComponent, ListFooterComponent }: any, _ref: any) =>
        React.createElement(
          View,
          null,
          ListHeaderComponent ?? null,
          data?.map((item: any, i: number) => React.createElement(View, { key: i }, renderItem({ item }))),
          ListFooterComponent ?? null,
        )
    ),
  };
});

const mockTheme = {
  bg: '#fff', text: '#111', text2: '#555', textMuted: '#888', textSecondary: '#666',
  placeholder: '#999', card: '#f5f5f5', islamicGreen: '#1a8a00', accent2: '#FF6B00',
  statusbar: '#fff', divider2: '#ddd', border: '#ccc', overlayLight: 'rgba(0,0,0,0.05)',
} as any;

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme, resolvedTheme: 'light' as any });
  useLanguageStore.setState({ language: 'en' as any });
});

describe('NamaziPlusScreen', () => {
  const namaziPlusTr = NAMAZI_PLUS_TR.en;
  const prayerNames = Object.values(namaziPlusTr.prayers).map((p) => p.name);

  it('renders the header title and subtitle', () => {
    render(<NamaziPlusScreen />);
    expect(screen.getByText(namaziPlusTr.headerTitle)).toBeTruthy();
    expect(screen.getByText(namaziPlusTr.headerSubtitle)).toBeTruthy();
  });

  it('renders a row for every voluntary prayer', () => {
    render(<NamaziPlusScreen />);
    prayerNames.forEach((name) => expect(screen.getByText(name)).toBeTruthy());
  });

  it('renders the progress indicator starting at the first item', () => {
    render(<NamaziPlusScreen />);
    expect(screen.getByText(`1 / ${prayerNames.length}`)).toBeTruthy();
  });

  it('expands a prayer to reveal its details on press', () => {
    render(<NamaziPlusScreen />);
    // All rows collapsed initially → no up-chevron yet
    expect(screen.queryByTestId('icon-chevron-up')).toBeNull();
    fireEvent.press(screen.getByText(prayerNames[0]));
    // The pressed prayer is now expanded → exactly one up-chevron
    expect(screen.getByTestId('icon-chevron-up')).toBeTruthy();
  });
});
