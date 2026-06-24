jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  Linking: { openSettings: jest.fn(), canOpenURL: jest.fn(), openURL: jest.fn() },
  Share: { share: jest.fn(), sharedAction: 'sharedAction', dismissedAction: 'dismissedAction' },
}));
jest.mock('expo-application', () => ({ applicationId: 'com.nejon.nejonprayer' }));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));
jest.mock('expo-intent-launcher', () => ({ startActivityAsync: jest.fn() }));
jest.mock('react-native-notify-kit', () => ({
  __esModule: true,
  default: {
    isBatteryOptimizationEnabled: jest.fn(),
    openBatteryOptimizationSettings: jest.fn(),
    openAlarmPermissionSettings: jest.fn(),
    openNotificationSettings: jest.fn(),
  },
}));

import { copyText, openAlarmPermissionSettings, openBatteryOptimizationSettings, openExternalUrl, openNotificationSettings, shareText } from '@/utils/system';
import * as Clipboard from 'expo-clipboard';
import * as IntentLauncher from 'expo-intent-launcher';
import { Linking, Platform, Share } from 'react-native';
import notifee from 'react-native-notify-kit';

const mockIsBatteryOptimizationEnabled = notifee.isBatteryOptimizationEnabled as jest.Mock;
const mockOpenBatteryOptimizationSettings = notifee.openBatteryOptimizationSettings as jest.Mock;
const mockOpenAlarmPermissionSettings = notifee.openAlarmPermissionSettings as jest.Mock;
const mockOpenNotificationSettings = notifee.openNotificationSettings as jest.Mock;
const mockStartActivityAsync = IntentLauncher.startActivityAsync as jest.Mock;
const mockOpenSettings = Linking.openSettings as jest.Mock;
const mockCanOpenURL = Linking.canOpenURL as jest.Mock;
const mockOpenURL = Linking.openURL as jest.Mock;
const mockShare = Share.share as jest.Mock;
const mockSetStringAsync = Clipboard.setStringAsync as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  (Platform as { OS: string }).OS = 'android';
});

describe('openBatteryOptimizationSettings', () => {
  it('on iOS, opens the app settings page directly', async () => {
    (Platform as { OS: string }).OS = 'ios';

    await openBatteryOptimizationSettings();

    expect(mockOpenSettings).toHaveBeenCalledTimes(1);
    expect(mockIsBatteryOptimizationEnabled).not.toHaveBeenCalled();
  });

  it('on Android, when optimization is disabled, opens notifee\'s picker directly', async () => {
    mockIsBatteryOptimizationEnabled.mockResolvedValue(false);

    await openBatteryOptimizationSettings();

    expect(mockStartActivityAsync).not.toHaveBeenCalled();
    expect(mockOpenBatteryOptimizationSettings).toHaveBeenCalledTimes(1);
  });

  it('on Android, when optimization is enabled, deep-links via IntentLauncher and stops there', async () => {
    mockIsBatteryOptimizationEnabled.mockResolvedValue(true);
    mockStartActivityAsync.mockResolvedValue(undefined);

    await openBatteryOptimizationSettings();

    expect(mockStartActivityAsync).toHaveBeenCalledWith(
      'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
      { data: 'package:com.nejon.nejonprayer' }
    );
    expect(mockOpenBatteryOptimizationSettings).not.toHaveBeenCalled();
  });

  it('on Android, falls back to notifee\'s picker when the IntentLauncher deep-link fails', async () => {
    mockIsBatteryOptimizationEnabled.mockResolvedValue(true);
    mockStartActivityAsync.mockRejectedValue(new Error('no matching activity'));

    await openBatteryOptimizationSettings();

    expect(mockStartActivityAsync).toHaveBeenCalledTimes(1);
    expect(mockOpenBatteryOptimizationSettings).toHaveBeenCalledTimes(1);
  });
});

