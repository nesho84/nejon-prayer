import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { Stack } from 'expo-router';

export default function ModalsLayout() {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const tr = useLanguageStore((state) => state.tr);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.bg },
      }}
    >
      <Stack.Screen
        name="prayerNotification"
        options={{ title: tr.labels.notificationSettings }}
      />
      <Stack.Screen
        name="prayerTimings"
        options={{ title: "Prayer Timings" }}
      />
    </Stack>
  );
}