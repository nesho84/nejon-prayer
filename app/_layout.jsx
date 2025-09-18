import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { PrayersProvider } from "@/contexts/PrayersContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <PrayersProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: "transparent"
              },
              animation: "fade",
            }}
          />
          <StatusBar style="auto" />
        </PrayersProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
