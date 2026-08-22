import { DARK_COLORS, LIGHT_COLORS } from '@/constants/colors';
import { mmkvStorage } from '@/store/storage';
import { useThemeStore } from '@/store/themeStore';
import { SURFACE_THEMES } from '@/types/theme.types';
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
  useThemeStore.setState({ themeMode: 'system', theme: LIGHT_COLORS, resolvedTheme: 'light', surface: 'default', isReady: false });
});

// Feeds a persisted blob through the store's onRehydrateStorage
const rehydrate = async (blob: object) => {
  (mmkvStorage.getItem as jest.Mock).mockReturnValueOnce(JSON.stringify({ state: blob, version: 0 }));
  await useThemeStore.persist.rehydrate();
};

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

  it('setTheme("light") keeps a picked surface and applies that theme\'s version of it', () => {
    useThemeStore.setState({ surface: 'warm' });
    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().surface).toBe('warm');
    expect(useThemeStore.getState().theme).toEqual(SURFACE_THEMES.light.warm);
  });
});

describe('themeStore — setSurface', () => {
  it('defaults to "default" with the untouched theme', () => {
    expect(useThemeStore.getState().surface).toBe('default');
    expect(useThemeStore.getState().theme).toEqual(LIGHT_COLORS);
  });

  it('setSurface("warm") recolors only the card tokens', () => {
    useThemeStore.getState().setSurface('warm');
    const { surface, theme } = useThemeStore.getState();
    expect(surface).toBe('warm');
    expect(theme.card).toBe(SURFACE_THEMES.light.warm.card);
    expect(theme.card2).toBe(SURFACE_THEMES.light.warm.card2);
    expect(theme.card3).toBe(SURFACE_THEMES.light.warm.card3);
    expect(theme.borderCard).toBe(SURFACE_THEMES.light.warm.borderCard);
    expect(theme.bg).toBe(LIGHT_COLORS.bg);
    expect(theme.text).toBe(LIGHT_COLORS.text);
    expect(theme.accent).toBe(LIGHT_COLORS.accent);
  });

  it('setSurface("default") restores the untouched theme exactly', () => {
    useThemeStore.getState().setSurface('warm');
    useThemeStore.getState().setSurface('default');
    expect(useThemeStore.getState().theme).toEqual(LIGHT_COLORS);
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

  it('keeps a picked surface and applies its dark variant', () => {
    useThemeStore.setState({ themeMode: 'system', surface: 'warm' });
    useThemeStore.getState().applySystemTheme(true);
    expect(useThemeStore.getState().surface).toBe('warm');
    expect(useThemeStore.getState().theme).toEqual(SURFACE_THEMES.dark.warm);
  });
});

describe('themeStore — rehydration', () => {
  it('a blob without a surface key stays on "default" — the upgrade path', async () => {
    await rehydrate({ themeMode: 'dark' });
    expect(useThemeStore.getState().surface).toBe('default');
    expect(useThemeStore.getState().theme).toEqual(DARK_COLORS);
  });

  it('applies a stored surface', async () => {
    await rehydrate({ themeMode: 'dark', surface: 'warm' });
    expect(useThemeStore.getState().surface).toBe('warm');
    expect(useThemeStore.getState().theme).toEqual(SURFACE_THEMES.dark.warm);
  });

  it('falls back to "default" when the stored key no longer exists', async () => {
    await rehydrate({ themeMode: 'dark', surface: 'sunset' });
    expect(useThemeStore.getState().surface).toBe('default');
    expect(useThemeStore.getState().theme).toEqual(DARK_COLORS);
  });
});