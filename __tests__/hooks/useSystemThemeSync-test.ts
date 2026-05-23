jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));

jest.mock('react-native', () => ({
  Appearance: {
    addChangeListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

jest.mock('@/store/themeStore', () => ({
  useThemeStore: jest.fn(),
}));

import { useSystemThemeSync } from '@/hooks/useSystemThemeSync';
import { useThemeStore } from '@/store/themeStore';
import { renderHook } from '@testing-library/react-native';
import { Appearance } from 'react-native';

const mockAddChangeListener = Appearance.addChangeListener as jest.Mock;

let mockApplySystemTheme: jest.Mock;

function mockStoreWith(themeMode: string) {
  (useThemeStore as unknown as jest.Mock).mockImplementation((selector: Function) =>
    selector({ themeMode, applySystemTheme: mockApplySystemTheme })
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockApplySystemTheme = jest.fn();
  mockAddChangeListener.mockReturnValue({ remove: jest.fn() });
});

describe('useSystemThemeSync — listener setup', () => {
  it('registers an Appearance listener when themeMode is "system"', () => {
    mockStoreWith('system');
    renderHook(() => useSystemThemeSync());
    expect(mockAddChangeListener).toHaveBeenCalledTimes(1);
  });

  it('does not register a listener when themeMode is "light"', () => {
    mockStoreWith('light');
    renderHook(() => useSystemThemeSync());
    expect(mockAddChangeListener).not.toHaveBeenCalled();
  });

  it('does not register a listener when themeMode is "dark"', () => {
    mockStoreWith('dark');
    renderHook(() => useSystemThemeSync());
    expect(mockAddChangeListener).not.toHaveBeenCalled();
  });
});

describe('useSystemThemeSync — listener callback', () => {
  it('calls applySystemTheme(true) when OS switches to dark', () => {
    mockStoreWith('system');
    renderHook(() => useSystemThemeSync());
    const listener = mockAddChangeListener.mock.calls[0][0];
    listener({ colorScheme: 'dark' });
    expect(mockApplySystemTheme).toHaveBeenCalledWith(true);
  });

  it('calls applySystemTheme(false) when OS switches to light', () => {
    mockStoreWith('system');
    renderHook(() => useSystemThemeSync());
    const listener = mockAddChangeListener.mock.calls[0][0];
    listener({ colorScheme: 'light' });
    expect(mockApplySystemTheme).toHaveBeenCalledWith(false);
  });
});

describe('useSystemThemeSync — cleanup', () => {
  it('removes the Appearance subscription on unmount', () => {
    const mockRemove = jest.fn();
    mockAddChangeListener.mockReturnValue({ remove: mockRemove });
    mockStoreWith('system');
    const { unmount } = renderHook(() => useSystemThemeSync());
    unmount();
    expect(mockRemove).toHaveBeenCalled();
  });
});
