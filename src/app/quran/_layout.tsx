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
        animation: "ios_from_right",
        // replace defaults to a pop animation — Next Surah should read as forward
        animationTypeForReplace: "push",
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
        name="ayahs-fav"
        options={{
          title: tr.labels.ayahsFavorites,
          headerShown: true,
        }}
      />
    </Stack>
  );
}