describe('openAlarmPermissionSettings', () => {
  it('on iOS, opens the app settings page directly', async () => {
    (Platform as { OS: string }).OS = 'ios';

    await openAlarmPermissionSettings();

    expect(mockOpenSettings).toHaveBeenCalledTimes(1);
    expect(mockOpenAlarmPermissionSettings).not.toHaveBeenCalled();
  });

  it('on Android, opens notifee\'s alarm permission screen', async () => {
    await openAlarmPermissionSettings();

    expect(mockOpenAlarmPermissionSettings).toHaveBeenCalledTimes(1);
    expect(mockOpenSettings).not.toHaveBeenCalled();
  });
});

describe('openNotificationSettings', () => {
  it('on iOS, opens the app settings page directly', async () => {
    (Platform as { OS: string }).OS = 'ios';

    await openNotificationSettings();

    expect(mockOpenSettings).toHaveBeenCalledTimes(1);
    expect(mockOpenNotificationSettings).not.toHaveBeenCalled();
  });

  it('on Android, opens notifee\'s notification settings screen', async () => {
    await openNotificationSettings();

    expect(mockOpenNotificationSettings).toHaveBeenCalledTimes(1);
    expect(mockOpenSettings).not.toHaveBeenCalled();
  });
});

describe('openExternalUrl', () => {
  it('opens the URL directly, without a canOpenURL pre-check', async () => {
    mockOpenURL.mockResolvedValue(undefined);

    await openExternalUrl('mailto:support@nejon.net');

    expect(mockCanOpenURL).not.toHaveBeenCalled();
    expect(mockOpenURL).toHaveBeenCalledWith('mailto:support@nejon.net');
  });

  it('fails silently when no app can handle the URL', async () => {
    mockOpenURL.mockRejectedValue(new Error('no activity found'));

    await expect(openExternalUrl('unsupported://scheme')).resolves.toBeUndefined();
  });
});

describe('shareText', () => {
  it('shares a "title\\n\\nbody" message and returns true when shared', async () => {
    mockShare.mockResolvedValue({ action: Share.sharedAction });

    const result = await shareText('Title', 'Body');

    expect(mockShare).toHaveBeenCalledWith(
      { title: 'Title', message: 'Title\n\nBody' },
      { dialogTitle: 'Title', subject: 'Title' }
    );
    expect(result).toBe(true);
  });

  it('shares just the title when body is empty', async () => {
    mockShare.mockResolvedValue({ action: Share.sharedAction });

    await shareText('Title', '');

    expect(mockShare).toHaveBeenCalledWith(
      { title: 'Title', message: 'Title' },
      { dialogTitle: 'Title', subject: 'Title' }
    );
  });

  it('uses a custom dialogTitle when provided, keeping subject as the title', async () => {
    mockShare.mockResolvedValue({ action: Share.sharedAction });

    await shareText('Nejon Prayer', 'https://example.com', 'Share App');

    expect(mockShare).toHaveBeenCalledWith(
      { title: 'Nejon Prayer', message: 'Nejon Prayer\n\nhttps://example.com' },
      { dialogTitle: 'Share App', subject: 'Nejon Prayer' }
    );
  });

  it('returns false when the sheet is dismissed', async () => {
    mockShare.mockResolvedValue({ action: Share.dismissedAction });

    expect(await shareText('Title', 'Body')).toBe(false);
  });

  it('returns false when sharing throws', async () => {
    mockShare.mockRejectedValue(new Error('share failed'));

    expect(await shareText('Title', 'Body')).toBe(false);
  });
});

describe('copyText', () => {
  it('copies a "title\\n\\nbody" string and returns true', async () => {
    mockSetStringAsync.mockResolvedValue(true);

    const result = await copyText('Title', 'Body');

    expect(mockSetStringAsync).toHaveBeenCalledWith('Title\n\nBody');
    expect(result).toBe(true);
  });

  it('copies just the title when body is empty', async () => {
    mockSetStringAsync.mockResolvedValue(true);

    await copyText('Title', '');

    expect(mockSetStringAsync).toHaveBeenCalledWith('Title');
  });

  it('returns false when copying throws', async () => {
    mockSetStringAsync.mockRejectedValue(new Error('copy failed'));

    expect(await copyText('Title', 'Body')).toBe(false);
  });
});
