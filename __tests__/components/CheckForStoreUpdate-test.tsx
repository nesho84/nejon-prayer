import CheckForStoreUpdate from '@/components/CheckForStoreUpdate';
import { useDebugStore } from '@/debug/debugStore';
import { useAutoModalsStore } from '@/store/autoModalsStore';
import { useLanguageStore } from '@/store/languageStore';
import { useModalStore } from '@/store/modalStore';
import { useThemeStore } from '@/store/themeStore';
import NetInfo from '@react-native-community/netinfo';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as ExpoInAppUpdates from 'expo-in-app-updates';
import { Linking, Platform } from 'react-native';

jest.mock('@/store/storage', () => ({
  mmkvStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('expo-in-app-updates', () => ({ checkForUpdate: jest.fn() }));
jest.mock('@react-native-community/netinfo', () => ({ fetch: jest.fn() }));
jest.mock('react-native-notify-kit', () => ({ __esModule: true, default: {} }));
jest.mock('@react-native-vector-icons/ionicons/static', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { Ionicons: ({ name }: any) => React.createElement(View, { testID: `icon-${name}` }) };
});
jest.mock('@react-native-vector-icons/material-design-icons/static', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { MaterialDesignIcons: ({ name }: any) => React.createElement(View, { testID: `icon-${name}` }) };
});

const mockTheme = {
  text2: '#111', textMuted: '#888', placeholder: '#aaa', primary: '#007AFF',
  islamicGreen: '#009000', danger: '#FF3B30', info: '#5AC8FA', overlay: 'rgba(0,0,0,0.05)',
  divider2: '#ddd',
} as any;

const mockTr = {
  labels: {
    checkUpdateRow: 'App Update',
    checkUpdateButton: 'Check for Update',
    checkUpdateInfo: 'Check if a new version is available',
    updateAvailableTitle: 'Update available',
    updateAvailableMessage: 'A new version is ready to install',
    upToDateMessage: 'You are up to date',
    updateCheckError: 'Could not check for updates',
  },
  buttons: { later: 'Later', openStore: 'Open Store' },
} as any;

const checkForUpdate = ExpoInAppUpdates.checkForUpdate as jest.Mock;
const netInfoFetch = NetInfo.fetch as jest.Mock;

beforeEach(() => {
  (Platform as { OS: string }).OS = 'android';
  useThemeStore.setState({ theme: mockTheme });
  useLanguageStore.setState({ tr: mockTr, language: 'en' as any });
  useDebugStore.setState({ storeUpdatePreview: 'idle' });
  useModalStore.setState({ visible: false, options: null, resolve: null });
  jest.clearAllMocks();
  netInfoFetch.mockResolvedValue({ isConnected: true });
});

describe('CheckForStoreUpdate', () => {
  it('renders the idle state with the check button', () => {
    render(<CheckForStoreUpdate />);
    expect(screen.getByText('Check for Update')).toBeTruthy();
    expect(screen.getByText('Check if a new version is available')).toBeTruthy();
  });

  it('shows the up-to-date message after a check finds no update', async () => {
    checkForUpdate.mockResolvedValueOnce({ updateAvailable: false });
    render(<CheckForStoreUpdate />);

    fireEvent.press(screen.getByText('Check for Update'));

    await waitFor(() => {
      expect(screen.getByText('You are up to date')).toBeTruthy();
    });
  });

  it('opens the update-available modal and resets the inline status when an update exists', async () => {
    checkForUpdate.mockResolvedValueOnce({ updateAvailable: true });
    render(<CheckForStoreUpdate />);

    fireEvent.press(screen.getByText('Check for Update'));

    await waitFor(() => {
      expect(useModalStore.getState().visible).toBe(true);
    });
    expect(screen.getByText('Check if a new version is available')).toBeTruthy();
  });

  it('does not count a manual open toward the startup check waits', async () => {
    useAutoModalsStore.setState({ storeUpdateShownCount: 0, storeUpdateNextShowAt: null, storeUpdateShownAt: null });
    checkForUpdate.mockResolvedValueOnce({ updateAvailable: true });
    render(<CheckForStoreUpdate />);

    fireEvent.press(screen.getByText('Check for Update'));

    await waitFor(() => {
      expect(useModalStore.getState().visible).toBe(true);
    });
    expect(useAutoModalsStore.getState().storeUpdateShownCount).toBe(0);
    expect(useAutoModalsStore.getState().storeUpdateShownAt).toBeNull();
  });

  it('opens the native Play Store deep link when "Open Store" is pressed in the update modal', async () => {
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    checkForUpdate.mockResolvedValueOnce({ updateAvailable: true });
    render(<CheckForStoreUpdate />);

    fireEvent.press(screen.getByText('Check for Update'));

    await waitFor(() => {
      expect(useModalStore.getState().visible).toBe(true);
    });

    const openStoreButton = useModalStore.getState().options?.buttons?.find(
      (button) => button.action === 'openStore'
    );
    openStoreButton?.onPress?.();

    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('market://')
      );
    });
  });

  it('shows the error message without asking Play when there is no connection', async () => {
    netInfoFetch.mockResolvedValueOnce({ isConnected: false });
    render(<CheckForStoreUpdate />);

    fireEvent.press(screen.getByText('Check for Update'));

    await waitFor(() => {
      expect(screen.getByText('Could not check for updates')).toBeTruthy();
    });
    expect(checkForUpdate).not.toHaveBeenCalled();
  });

  it('shows the error message when the check fails', async () => {
    checkForUpdate.mockRejectedValueOnce(new Error('network down'));
    render(<CheckForStoreUpdate />);

    fireEvent.press(screen.getByText('Check for Update'));

    await waitFor(() => {
      expect(screen.getByText('Could not check for updates')).toBeTruthy();
    });
  });

  describe('debug preview override', () => {
    afterEach(() => {
      useDebugStore.setState({ debugModeEnabled: false });
    });

    it('shows the up-to-date line without a real check when debug mode is on', () => {
      useDebugStore.setState({ storeUpdatePreview: 'upToDate', debugModeEnabled: true });
      render(<CheckForStoreUpdate />);
      expect(screen.getByText('You are up to date')).toBeTruthy();
    });

    it('shows the error line without a real check when debug mode is on', () => {
      useDebugStore.setState({ storeUpdatePreview: 'error', debugModeEnabled: true });
      render(<CheckForStoreUpdate />);
      expect(screen.getByText('Could not check for updates')).toBeTruthy();
    });

    it('ignores the preview when debug mode is off, even in a dev build', () => {
      useDebugStore.setState({ storeUpdatePreview: 'upToDate', debugModeEnabled: false });
      render(<CheckForStoreUpdate />);
      expect(screen.queryByText('You are up to date')).toBeNull();
    });
  });
});
