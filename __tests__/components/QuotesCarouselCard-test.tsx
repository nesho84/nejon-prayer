import QuotesCarouselCard from '@/components/QuotesCarouselCard';
import { useLanguageStore } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    Ionicons: ({ name }: { name: string }) => React.createElement('View', { testID: `icon-${name}` }),
  };
});

const mockTheme = { accent: '#007AFF', text2: '#555', card: '#fff' };

beforeEach(() => {
  useThemeStore.setState({ theme: mockTheme as any });
  useLanguageStore.setState({ language: 'en' as any });
});

describe('QuotesCarouselCard', () => {
  it('renders empty view before layout is measured', () => {
    const { toJSON } = render(<QuotesCarouselCard />);
    // Before onLayout fires, renders a plain View with no quotes
    expect(toJSON()).toBeTruthy();
  });

  it('renders quotes after layout is measured', () => {
    const { UNSAFE_getAllByType } = render(<QuotesCarouselCard />);
    const { View } = require('react-native');

    // fire onLayout to set containerWidth
    const views = UNSAFE_getAllByType(View);
    const layoutView = views.find(v => v.props.onLayout);

    if (!layoutView) {
      throw new Error('onLayout View not found');
    }

    fireEvent(layoutView, 'layout', { nativeEvent: { layout: { width: 300 } } });

    // After layout, FlatList should be rendered
    expect(screen.getAllByTestId('icon-book-outline').length).toBeGreaterThan(0);
  });
});
