import { useMemo } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/store/themeStore";
import { useLanguageStore } from "@/store/languageStore";
import { PrayerName, PrayerSettings } from "@/types/prayer.types";

interface Props {
    visible: boolean;
    setVisible: (visible: boolean) => void;
    header: PrayerName;
    selectedValue: PrayerSettings;
    onSelect: (value: PrayerSettings) => void;
}

interface OptionType {
    label: string;
    value: PrayerSettings;
    icon: any;
}

export default function PrayerModal({ visible, setVisible, header, selectedValue, onSelect }: Props) {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);

    // ------------------------------------------------------------
    // Handle Option Select
    // ------------------------------------------------------------
    const handleSelect = (value: PrayerSettings) => {
        setVisible(false);
        onSelect(value);
    };

    // ------------------------------------------------------------
    // Notification Options
    // ------------------------------------------------------------
    const options: OptionType[] = useMemo(() => {
        return [
            { label: tr.labels.offsetOff, value: { enabled: false, offset: 0 }, icon: "bell-off-outline" },
            { label: tr.labels.offsetOnTime, value: { enabled: true, offset: 0 }, icon: "bell-outline" },
            { label: `5 ${tr.labels.offsetMinutes}`, value: { enabled: true, offset: -5 }, icon: "bell-cog-outline" },
            { label: `10 ${tr.labels.offsetMinutes}`, value: { enabled: true, offset: -10 }, icon: "bell-cog-outline" },
            { label: `15 ${tr.labels.offsetMinutes}`, value: { enabled: true, offset: -15 }, icon: "bell-cog-outline" },
            { label: `30 ${tr.labels.offsetMinutes}`, value: { enabled: true, offset: -30 }, icon: "bell-cog-outline" },
            { label: `45 ${tr.labels.offsetMinutes}`, value: { enabled: true, offset: -45 }, icon: "bell-cog-outline" },
            { label: `60 ${tr.labels.offsetMinutes}`, value: { enabled: true, offset: -60 }, icon: "bell-cog-outline" },
        ];
    }, [tr]);

    // Dont render if not visible
    if (!visible) return null;

    // Main Content
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setVisible(false)}
        >

            <View style={styles.overlay}>
                <View style={[styles.modalBox, { backgroundColor: theme.bg }]}>

                    {/* Header */}
                    <Text style={[styles.headerText, { color: theme.accent }]}>
                        {tr.prayers[header]}
                    </Text>
                    <View style={[styles.divider, { backgroundColor: theme.divider }]} />

                    {/* Options */}
                    <View style={styles.optionList}>
                        {options.map((option, index) => {
                            const isSelected =
                                selectedValue.enabled === option.value.enabled &&
                                selectedValue.offset === option.value.offset;

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.optionRow, isSelected && { backgroundColor: theme.accentLight }]}
                                    activeOpacity={0.3}
                                    onPress={() => handleSelect(option.value)}
                                >
                                    <View style={styles.optionLabel}>
                                        {/* Icon */}
                                        <MaterialCommunityIcons
                                            name={option.icon}
                                            size={20}
                                            color={isSelected ? theme.accent : theme.text2}
                                            style={{ marginRight: 10, opacity: 0.6 }}
                                        />
                                        {/* Label */}
                                        <Text
                                            style={[
                                                styles.optionText,
                                                { color: theme.text2 },
                                                isSelected && { fontWeight: 500, color: theme.accent },
                                            ]}
                                        >
                                            {option.label}
                                        </Text>
                                    </View>
                                    {/* Checkmark */}
                                    {isSelected && (<Ionicons name="checkmark" size={22} color={theme.accent} />)}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Footer */}
                    <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setVisible(false)}>
                        <Text style={[styles.cancelText, { color: theme.accent }]}>{tr.buttons.cancel}</Text>
                    </TouchableOpacity>

                </View>
            </View>

        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.3)",
        padding: 25,
    },
    modalBox: {
        width: "85%",
        borderRadius: 14,
        overflow: "hidden",
        elevation: 6,
    },
    headerText: {
        fontSize: 18,
        fontWeight: "600",
        paddingVertical: 12,
        paddingHorizontal: 18,
    },
    divider: {
        height: 1,
        width: '100%',
    },
    optionList: {
        paddingVertical: 6,
    },
    optionRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 10,
        paddingHorizontal: 18,
    },
    optionLabel: {
        flexDirection: "row",
        alignItems: "center",
    },
    optionText: {
        fontSize: 16,
    },
    cancelBtn: {
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 18,
    },
    cancelText: {
        fontSize: 18,
        fontWeight: "500",
    },
});