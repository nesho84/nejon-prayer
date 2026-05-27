import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { Stack } from "expo-router";

export default function ExtrasLayout() {
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
                name="abdesi"
                options={{
                    title: tr.labels.abdes,
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="namazi"
                options={{
                    title: tr.labels.namaz,
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="tesbih"
                options={{
                    title: tr.labels.tesbih,
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="ramazani"
                options={{
                    title: tr.labels.ramadan,
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="quotes"
                options={{
                    title: tr.labels.quotes,
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="about"
                options={{
                    title: tr.labels.about,
                    headerShown: true,
                }}
            />

            {/* This screen is just a placeholder for handling 'react-native-track-player' playback notification press.
            ...When a playback notification is pressed, it will redirect to the main page. */}
            <Stack.Screen
                name="notification.click"
                options={{
                    title: 'Playback Notification',
                    headerShown: false,
                }}
            />
        </Stack>
    );
}
