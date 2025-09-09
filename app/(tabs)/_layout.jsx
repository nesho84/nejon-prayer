import { useLanguage } from "@/context/LanguageContext";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function TabLayout() {
    const { theme } = useTheme();
    // LanguageContext
    const { lang } = useLanguage();

    return (
        <>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: theme.primary,
                    tabBarInactiveTintColor: theme.secondaryText,
                    tabBarStyle: {
                        backgroundColor: theme.tabs,
                        // borderTopColor: theme.border,
                        // borderTopWidth: 0,
                        bottom: "0.6%",
                    },
                }}
            >
                <Tabs.Screen
                    name="home"
                    options={{
                        title: lang("labels.home"),
                        tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="settings"
                    options={{
                        title: lang("labels.settings"),
                        tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="about"
                    options={{
                        title: lang("labels.about"),
                        tabBarIcon: ({ color, size }) => <Ionicons name="information-circle-outline" size={size} color={color} />,
                    }}
                />
            </Tabs>
            <StatusBar style="auto" />
        </>
    );
}
