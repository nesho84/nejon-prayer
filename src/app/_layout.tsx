import { Stack } from "expo-router";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useSystemThemeSync } from "@/hooks/useSystemThemeSync";
import { useDeviceSettingsSync } from "@/hooks/useDeviceSettingsSync";
import { useNotificationsSync } from "@/hooks/useNotificationsSync";
import AppLoading from "@/components/AppLoading";

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

      {/* Main app (tabs) and (extras) only after onboarding */}
      <Stack.Protected guard={onboardingComplete}>
        <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
        <Stack.Screen name="(extras)" options={{ animation: "slide_from_right" }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  // Sync system theme, device settings, and notifications
  useSystemThemeSync();
  useDeviceSettingsSync();
  useNotificationsSync();

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <RootStack />
    </SafeAreaProvider>
  );
}
