import { useThemeStore } from "@/store/themeStore";
import { Ionicons } from "@react-native-vector-icons/ionicons/static";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface Props {
    icon: React.ReactNode;
    text: string;
    onPress: () => void;
}

export default function AppWarningStrip({ icon, text, onPress }: Props) {
    // Stores
    const theme = useThemeStore((state) => state.theme);

    return (
        <TouchableOpacity
            style={[styles.strip, { backgroundColor: theme.warning + '20' }]}
            activeOpacity={0.3}
            onPress={onPress}
        >
            {icon}
            <Text style={[styles.text, { color: theme.accent2 }]} numberOfLines={3}>
                {text}
            </Text>
            <Ionicons name="settings-outline" size={18} color={theme.accent2} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    strip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginTop: 3,
        gap: 8,
    },
    text: {
        flex: 1,
        fontSize: 13,
        letterSpacing: 0.3,
    },
});
