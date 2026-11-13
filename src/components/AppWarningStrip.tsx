import { useThemeStore } from "@/store/themeStore";
import { Ionicons } from "@react-native-vector-icons/ionicons/static";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons/static";
import { ComponentProps } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type MCIcon = ComponentProps<typeof MaterialDesignIcons>["name"];

interface StripChip {
    icon: MCIcon;
    label: string;
    ok: boolean; // green when OK, red when missing
}

interface Props {
    icon?: React.ReactNode;
    title?: string;
    text: string;
    chips?: StripChip[];
    buttonText?: string; // present → full-width button; absent → whole strip tappable
    buttonIcon?: React.ReactNode;
    onPress: () => void;
}

export default function AppWarningStrip({ icon, title, text, chips, buttonText, buttonIcon, onPress }: Props) {
    // Stores
    const theme = useThemeStore((state) => state.theme);

    const boxStyle = [styles.box, { backgroundColor: theme.warning + '14', borderColor: theme.warning + '25' }];

    // Compact: the whole strip is tappable (opens settings)
    if (!buttonText) {
        return (
            <TouchableOpacity style={[boxStyle, styles.compact]} activeOpacity={0.3} onPress={onPress}>
                {icon}
                <Text style={[styles.compactText, { color: theme.accent2 }]} numberOfLines={3}>
                    {text}
                </Text>
                <Ionicons name="settings-outline" size={18} color={theme.accent2} />
            </TouchableOpacity>
        );
    }

    // Full: title, text, status chips and a button
    return (
        <View style={[boxStyle, styles.full]}>
            <View style={styles.textBlock}>
                {title && (
                    <View style={styles.titleRow}>
                        {icon}
                        <Text style={[styles.title, { color: theme.accent2 }]}>{title}</Text>
                    </View>
                )}
                <Text style={[styles.text, { color: theme.textSecondary }]}>{text}</Text>
            </View>

            {/* Status chips */}
            {chips && (
                <View style={styles.chips}>
                    {chips.map((chip) => {
                        const color = chip.ok ? theme.success : theme.danger;
                        return (
                            <View key={chip.label} style={[styles.chip, { backgroundColor: color + '15', borderColor: color + '25' }]}>
                                <MaterialDesignIcons name={chip.icon} size={13} color={color} />
                                <Text style={[styles.chipText, { color }]}>{chip.label}</Text>
                            </View>
                        );
                    })}
                </View>
            )}

            {/* Button */}
            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.warning + '17' }]}
                activeOpacity={0.7}
                onPress={onPress}
            >
                {buttonIcon}
                <Text style={[styles.buttonText, { color: theme.accent2 }]}>{buttonText}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    box: {
        marginTop: 10,
        marginHorizontal: 7,
        borderRadius: 12,
        borderWidth: 1,
    },

    // Compact
    compact: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        gap: 8,
    },
    compactText: {
        flex: 1,
        fontSize: 13,
        letterSpacing: 0.3,
    },

    // Full
    full: {
        padding: 14,
        gap: 12,
    },
    textBlock: {
        gap: 4,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
    },
    text: {
        fontSize: 14,
        lineHeight: 19,
    },
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        height: 26,
        paddingHorizontal: 10,
        borderRadius: 13,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    chipText: {
        fontSize: 12,
        fontWeight: '600',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        padding: 10,
        gap: 8,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
