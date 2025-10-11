import { Stack } from "expo-router";
import { useThemeContext } from "@/context/ThemeContext";
import useTranslation from "@/hooks/useTranslation";

export default function ExtrasLayout() {
    const { theme } = useThemeContext();
    const { tr } = useTranslation();

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
            <Stack.Screen
                name="about"
                options={{
                    title: tr("labels.about"),
                    headerShown: true,
                }}
            />
        </Stack>
    );
}
