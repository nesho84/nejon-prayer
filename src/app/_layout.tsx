import { Stack } from "expo-router";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import { ThemeProvider } from "@/context/ThemeContext";
import { AppProvider } from "@/context/AppContext";
import { PrayersProvider } from "@/context/PrayersContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import AppLoading from "@/components/AppLoading";
import { useOnboardingStore } from "@/store/onboardingStore";

const RootStack = () => {
  const isReady = useOnboardingStore((s) => s.isReady);
  const onboardingComplete = useOnboardingStore((s) => s.onboardingComplete);

  if (!isReady) return <AppLoading />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Onboarding group */}
      <Stack.Protected guard={!onboardingComplete}>
        <Stack.Screen name="(onboarding)" options={{ animation: "fade" }} />
      </Stack.Protected>

      {/* Main app and extras only after onboarding */}
      <Stack.Protected guard={onboardingComplete}>
        <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
        <Stack.Screen name="(extras)" options={{ animation: "slide_from_right" }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider>
        <AppProvider>
          <PrayersProvider>
            <NotificationsProvider>
              <RootStack />
            </NotificationsProvider>
          </PrayersProvider>
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
