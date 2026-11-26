import { useThemeStore } from "@/store/themeStore";
import { Ionicons } from "@react-native-vector-icons/ionicons/static";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons/static";
import { ComponentProps } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type MCIcon = ComponentProps<typeof MaterialDesignIcons>["name"];

interface NoticeChip {
    icon: MCIcon;
    label: string;
    ok: boolean; // green when OK, red when missing
}

interface Props {
    icon?: React.ReactNode;
    title?: string;
    text: string;
    chips?: NoticeChip[];
    buttonText?: string; // present → full-width button; absent → whole notice tappable
    buttonIcon?: React.ReactNode;
    onPress: () => void;
}

export default function WarningNotice({ icon, title, text, chips, buttonText, buttonIcon, onPress }: Props) {
    // Stores
    const theme = useThemeStore((state) => state.theme);

    const boxStyle = [styles.box, { backgroundColor: theme.bgGold, borderColor: theme.borderGold }];

    // Compact: the whole notice is tappable (opens settings)
    if (!buttonText) {
        return (
            <TouchableOpacity style={[boxStyle, styles.compact]} activeOpacity={0.3} onPress={onPress}>
                <View style={[styles.iconSquare, { backgroundColor: theme.accentLight, borderColor: theme.divider2 }]}>
                    {icon}
                </View>
                <Text style={[styles.compactText, { color: theme.sand }]} numberOfLines={3}>
                    {text}
                </Text>
                <Ionicons name="settings-outline" size={22} color={theme.accent} />
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
                        <Text style={[styles.title, { color: theme.brown }]}>{title}</Text>
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
                style={[styles.button, { backgroundColor: theme.accentLight, borderColor: theme.borderGold }]}
                activeOpacity={0.7}
                onPress={onPress}
            >
                {buttonIcon}
                <Text style={[styles.buttonText, { color: theme.accent }]}>{buttonText}</Text>
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
        gap: 12,
    },
    compactText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        letterSpacing: 0.3,
        includeFontPadding: false,
    },
    iconSquare: {
        width: 38,
        height: 38,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
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
        borderWidth: 1,
        padding: 10,
        gap: 8,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
