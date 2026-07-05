import { Stack } from 'expo-router';

export default function SharedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* this is a background player notification route used by react-native-track-player, when a notification is clicked. It will redirect to the main page. */}
      <Stack.Screen name="notification.click" />
    </Stack>
  );
}
