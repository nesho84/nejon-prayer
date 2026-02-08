import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useDeviceSettingsStore } from '@/store/deviceSettingsStore';

export function useDeviceSettingsSync() {
  const syncDeviceSettings = useDeviceSettingsStore((state) => state.syncDeviceSettings);

  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    // Initial sync on mount
    syncDeviceSettings();

    // Sync when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // console.log('👁‍🗨 AppState → active, syncing device settings...');
        syncDeviceSettings();
      }

      appStateRef.current = nextAppState;
      console.log('👁‍🗨 AppState →', appStateRef.current);
    });

    return () => subscription.remove();
  }, [syncDeviceSettings]);
}