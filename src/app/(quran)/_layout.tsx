import { useLanguageStore } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { Stack } from 'expo-router';

export default function QuranLayout() {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const tr = useLanguageStore((state) => state.tr);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.bg },
        headerTintColor: theme.text,
      }}
    >
      <Stack.Screen
        name="ayahs"
        options={{
          title: tr.labels.ayahs,
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="ayahsFavorites"
        options={{
          title: tr.labels.ayahsFavorites,
          headerShown: true,
        }}
      />
    </Stack>
  );
}