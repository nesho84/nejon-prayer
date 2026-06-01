import AppLoading from "@/components/AppLoading";
import ModalProvider from "@/components/ModalProvider";
import { useDeviceSettingsSync } from "@/hooks/useDeviceSettingsSync";
import { useNotificationsSync } from "@/hooks/useNotificationsSync";
import { usePrayerTimesSync } from "@/hooks/usePrayerTimesSync";
import { useQuranSetup } from "@/hooks/useQuranSetup";
import { useSystemThemeSync } from "@/hooks/useSystemThemeSync";
import { useOnboardingStore } from "@/store/onboardingStore";
import * as Sentry from '@sentry/react-native';
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";

// Initialize Sentry for error tracking and performance monitoring
Sentry.init({
  dsn: 'https://df36491525a3844176da451e9b5710de@o4511285567488000.ingest.de.sentry.io/4511285569126480',
  enabled: !__DEV__,
  enableLogs: true,
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
      <Stack.Protected guard={onboardingComplete}>
        <Stack.Screen name="(tabs)" options={{ animation: "default" }} />
        <Stack.Screen name="extras" options={{ animation: "ios_from_right" }} />
        <Stack.Screen name="quran" options={{ animation: "ios_from_right" }} />
        {/* Modal Screens */}
        <Stack.Screen name="(modals)" options={{ presentation: "transparentModal", animation: "slide_from_bottom" }} />
        {/* Used by react-native-track-payer to handle native player notification clicks */}
        <Stack.Screen name="notification.click" />
      </Stack.Protected>
    </Stack>
  );
}

function RootLayout() {
  // Initialization and global sync hooks
  useSystemThemeSync();
  useDeviceSettingsSync();
  useNotificationsSync();
  usePrayerTimesSync();
  useQuranSetup();

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootStack />
        <ModalProvider />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

// Wrap the entire app with Sentry's error boundary to catch any unhandled errors
export default Sentry.wrap(RootLayout);
