import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "@/contexts/ThemeContext";
import useTranslation from "@/hooks/useTranslation";
import AppStatusBar from "@/components/AppStatusBar";

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    const { theme } = useThemeContext();
    const { tr } = useTranslation();

    return (
        <>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: theme.primary,
                    tabBarInactiveTintColor: theme.text2,
                    tabBarStyle: {
                        backgroundColor: theme.bg,
                        height: insets.bottom + 53,
                    },
                }}
            >
                <Tabs.Screen
                    name="HomeScreen"
                    options={{
                        title: tr("labels.home"),
                        tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="SettingsScreen"
                    options={{
                        title: tr("labels.settings"),
                        tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="AboutScreen"
                    options={{
                        title: tr("labels.about"),
                        tabBarIcon: ({ color, size }) => <Ionicons name="information-circle-outline" size={size} color={color} />,
                    }}
                />
            </Tabs>
            <AppStatusBar />
        </>
    );
}
