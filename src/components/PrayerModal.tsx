import { useMemo } from "react";
import { Alert, Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/store/themeStore";
import { useLanguageStore } from "@/store/languageStore";
import { useDeviceSettingsStore } from "@/store/deviceSettingsStore";
import { useNotificationsStore } from "@/store/notificationsStore";
import { PrayerName } from "@/types/prayer.types";
import { SOUNDS } from "@/constants/sounds";
import { PrayerSettings, EventSettings, PrayerType, PrayerEventType } from "@/types/notification.types";

interface Props {
    visible: boolean;
    onClose: () => void;
    prayerName: PrayerName | null;
}

interface OptionType {
    label: string;
    value: PrayerSettings | EventSettings;
    icon: any;
}

export default function PrayerModal({ visible, onClose, prayerName }: Props) {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);
    const notificationPermission = useDeviceSettingsStore((state) => state.notificationPermission);
    const prayers = useNotificationsStore((state) => state.prayers);
    const events = useNotificationsStore((state) => state.events);

    // ------------------------------------------------------------
    // Get current settings for the prayer
    // ------------------------------------------------------------
    const selectedPrayer = useMemo(() => {
        if (!prayerName) {
            return { enabled: false, offset: 0, sound: SOUNDS.azan1 };
        }

        const prayerSettings = prayers?.[prayerName as PrayerType];
        const eventSettings = events?.[prayerName as PrayerEventType];

        return prayerSettings || eventSettings || { enabled: false, offset: 0, sound: SOUNDS.azan1 };
    }, [prayerName, prayers, events]);

    // ------------------------------------------------------------
    // Handle Option Select
    // ------------------------------------------------------------
    const handleSelectedPrayer = (value: PrayerSettings | EventSettings) => {
        if (!prayerName) return;

        // Check system notifications first
        if (!notificationPermission) {
            Alert.alert(
                tr.labels.notificationsDisabled,
                tr.labels.notificationsDisabledMessage,
                [
                    { text: tr.buttons.cancel, style: "cancel" },
                    {
                        text: tr.labels.goToSettings,
                        onPress: () => {
                            onClose();
                            router.navigate("/(tabs)/settings");
                        }
                    },
                ],
                { cancelable: true }
            );
            return;
        }

        // Determine if this is a prayer or event
        const isPrayer = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].includes(prayerName);
        const isEvent = ['Imsak', 'Sunrise'].includes(prayerName);

        // Save to appropriate store method with destructured values
        if (isPrayer) {
            const { enabled, offset, sound } = value as PrayerSettings;
            useNotificationsStore.getState().setPrayer(prayerName as PrayerType, enabled, offset, sound);
        } else if (isEvent) {
            const { enabled, offset, sound } = value as EventSettings;
            useNotificationsStore.getState().setEvent(prayerName as PrayerEventType, enabled, offset, sound);
        }

        onClose();
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
            // @TODO: add sound option later
        ];
    }, [tr]);

    // Dont render if not visible or no prayer selected
    if (!visible || !prayerName) return null;

    // Main Content
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >

            <View style={styles.overlay}>
                <View style={[styles.modalBox, { backgroundColor: theme.bg }]}>

                    {/* Header */}
                    <Text style={[styles.headerText, { color: theme.accent }]}>
                        {tr.prayers[prayerName]}
                    </Text>
                    <View style={[styles.divider, { backgroundColor: theme.divider }]} />

                    {/* Options */}
                    <View style={styles.optionList}>
                        {options.map((option, index) => {
                            const isSelected =
                                selectedPrayer.enabled === option.value.enabled &&
                                selectedPrayer.offset === option.value.offset;

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.optionRow, isSelected && { backgroundColor: theme.accentLight }]}
                                    activeOpacity={0.3}
                                    onPress={() => handleSelectedPrayer(option.value)}
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
                    <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
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