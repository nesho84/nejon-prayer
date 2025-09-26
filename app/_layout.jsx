import { Stack } from "expo-router";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { PrayersProvider } from "@/contexts/PrayersContext";
import AppStatusBar from "@/components/AppStatusBar";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <PrayersProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "transparent" },
              animation: "fade",
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
          </Stack>
          <AppStatusBar />
        </PrayersProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
