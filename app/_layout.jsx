import { Stack } from "expo-router";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import { ThemeProvider } from "@/context/ThemeContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { PrayersProvider } from "@/context/PrayersContext";
import { NotificationsProvider } from "@/context/NotificationsContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SettingsProvider>
          <PrayersProvider>
            <NotificationsProvider initialMetrics={initialWindowMetrics}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" options={{ animation: "fade" }} />
                <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
                <Stack.Screen name="extras" options={{ animation: "slide_from_right" }} />
              </Stack>
            </NotificationsProvider>
          </PrayersProvider>
        </SettingsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
