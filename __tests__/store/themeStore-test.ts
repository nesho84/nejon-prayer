import { DARK_COLORS, LIGHT_COLORS } from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';
import { Appearance } from 'react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('react-native', () => ({
  Appearance: { getColorScheme: jest.fn(() => 'light') },
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj.ios ?? obj.default, Version: 0 },
}));

const mockGetColorScheme = Appearance.getColorScheme as jest.Mock;

beforeEach(() => {
  mockGetColorScheme.mockReturnValue('light');
  useThemeStore.setState({ themeMode: 'system', theme: LIGHT_COLORS, resolvedTheme: 'light', isReady: false });
});

describe('themeStore — setTheme', () => {
  it('setTheme("light") sets resolvedTheme to light and uses LIGHT_COLORS', () => {
    useThemeStore.getState().setTheme('light');
    const { themeMode, resolvedTheme, theme } = useThemeStore.getState();
    expect(themeMode).toBe('light');
    expect(resolvedTheme).toBe('light');
    expect(theme).toEqual(LIGHT_COLORS);
  });

  it('setTheme("dark") sets resolvedTheme to dark and uses DARK_COLORS', () => {
    useThemeStore.getState().setTheme('dark');
    const { themeMode, resolvedTheme, theme } = useThemeStore.getState();
    expect(themeMode).toBe('dark');
    expect(resolvedTheme).toBe('dark');
    expect(theme).toEqual(DARK_COLORS);
  });

  it('setTheme("system") resolves using Appearance.getColorScheme() — light', () => {
    mockGetColorScheme.mockReturnValue('light');
    useThemeStore.getState().setTheme('system');
    expect(useThemeStore.getState().resolvedTheme).toBe('light');
    expect(useThemeStore.getState().theme).toEqual(LIGHT_COLORS);
  });

  it('setTheme("system") resolves using Appearance.getColorScheme() — dark', () => {
    mockGetColorScheme.mockReturnValue('dark');
    useThemeStore.getState().setTheme('system');
    expect(useThemeStore.getState().resolvedTheme).toBe('dark');
    expect(useThemeStore.getState().theme).toEqual(DARK_COLORS);
  });
});

describe('themeStore — applySystemTheme', () => {
  it('applies dark theme when mode is "system" and isDark is true', () => {
    useThemeStore.setState({ themeMode: 'system' });
    useThemeStore.getState().applySystemTheme(true);
    expect(useThemeStore.getState().resolvedTheme).toBe('dark');
    expect(useThemeStore.getState().theme).toEqual(DARK_COLORS);
  });

  it('applies light theme when mode is "system" and isDark is false', () => {
    useThemeStore.setState({ themeMode: 'system' });
    useThemeStore.getState().applySystemTheme(false);
    expect(useThemeStore.getState().resolvedTheme).toBe('light');
    expect(useThemeStore.getState().theme).toEqual(LIGHT_COLORS);
  });

  it('does not change theme when mode is not "system"', () => {
    useThemeStore.setState({ themeMode: 'light', resolvedTheme: 'light', theme: LIGHT_COLORS });
    useThemeStore.getState().applySystemTheme(true);
    expect(useThemeStore.getState().resolvedTheme).toBe('light');
    expect(useThemeStore.getState().theme).toEqual(LIGHT_COLORS);
  });
});