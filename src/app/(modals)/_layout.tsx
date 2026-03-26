import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: 'transparent'
        },
      }}
    >
      <Stack.Screen name="prayerNotification" />
      <Stack.Screen name="prayerTimings" />
      <Stack.Screen name="quranSettings" />
    </Stack>
  );
}