import { Stack } from "expo-router";
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
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "fade",
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </NotificationsProvider>
        </PrayersProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
