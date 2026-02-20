import AppCard from "@/components/AppCard";
import { SOUNDS } from "@/constants/sounds";
import { startSound, stopSound } from "@/services/soundService";
import { useDeviceSettingsStore } from "@/store/deviceSettingsStore";
import { useLanguageStore } from "@/store/languageStore";
import { useNotificationsStore } from "@/store/notificationsStore";
import { useThemeStore } from "@/store/themeStore";
import { PrayerEventType, PrayerType } from "@/types/notification.types";
import { PrayerName } from "@/types/prayer.types";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Sound from "react-native-sound";

interface SoundsOptionType {
    id: string;
    name: string;
    file: string;
}

interface TimeOptionType {
    label: string;
    offset: number;
}

export default function PrayersSettingsScreen() {
    // Get prayer name from route params
    const params = useLocalSearchParams<{ prayer: PrayerName }>();
    const prayerName = params.prayer;

    // Safe area insets for padding
    const insets = useSafeAreaInsets();

    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);
    const notificationPermission = useDeviceSettingsStore((state) => state.notificationPermission);
    const prayers = useNotificationsStore((state) => state.prayers);
    const events = useNotificationsStore((state) => state.events);

    // Local state for editing (not saved until user presses Save)
    const [enabled, setEnabled] = useState(false);
    const [selectedOffset, setSelectedOffset] = useState(0);
    const [selectedSound, setSelectedSound] = useState(SOUNDS.azan1_short);

    // Sound preview state
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [soundDurations, setSoundDurations] = useState<Record<string, number>>({});

    // Refs
    const playTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const TIME_OPTIONS: TimeOptionType[] = useMemo(() => {
        return [
            { label: tr.labels.offsetOnTime, offset: 0 },
            { label: `5 ${tr.labels.offsetMinutes}`, offset: -5 },
            { label: `10 ${tr.labels.offsetMinutes}`, offset: -10 },
            { label: `15 ${tr.labels.offsetMinutes}`, offset: -15 },
            { label: `30 ${tr.labels.offsetMinutes}`, offset: -30 },
            { label: `45 ${tr.labels.offsetMinutes}`, offset: -45 },
            { label: `60 ${tr.labels.offsetMinutes}`, offset: -60 },
        ];
    }, [tr]);

    const SOUND_OPTIONS: SoundsOptionType[] = useMemo(() => {
        return [
            { id: 'azan1', name: `Azan 1 (${tr.labels.short})`, file: SOUNDS.azan1_short },
            { id: 'azan2', name: `Azan 2 (${tr.prayers.Fajr})`, file: SOUNDS.azan2_fajr },
            { id: 'azan3', name: 'Azan 3', file: SOUNDS.azan3 },
            { id: 'azan4', name: 'Azan 4', file: SOUNDS.azan4 },
            { id: 'azan5', name: 'Azan 5', file: SOUNDS.azan5 },
            { id: 'alarm1', name: 'Alarm 1', file: SOUNDS.alarm1 },
            { id: 'alarm2', name: 'Alarm 2', file: SOUNDS.alarm2 },
            { id: 'alarm3', name: 'Alarm 3', file: SOUNDS.alarm3 },
        ];
    }, []);

    // ------------------------------------------------------------
    // Load current settings from store
    // ------------------------------------------------------------
    useEffect(() => {
        if (!prayerName) return;

        const prayerSettings = prayers?.[prayerName as PrayerType];
        const eventSettings = events?.[prayerName as PrayerEventType];
        const current = prayerSettings || eventSettings || { enabled: false, offset: 0, sound: SOUNDS.azan1_short };

        setEnabled(current.enabled);
        setSelectedOffset(current.offset);
        setSelectedSound(current.sound ?? SOUNDS.azan1_short);
    }, [prayerName, prayers, events]);

    // ------------------------------------------------------------
    // Preload sound durations and clear timeouts
    // ------------------------------------------------------------
    useEffect(() => {
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

        return () => {
            if (playTimeoutRef.current) {
                clearTimeout(playTimeoutRef.current);
            }
            stopSound();
        };
    }, []);

    // ------------------------------------------------------------
    // Play preview of selected sound
    // ------------------------------------------------------------
    const playPreview = async (soundFile: string, soundId: string) => {
        if (playTimeoutRef.current) {
            clearTimeout(playTimeoutRef.current);
        }

        setPlayingId(soundId);
        await startSound(soundFile, 1.0);

        const duration = soundDurations[soundId];
        if (duration) {
            playTimeoutRef.current = setTimeout(() => {
                setPlayingId(null);
                playTimeoutRef.current = null;
            }, duration * 1000);
        }
    };

    // ------------------------------------------------------------
    // Stop selected sound preview
    // ------------------------------------------------------------
    const handleStopPreview = async () => {
        if (playTimeoutRef.current) {
            clearTimeout(playTimeoutRef.current);
            playTimeoutRef.current = null;
        }
        await stopSound();
        setPlayingId(null);
    };

    // ------------------------------------------------------------
    // Save changes to store and dismiss the Modal
    // ------------------------------------------------------------
    const handleSave = () => {
        if (!prayerName) return;

        // Check system notifications permission first
        if (!notificationPermission) {
            Alert.alert(
                tr.labels.notificationsDisabled,
                tr.labels.notificationsDisabledMessage,
                [
                    { text: tr.buttons.cancel, style: "cancel" },
                    {
                        text: tr.labels.goToSettings,
                        onPress: () => {
                            router.back(); // Close this screen
                            router.navigate("/(tabs)/settings"); // Navigate to settings
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

        const settings = { enabled: enabled, offset: selectedOffset, sound: selectedSound };

        // Update store
        if (isPrayer) {
            useNotificationsStore.getState().setPrayer(prayerName as PrayerType, settings);
        } else if (isEvent) {
            useNotificationsStore.getState().setEvent(prayerName as PrayerEventType, settings);
        }

        router.back();
    };

    // ------------------------------------------------------------
    // Cancel - dismiss without saving
    // ------------------------------------------------------------
    const handleCancel = async () => {
        await stopSound();
        if (playTimeoutRef.current) {
            clearTimeout(playTimeoutRef.current);
        }
        router.back();
    };

    // Dont render if no valid prayer name in params
    if (!prayerName) return null;

    // Main Content
    return (
        <>
            <BottomSheetScrollView
                style={[styles.scrollContainer, { backgroundColor: theme.bg2 }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
            >

                {/* Prayer Name Header */}
                <View style={styles.headerContainer}>
                    <Text style={[styles.prayerName, { color: theme.accent }]}>
                        {tr.prayers[prayerName]}
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: theme.text2 }]}>
                        {tr.labels.notificationSettings}
                    </Text>
                </View>

                {/* SECTION 1: Enable/Disable */}
                <AppCard style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons
                            name="bell-outline"
                            size={20}
                            color={theme.accent}
                        />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            {tr.labels.enableNotification}
                        </Text>
                        <Switch
                            value={enabled}
                            onValueChange={setEnabled}
                            trackColor={{ false: theme.divider, true: theme.accent }}
                            thumbColor={enabled ? theme.border : theme.border}
                            style={{ marginLeft: 'auto' }}
                        />
                    </View>
                </AppCard>

                {/* SECTION 2: Time Offset */}
                <AppCard style={styles.sectionCard}>
                    <View style={[styles.sectionHeader, { marginBottom: 12 }]}>
                        <Ionicons name="time-outline" size={20} color={theme.accent} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            {tr.labels.notificationTime}
                        </Text>
                    </View>

                    {/* Wrapped time Chips */}
                    <View style={styles.timesContainer}>
                        {TIME_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.offset}
                                style={[
                                    styles.timeChipRow,
                                    { borderColor: theme.divider },
                                    selectedOffset === option.offset && {
                                        backgroundColor: theme.accentLight,
                                        borderColor: theme.accent,
                                    }
                                ]}
                                onPress={() => setSelectedOffset(option.offset)}
                            >
                                <Text
                                    style={[
                                        styles.timeChipText,
                                        { color: theme.text2 },
                                        selectedOffset === option.offset && {
                                            color: theme.accent,
                                            fontWeight: '500'
                                        }
                                    ]}
                                >
                                    {option.label}
                                </Text>
                                {/* Checkmark - like sound section */}
                                {selectedOffset === option.offset && (
                                    <Ionicons name="checkmark" size={16} color={theme.accent} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </AppCard>

                {/* SECTION 3: Sound Selection */}
                <AppCard style={styles.sectionCard}>
                    <View style={[styles.sectionHeader, { marginBottom: 12 }]}>
                        <Ionicons name="musical-notes-outline" size={20} color={theme.accent} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            {tr.labels.notificationSound}
                        </Text>
                    </View>

                    {/* Compact sound Rows */}
                    <View style={styles.soundsContainer}>
                        {SOUND_OPTIONS.map((sound) => (
                            <View
                                key={sound.id}
                                style={[
                                    styles.soundRow,
                                    { borderColor: theme.divider },
                                    selectedSound === sound.file && {
                                        backgroundColor: theme.accentLight,
                                        borderColor: theme.accent,
                                    }
                                ]}
                            >
                                {/* Left: Selectable Area */}
                                <TouchableOpacity
                                    style={styles.soundLeft}
                                    onPress={() => setSelectedSound(sound.file)}
                                >
                                    {selectedSound === sound.file && (
                                        <Ionicons name="checkmark" size={16} color={theme.accent} />
                                    )}
                                    <Text
                                        style={[
                                            styles.soundName,
                                            { color: theme.text2 },
                                            selectedSound === sound.file && {
                                                color: theme.accent,
                                                fontWeight: '500'
                                            }
                                        ]}
                                    >
                                        {sound.name}
                                    </Text>
                                    <Text style={[styles.soundDuration, { color: theme.text2 }]}>
                                        {soundDurations[sound.id] && soundDurations[sound.id] >= 60
                                            ? `${(soundDurations[sound.id] / 60).toFixed(1)}m`
                                            : `${soundDurations[sound.id]?.toFixed(0)}s`
                                        }
                                    </Text>
                                </TouchableOpacity>

                                {/* Right: Play Button */}
                                <TouchableOpacity
                                    style={styles.soundPlay}
                                    onPress={() => {
                                        if (playingId === sound.id) {
                                            handleStopPreview();
                                        } else {
                                            playPreview(sound.file, sound.id);
                                        }
                                    }}
                                >
                                    <Ionicons
                                        name={playingId === sound.id ? "stop-circle" : "play-circle"}
                                        size={26}
                                        color={theme.accent}
                                    />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </AppCard>

            </BottomSheetScrollView>

            {/* Footer with Save/Cancel */}
            <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.divider }]}>
                <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleCancel}
                >
                    <Text style={[styles.buttonText, { color: theme.text2 }]}>
                        {tr.buttons.cancel}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.saveButton, { backgroundColor: theme.overlay }]}
                    onPress={handleSave}
                >
                    <Text style={[styles.buttonText, { color: theme.accent }]}>
                        {tr.buttons.save}
                    </Text>
                </TouchableOpacity>
            </View>

        </>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingTop: 12,
        paddingBottom: 24,
        paddingHorizontal: 8,
        gap: 8,
    },

    // Prayer Header styles
    headerContainer: {
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    prayerName: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 15,
    },

    // Section styles
    sectionCard: {
        padding: 14,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
    },

    // Time selection styles
    timesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    timeChipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1.5,
        gap: 6,
    },
    timeChipText: {
        fontSize: 14,
    },

    // Sound selection styles
    soundsContainer: {
        gap: 6,
    },
    soundRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 0,
        borderRadius: 12,
        borderWidth: 1.5,
        overflow: 'hidden',
    },
    soundLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 10,
        gap: 6,
    },
    soundName: {
        fontSize: 15,
        flex: 1,
    },
    soundDuration: {
        fontSize: 12,
    },
    soundPlay: {
        padding: 10,
        paddingRight: 12,
    },

    // Footer styles
    footer: {
        flexDirection: 'row',
        borderTopWidth: StyleSheet.hairlineWidth,
        padding: 6,
        gap: 6,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 8,
        gap: 6,
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: StyleSheet.hairlineWidth,

    },
    saveButton: {},
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});