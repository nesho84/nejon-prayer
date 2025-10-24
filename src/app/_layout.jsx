import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@/context/ThemeContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { useSettingsContext } from "@/context/SettingsContext";
import { PrayersProvider } from "@/context/PrayersContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import AppLoading from "@/components/AppLoading";

const RootStack = () => {
  const { appSettings, isReady, isLoading } = useSettingsContext();

  if (!isReady || isLoading) return <AppLoading />;

  const onboardingComplete = appSettings?.onboarding ?? false;

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
    <SafeAreaProvider>
      <ThemeProvider>
        <SettingsProvider>
          <PrayersProvider>
            <NotificationsProvider>
              <RootStack />
            </NotificationsProvider>
          </PrayersProvider>
        </SettingsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
