import { Stack } from "expo-router";
import { useThemeContext } from "@/contexts/ThemeContext";

export const unstable_settings = {
    initialRouteName: 'index',
};

export default function MoreLayout() {
    const { theme } = useThemeContext();

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
                contentStyle: { backgroundColor: theme.bg }
            }}
        >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen
                name="namazi"
                options={{
                    title: "Namazi",
                    headerShown: true, // Show header only on child screens
                    headerStyle: {
                        backgroundColor: theme.bg,
                    },
                    headerTintColor: theme.text,
                }}
            />
            <Stack.Screen
                name="abdesi"
                options={{
                    title: "Abdesi",
                    headerShown: true,
                    headerStyle: {
                        backgroundColor: theme.bg,
                    },
                    headerTintColor: theme.text,
                }}
            />
            <Stack.Screen
                name="tesbih"
                options={{
                    title: "Tesbih",
                    headerShown: true,
                    headerStyle: {
                        backgroundColor: theme.bg,
                    },
                    headerTintColor: theme.text,
                }}
            />
        </Stack>
    );
}
