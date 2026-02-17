import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Modal, View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/store/themeStore";
import { useLanguageStore } from "@/store/languageStore";
import { useDeviceSettingsStore } from "@/store/deviceSettingsStore";
import { useNotificationsStore } from "@/store/notificationsStore";
import { PrayerName } from "@/types/prayer.types";
import { SOUNDS } from "@/constants/sounds";
import { PrayerSettings, EventSettings, PrayerType, PrayerEventType } from "@/types/notification.types";
import { startSound, stopSound } from "@/utils/notifSound";
import Sound from "react-native-sound";

interface Props {
    visible: boolean;
    prayerName: PrayerName | null;
    closePrayerSettingsModal: () => void;
}

interface OptionType {
    label: string;
    value: PrayerSettings | EventSettings;
    icon: any;
}

const SOUND_OPTIONS = [
    { id: 'azan1', name: 'Azan 1', file: SOUNDS.azan1 },
    // { id: 'azan2', name: 'Azan 2', file: SOUNDS.azan2 },
    // { id: 'azan3', name: 'Azan 3', file: SOUNDS.azan3 },
    // { id: 'azan4', name: 'Azan 4', file: SOUNDS.azan4 },
    // { id: 'azan5', name: 'Azan 5', file: SOUNDS.azan5 },
    { id: 'beep1', name: 'Beep 1', file: SOUNDS.beep1 },
];

