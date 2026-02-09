import { Stack } from "expo-router";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import { AppProvider } from "@/context/AppContext";
import { PrayersProvider } from "@/context/PrayersContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import AppLoading from "@/components/AppLoading";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useSystemThemeSync } from "@/hooks/useSystemThemeSync";
import { useDeviceSettingsSync } from "@/hooks/useDeviceSettingsSync";

const RootStack = () => {
  const isReady = useOnboardingStore((s) => s.isReady);
  const onboardingComplete = useOnboardingStore((s) => s.onboardingComplete);

  if (!isReady) return <AppLoading />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Onboarding */}
      <Stack.Protected guard={!onboardingComplete}>
        <Stack.Screen name="(onboarding)" options={{ animation: "fade" }} />
      </Stack.Protected>

      {/* Main app (tabs) and (extras) only after onboarding */}
      <Stack.Protected guard={onboardingComplete}>
        <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
        <Stack.Screen name="(extras)" options={{ animation: "slide_from_right" }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  // Set up all listeners
  useSystemThemeSync();
  useDeviceSettingsSync();
  // usePrayersSync(); // @TODO: upcoming
  // useNotificationForegroundHandler(); // @TODO: upcoming

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AppProvider>
        <PrayersProvider>
          <NotificationsProvider>
            <RootStack />
          </NotificationsProvider>
        </PrayersProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
