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
                headerStyle: { backgroundColor: theme.bg },
                headerTintColor: theme.text,
            }}
        >
            <Stack.Screen
                name="namazi"
                options={{
                    title: "Namazi",
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="abdesi"
                options={{
                    title: "Abdesi",
                    headerShown: true
                }}
            />
            <Stack.Screen
                name="tesbih"
                options={{
                    title: "Tesbih",
                    headerShown: true
                }}
            />
        </Stack>
    );
}
