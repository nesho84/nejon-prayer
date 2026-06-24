import QuotesScreen from '@/app/extras/quotes';
import { QUOTES_TR } from '@/constants/translations/quotes.tr';
import { useLanguageStore } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

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
jest.mock('react-native-notify-kit', () => ({ __esModule: true, default: {} }));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-navigation-bar', () => ({ NavigationBar: { setStyle: jest.fn() } }));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(() => Promise.resolve()) }));
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    Feather: ({ name }: { name: string }) => React.createElement('View', { testID: `icon-${name}` }),
  };
});
// Render header, items and footer so titles and actions are queryable.
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
          data?.map((item: any, i: number) => React.createElement(View, { key: i }, renderItem({ item, index: i }))),
          ListFooterComponent ?? null,
        )
    ),
  };
});

const mockTheme = {
  bg: '#fff', text: '#111', text2: '#555', placeholder: '#999', card: '#f5f5f5',
  card2: '#ececec', accent2: '#FF6B00', success: '#34c759', statusbar: '#fff',
  divider2: '#ddd', border: '#ccc',
} as any;

const mockTr = {
  labels: { quotes: 'Quotes', quotesDesc: 'Words of wisdom', quotesFooter: 'May these inspire you' },
  buttons: { copy: 'Copy', copied: 'Copied', share: 'Share', shared: 'Shared' },
} as any;

beforeEach(() => {
  jest.useFakeTimers(); // handleCopy/handleShare schedule a setTimeout that must not leak into real time
  useThemeStore.setState({ theme: mockTheme, resolvedTheme: 'light' as any });
  useLanguageStore.setState({ tr: mockTr, language: 'en' as any });
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('QuotesScreen', () => {
  const quotes = QUOTES_TR.en;

  it('renders the header title, subtitle and footer', () => {
    render(<QuotesScreen />);
    expect(screen.getByText('Quotes')).toBeTruthy();
    expect(screen.getByText('Words of wisdom')).toBeTruthy();
    expect(screen.getByText('May these inspire you')).toBeTruthy();
  });

  it('renders the progress indicator starting at the first quote', () => {
    render(<QuotesScreen />);
    expect(screen.getByText(`1 / ${quotes.length}`)).toBeTruthy();
  });

  it('renders a Copy and Share action for every quote', () => {
    render(<QuotesScreen />);
    expect(screen.getAllByText('Copy')).toHaveLength(quotes.length);
    expect(screen.getAllByText('Share')).toHaveLength(quotes.length);
  });

  it('copies the quote to the clipboard when Copy is pressed', async () => {
    const Clipboard = require('expo-clipboard');
    render(<QuotesScreen />);
    await act(async () => {
      fireEvent.press(screen.getAllByText('Copy')[0]);
    });
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(`Quotes\n\n${quotes[0]}`);
  });

  it('invokes the native share sheet when Share is pressed', async () => {
    const { Share } = require('react-native');
    Share.share = jest.fn(() => Promise.resolve({ action: 'sharedAction' }));
    render(<QuotesScreen />);
    await act(async () => {
      fireEvent.press(screen.getAllByText('Share')[0]);
    });
    expect(Share.share).toHaveBeenCalledWith(
      { title: 'Quotes', message: `Quotes\n\n${quotes[0]}` },
      expect.objectContaining({ dialogTitle: 'Quotes' })
    );
  });
});
