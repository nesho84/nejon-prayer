import { useThemeContext } from "@/contexts/ThemeContext";
import useTranslation from "@/hooks/useTranslation";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function TabLayout() {
    const { theme } = useThemeContext();
    const { tr } = useTranslation();

    return (
        <>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: theme.primary,
                    tabBarInactiveTintColor: theme.secondaryText,
                    tabBarStyle: {
                        backgroundColor: theme.tabs,
                        bottom: "0.6%",
                    },
                }}
            >
                <Tabs.Screen
                    name="home"
                    options={{
                        title: tr("labels.home"),
                        tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="settings"
                    options={{
                        title: tr("labels.settings"),
                        tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="about"
                    options={{
                        title: tr("labels.about"),
                        tabBarIcon: ({ color, size }) => <Ionicons name="information-circle-outline" size={size} color={color} />,
                    }}
                />
            </Tabs>
            <StatusBar style="auto" />
        </>
    );
}