export default function PrayerSettingsModal({ visible, closePrayerSettingsModal, prayerName }: Props) {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);
    const notificationPermission = useDeviceSettingsStore((state) => state.notificationPermission);
    const prayers = useNotificationsStore((state) => state.prayers);
    const events = useNotificationsStore((state) => state.events);

    // State for sound preview
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [showSoundPicker, setShowSoundPicker] = useState(false);
    const [soundDurations, setSoundDurations] = useState<Record<string, number>>({});
    const playTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    // Preload sound durations on mount for accurate preview handling
    // ------------------------------------------------------------
    useEffect(() => {
        // Preload durations
        SOUND_OPTIONS.forEach(({ id, file }) => {
            const sound = new Sound(file, Sound.MAIN_BUNDLE, (err) => {
                if (!err) {
                    setSoundDurations(prev => ({
                        ...prev,
                        [id]: sound.getDuration()
                    }));
                    sound.release();
                }
            });
        });
    }, []);

    // ------------------------------------------------------------
    // Clean up timeout on unmount
    // ------------------------------------------------------------
    useEffect(() => {
        return () => {
            if (playTimeoutRef.current) {
                clearTimeout(playTimeoutRef.current);
            }
        };
    }, []);

    // ------------------------------------------------------------
    // Handle sound
    // ------------------------------------------------------------
    const playPreview = async (soundFile: string, soundId: string) => {
        // Clear any existing timeout
        if (playTimeoutRef.current) {
            clearTimeout(playTimeoutRef.current);
        }

        setPlayingId(soundId);
        await startSound(soundFile, 1.0);

        // Auto-reset after sound finishes
        const duration = soundDurations[soundId];
        if (duration) {
            playTimeoutRef.current = setTimeout(() => {
                setPlayingId(null);
                playTimeoutRef.current = null;
            }, duration * 1000);
        }
    };
    // Stop preview
    const handleStopPreview = async () => {
        // Clear timeout
        if (playTimeoutRef.current) {
            clearTimeout(playTimeoutRef.current);
            playTimeoutRef.current = null;
        }

        await stopSound();
        setPlayingId(null);
    };
    // Handle close with cleanup
    const closeSoundsModal = async () => {
        // Clear timeout
        if (playTimeoutRef.current) {
            clearTimeout(playTimeoutRef.current);
            playTimeoutRef.current = null;
        }

        await stopSound();
        setPlayingId(null);
        setShowSoundPicker(false);
    };

    // ------------------------------------------------------------
    //  Handle Selected Prayer/Event Sound from Sound Picker
    // ------------------------------------------------------------
    const handleSelectedSound = (soundFile: string) => {
        if (!prayerName) return;

        // Determine if this is a prayer or event
        const isPrayer = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].includes(prayerName);
        const isEvent = ['Imsak', 'Sunrise'].includes(prayerName);

        // Update store with new sound selection
        if (isPrayer) {
            useNotificationsStore.getState().setPrayer(prayerName as PrayerType, { sound: soundFile });
        } else if (isEvent) {
            useNotificationsStore.getState().setEvent(prayerName as PrayerEventType, { sound: soundFile });
        }

        closeSoundsModal();
    };

    // ------------------------------------------------------------
    // Handle Selected Prayer/Event notification option (on/off/offset)
    // ------------------------------------------------------------
    const handleSelectedOption = (value: PrayerSettings | EventSettings) => {
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
                            closePrayerSettingsModal();
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

        // Save to appropriate store method
        if (isPrayer) {
            useNotificationsStore.getState().setPrayer(prayerName as PrayerType, value as PrayerSettings);
        } else if (isEvent) {
            useNotificationsStore.getState().setEvent(prayerName as PrayerEventType, value as EventSettings);
        }

        closePrayerSettingsModal();
    };

    // ------------------------------------------------------------
    // Notification Options (on/off, offset times)
    // ------------------------------------------------------------
    const mainOptions: OptionType[] = useMemo(() => {
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

    // Dont render if not visible or no prayer selected
    if (!visible || !prayerName) return null;

    // Sound Picker Modal
    if (showSoundPicker) {
        return (
            <Modal
                visible={visible}
                transparent={true}
                animationType="fade"
                onRequestClose={closeSoundsModal}
            >

                <View style={styles.overlay}>
                    <View style={[styles.modalBox, { backgroundColor: theme.bg }]}>

                        {/* Header */}
                        <Text style={[styles.headerText, { color: theme.info }]}>
                            {tr.prayers[prayerName]} - Sound
                        </Text>
                        <View style={[styles.divider, { backgroundColor: theme.divider }]} />

                        {/* Sound List */}
                        <FlatList
                            data={SOUND_OPTIONS}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.soundList}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.soundItem,
                                        selectedPrayer.sound === item.file && { backgroundColor: theme.accentLight }
                                    ]}
                                    activeOpacity={0.3}
                                    onPress={() => handleSelectedSound(item.file)} // @TODO: implement sound selection
                                >
                                    <View style={styles.soundInfo}>
                                        {/* Checkmark */}
                                        {selectedPrayer.sound === item.file && (
                                            <Ionicons name="checkmark" size={20} color={theme.accent} />
                                        )}
                                        {/* Sound name */}
                                        <Text
                                            style={[
                                                styles.soundName,
                                                { color: theme.text2 },
                                                selectedPrayer.sound === item.file && { color: theme.accent, fontWeight: '500' }
                                            ]}
                                        >
                                            {item.name}
                                        </Text>
                                    </View>

                                    {/* Sound duration */}
                                    <Text style={[styles.duration, { color: theme.text2 }]}>
                                        {soundDurations[item.id]?.toFixed(0)}s
                                    </Text>

                                    {/* Play/Stop button */}
                                    <TouchableOpacity
                                        style={styles.playButton}
                                        onPress={() => {
                                            if (playingId === item.id) {
                                                handleStopPreview();
                                            } else {
                                                playPreview(item.file, item.id);
                                            }
                                        }}
                                    >
                                        <Ionicons
                                            name={playingId === item.id ? "stop-circle" : "play-circle"}
                                            size={32}
                                            color={theme.accent}
                                        />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            )}
                        />

                        {/* Footer */}
                        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={closeSoundsModal}
                        >
                            <Text style={[styles.cancelText, { color: theme.accent }]}>
                                {tr.buttons.cancel}
                            </Text>
                        </TouchableOpacity>

                    </View>
                </View>

            </Modal >
        );
    }

    // Main Content
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={closePrayerSettingsModal}
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
                        {mainOptions.map((option, index) => {
                            const isSelected =
                                selectedPrayer.enabled === option.value.enabled &&
                                selectedPrayer.offset === option.value.offset;

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.optionRow, isSelected && { backgroundColor: theme.accentLight }]}
                                    activeOpacity={0.3}
                                    onPress={() => handleSelectedOption(option.value)}
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

                        {/* Sound Picker Option */}
                        <TouchableOpacity
                            style={styles.optionRow}
                            activeOpacity={0.3}
                            onPress={() => setShowSoundPicker(true)}
                        >
                            <View style={styles.optionLabel}>
                                <MaterialCommunityIcons
                                    name="timer-music-outline"
                                    size={20}
                                    color={theme.text2}
                                    style={{ marginRight: 10, opacity: 0.6 }}
                                />
                                <Text style={[styles.optionText, { color: theme.info }]}>
                                    Choose Sound
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.text2} />
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                    <TouchableOpacity style={styles.cancelBtn} onPress={closePrayerSettingsModal}>
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
        padding: 16,
    },
    modalBox: {
        width: "85%",
        borderRadius: 16,
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

    // Sound picker styles
    soundList: {
        paddingVertical: 12,
    },
    soundItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    soundInfo: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        marginRight: 12,
    },
    soundName: {
        fontSize: 16,
        marginLeft: 8,
    },
    playButton: {
        padding: 4,
    },
    duration: {
        fontSize: 12,
        marginHorizontal: 8,
    },
});