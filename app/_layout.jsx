import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppScreen from "@/components/AppScreen";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { PrayersProvider } from "@/contexts/PrayersContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <PrayersProvider>
          <NotificationsProvider>
            <SafeAreaProvider>
              <AppScreen>
                <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(tabs)" />
                </Stack>
              </AppScreen>
            </SafeAreaProvider>
          </NotificationsProvider>
        </PrayersProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
