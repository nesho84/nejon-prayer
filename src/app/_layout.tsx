import AppLoading from "@/components/AppLoading";
import ModalProvider from "@/components/ModalProvider";
import { useAdsSync } from "@/hooks/useAdsSync";
import { useAutoModalsSync } from "@/hooks/useAutoModalsSync";
import { useDeviceSettingsSync } from "@/hooks/useDeviceSettingsSync";
import { useHolidaysSync } from "@/hooks/useHolidaysSync";
import { useLocationChangeSync } from "@/hooks/useLocationChangeSync";
import { useNotificationsSync } from "@/hooks/useNotificationsSync";
import { usePrayerTimesSync } from "@/hooks/usePrayerTimesSync";
import { useQuranSync } from "@/hooks/useQuranSync";
import { useSupporterSync } from "@/hooks/useSupporterSync";
import { useSystemThemeSync } from "@/hooks/useSystemThemeSync";
import { useOnboardingStore } from "@/store/onboardingStore";
import * as Sentry from '@sentry/react-native';
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";

// Initialize Sentry for error tracking (disabled in dev)
Sentry.init({
  dsn: 'https://df36491525a3844176da451e9b5710de@o4511285567488000.ingest.de.sentry.io/4511285569126480',
  enabled: !__DEV__,
  enableLogs: false,
  tracesSampleRate: 0,
  debug: false,
});

const RootStack = () => {
  const isReady = useOnboardingStore((state) => state.isReady);
  const onboardingComplete = useOnboardingStore((state) => state.onboardingComplete);

  if (!isReady) return <AppLoading />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Onboarding */}
      <Stack.Protected guard={!onboardingComplete}>
        <Stack.Screen name="(onboarding)" options={{ animation: "fade" }} />
      </Stack.Protected>

      {/* Main app only after onboarding */}
      <Stack.Protected guard={onboardingComplete} redirectTo="/onboarding">
        <Stack.Screen name="(tabs)" options={{ animation: "default" }} />
        <Stack.Screen name="extras" options={{ animation: "ios_from_right" }} />
        <Stack.Screen name="quran" options={{ animation: "ios_from_right" }} />
        {/* Modal Screens */}
        <Stack.Screen
          name="(modals)"
          options={{
            presentation: "transparentModal",
            animation: "slide_from_bottom"
          }}
        />
      </Stack.Protected>
    </Stack>
  );
}

function RootLayout() {
  // Initialization and global sync hooks
  // System light/dark mode
  useSystemThemeSync();
  // Permissions, on every return
  useDeviceSettingsSync();
  // Far-from-location warning
  useLocationChangeSync();
  // Reschedules on changes
  useNotificationsSync();
  // Reloads on a new day
  usePrayerTimesSync();
  // Yearly holidays fetch
  useHolidaysSync();
  // Quran text + audio state
  useQuranSync();
  // Play purchases, on every return
  useSupporterSync();
  // After onboarding: one auto modal
  useAutoModalsSync();
  // After onboarding: consent, then ads
  useAdsSync();

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootStack />
        <ModalProvider />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

export default RootLayout;
