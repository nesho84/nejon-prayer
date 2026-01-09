import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Tabs } from "expo-router";
import { useThemeContext } from "@/context/ThemeContext";
import useTranslation from "@/hooks/useTranslation";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    const { theme } = useThemeContext();
    const { tr } = useTranslation();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                headerStyle: { backgroundColor: theme.bg },
                tabBarActiveTintColor: theme.tabActive,
                tabBarLabelStyle: { fontSize: 11 },
                tabBarInactiveTintColor: theme.tabInactive,
                tabBarStyle: {
                    backgroundColor: theme.bg,
                    height: insets.bottom + 55,
                    elevation: 0,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: tr("labels.home"),
                    tabBarIcon: ({ focused, color, size }) =>
                        <MaterialCommunityIcons name={focused ? "home" : "home-outline"} size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="qibla"
                options={{
                    title: tr("labels.qibla"),
                    tabBarIcon: ({ focused, color, size }) =>
                        <MaterialCommunityIcons name={focused ? "compass" : "compass-outline"} size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: tr("labels.settings"),
                    tabBarIcon: ({ focused, color, size }) =>
                        <MaterialCommunityIcons name={focused ? "cog" : "cog-outline"} size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="more"
                options={{
                    title: "More",
                    tabBarLabel: tr("labels.more"),
                    tabBarIcon: ({ focused, color, size }) =>
                        <MaterialCommunityIcons name={focused ? "apps" : "apps"} size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
