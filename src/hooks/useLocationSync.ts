import { useLocationStore } from '@/store/locationStore';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

// ------------------------------------------------------------
// Detects when the user has travelled far from their saved prayer location.
// Runs on mount and on every foreground — the check itself is throttled and
// permission-gated inside the store, so it is safe to call on every event.
// ------------------------------------------------------------
export function useLocationSync() {
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    // Initial check on mount
    useLocationStore.getState().checkLocationChange();

    // Re-check when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        useLocationStore.getState().checkLocationChange();
      }

      appStateRef.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);
}
