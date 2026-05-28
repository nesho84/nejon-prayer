import AppCard from "@/components/AppCard";
import ModalSheet, { ModalSheetRef } from "@/components/ModalSheet";
import { SOUNDS } from "@/constants/sounds";
import { globalStyles } from "@/constants/styles";
import { startSound, stopSound } from "@/services/soundService";
import { useDeviceSettingsStore } from "@/store/deviceSettingsStore";
import { useLanguageStore } from "@/store/languageStore";
import { useNotificationsStore } from "@/store/notificationsStore";
import { useThemeStore } from "@/store/themeStore";
import { PrayerEventType, PrayerType } from "@/types/notification.types";
import { MAIN_PRAYERS, PRAYER_EVENTS, PrayerName } from "@/types/prayer.types";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Linking, Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import notifee from "react-native-notify-kit";
import Sound from "react-native-sound";

interface SoundsOptionType {
    id: number;
    name: string;
    file: string;
}

interface TimeOptionType {
    label: string;
    prefix: string;
    offset: number;
}

export default function PrayersSettingsScreen() {
    // Get prayer name from route params
    const params = useLocalSearchParams<{ prayer: PrayerName }>();
    const prayerName = params.prayer;

    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);
    const notificationPermission = useDeviceSettingsStore((state) => state.notificationPermission);
    const prayers = useNotificationsStore((state) => state.prayers);
    const events = useNotificationsStore((state) => state.events);

    // Local state
    const [enabled, setEnabled] = useState(false);
    const [selectedOffset, setSelectedOffset] = useState(0);
    const [selectedSound, setSelectedSound] = useState(SOUNDS.azan1_short);
    // Sound preview state
    const [playingId, setPlayingId] = useState<number | null>(null);
    const [soundDurations, setSoundDurations] = useState<Record<string, number>>({});

    // Refs
    const playTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const ModalSheetRef = useRef<ModalSheetRef>(null);

    const TIME_OPTIONS: TimeOptionType[] = useMemo(() => {
        return [
            { prefix: '', label: tr.labels.offsetOnTime, offset: 0 },
            { prefix: '5', label: tr.labels.offsetMinutes, offset: -5 },
            { prefix: '10', label: tr.labels.offsetMinutes, offset: -10 },
            { prefix: '15', label: tr.labels.offsetMinutes, offset: -15 },
            { prefix: '30', label: tr.labels.offsetMinutes, offset: -30 },
            { prefix: '45', label: tr.labels.offsetMinutes, offset: -45 },
            { prefix: '60', label: tr.labels.offsetMinutes, offset: -60 },
        ];
    }, [tr]);

    const SOUND_OPTIONS: SoundsOptionType[] = useMemo(() => {
        return [
            { id: 1, name: tr.labels.noSound, file: '' }, // icon in the translations
            { id: 2, name: `Azan 1 (${tr.labels.short})`, file: SOUNDS.azan1_short },
            { id: 3, name: `Azan 2 (${tr.prayers.Fajr})`, file: SOUNDS.azan2_fajr },
            { id: 4, name: 'Azan 3', file: SOUNDS.azan3 },
            { id: 5, name: 'Azan 4', file: SOUNDS.azan4 },
            { id: 6, name: 'Alarm 1', file: SOUNDS.alarm1 },
            { id: 7, name: 'Alarm 2', file: SOUNDS.alarm2 },
            { id: 8, name: 'Alarm 3', file: SOUNDS.alarm3 },
        ];
    }, [tr]);

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
    const playPreview = async (soundFile: string, soundId: number) => {
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

        // Check if any changes were made before saving
        const stored = prayers?.[prayerName as PrayerType] || events?.[prayerName as PrayerEventType] || { enabled: false, offset: 0, sound: SOUNDS.azan1_short };
        if (enabled === stored.enabled && selectedOffset === stored.offset && selectedSound === stored.sound) {
            console.log("No changes detected, skipping save.");
            ModalSheetRef.current?.close();
            return;
        }

        // Determine if this is a prayer or event
        const isPrayer = MAIN_PRAYERS.includes(prayerName as PrayerName);
        const isEvent = PRAYER_EVENTS.includes(prayerName as PrayerName);

        // Prepare settings object to save
        const settings = { enabled: enabled, offset: selectedOffset, sound: selectedSound };

        // Update store
        if (isPrayer) {
            useNotificationsStore.getState().setPrayer(prayerName as PrayerType, settings);
        } else if (isEvent) {
            useNotificationsStore.getState().setEvent(prayerName as PrayerEventType, settings);
        }

        ModalSheetRef.current?.close();
    };

    // ------------------------------------------------------------
    // Cancel - dismiss without saving
    // ------------------------------------------------------------
    const handleCancel = async () => {
        await stopSound();
        if (playTimeoutRef.current) {
            clearTimeout(playTimeoutRef.current);
        }
        ModalSheetRef.current?.close();
    };

    // ------------------------------------------------------------
    // Open device notification settings
    // ------------------------------------------------------------
    const handleOpenNotifSettings = async () => {
        if (Platform.OS === "android") {
            await notifee.openNotificationSettings();
        } else {
            Linking.openSettings();
        }
    };

    // Dont render if no valid prayer name in params
    if (!prayerName) return null;

    // Fixed Footer with Cancel/Save buttons
    const FixedFooter = () => {
        return (
            <View style={[globalStyles.modalFooter, { backgroundColor: theme.card, borderTopColor: theme.divider }]}>
                <TouchableOpacity
                    style={[globalStyles.modalButton, globalStyles.modalCancelButton]}
                    onPress={handleCancel}
                >
                    <Text style={[globalStyles.modalButtonText, { color: theme.text2 }]}>
                        {tr.buttons.cancel}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[globalStyles.modalButton, styles.saveButton, { backgroundColor: theme.overlay, opacity: notificationPermission ? 1 : 0.4 }]}
                    onPress={handleSave}
                    disabled={!notificationPermission}
                >
                    <Text style={[globalStyles.modalButtonText, { color: theme.accent }]}>
                        {tr.buttons.save}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    // Main Content
    return (
        <ModalSheet
            ref={ModalSheetRef}
            size="full" // default
            colors={{ sheetBackgroundColor: theme.bg2, handleColor: theme.handle }}
            footer={<FixedFooter />}
        >

            <View style={globalStyles.modalContainer}>
                {/* Prayer Name Header */}
                <View style={styles.headerContainer}>
                    <Text style={[styles.headerTitle, { color: theme.accent }]}>
                        {tr.prayers[prayerName]}
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
                        {tr.labels.notificationSettings}
                    </Text>
                </View>

                {/* SECTIONS: all disabled when notificationPermission is off */}
                <View>
                    <View style={{ gap: 10 }} pointerEvents={notificationPermission ? 'auto' : 'none'}>
                        {!notificationPermission && (
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg2, opacity: 0.7, zIndex: 10, borderRadius: 12 }]} />
                        )}

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

                        {/* SECTIONS 2 & 3: disabled when notification is off */}
                        <View style={{ gap: 10 }} pointerEvents={enabled ? 'auto' : 'none'}>
                            {!enabled && (
                                // Overlay to indicate disabled state
                                <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg2, opacity: 0.7, zIndex: 10, borderRadius: 12 }]} />
                            )}

                            {/* SECTION 2: Offset chips */}
                            <AppCard style={styles.sectionCard}>
                                <View style={[styles.sectionHeader, { marginBottom: 12 }]}>
                                    <Ionicons name="time-outline" size={20} color={theme.accent} />
                                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                        {tr.labels.notificationTime}
                                    </Text>
                                </View>

                                {/* Wrapped time Chips */}
                                <View style={styles.offsetContainer}>
                                    {TIME_OPTIONS.map((option) => (
                                        <TouchableOpacity
                                            key={option.offset}
                                            style={[
                                                styles.offsetChipRow,
                                                { borderColor: theme.divider2 },
                                                selectedOffset === option.offset && {
                                                    backgroundColor: theme.accentLight,
                                                    borderColor: theme.accent,
                                                }
                                            ]}
                                            onPress={() => setSelectedOffset(option.offset)}
                                        >
                                            <Text
                                                style={[
                                                    styles.offsetChipText,
                                                    { color: theme.text2 },
                                                ]}
                                            >
                                                {/* Left: Prefix of the Label (5,15,30...) */}
                                                {option.prefix && (
                                                    <Text style={{ fontWeight: '700', color: theme.danger }}>{option.prefix} </Text>
                                                )}
                                                {/* Center: Label */}
                                                {option.label}
                                            </Text>
                                            {/* Right: Checkmark */}
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
                                    <MaterialCommunityIcons name="cellphone-sound" size={20} color={theme.accent} />
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
                                                { borderColor: theme.divider2 },
                                                selectedSound === sound.file && {
                                                    backgroundColor: theme.accentLight,
                                                    borderColor: theme.accent,
                                                }
                                            ]}
                                        >
                                            {/* Left: selectable area */}
                                            <TouchableOpacity
                                                style={styles.soundLeft}
                                                onPress={() => setSelectedSound(sound.file)}
                                            >
                                                {/* Left: Checkmark */}
                                                {selectedSound === sound.file && (
                                                    <Ionicons name="checkmark" size={16} color={theme.accent} />
                                                )}
                                                {/* Left: Sound name */}
                                                <Text
                                                    style={[
                                                        styles.soundName,
                                                        { color: sound.file ? theme.text : theme.text2 },
                                                    ]}
                                                >
                                                    {sound.name}
                                                </Text>
                                                {/* Right: Sound duration */}
                                                {sound.file && (
                                                    <Text style={[styles.soundDuration, { color: theme.text2 }]}>
                                                        {soundDurations[sound.id] && soundDurations[sound.id] >= 60
                                                            ? `${(soundDurations[sound.id] / 60).toFixed(1)}m`
                                                            : `${soundDurations[sound.id]?.toFixed(0)}s`
                                                        }
                                                    </Text>
                                                )}
                                            </TouchableOpacity>

                                            {/* Right: Play Button */}
                                            {sound.file && (
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
                                                        name={(playingId === sound.id) ? "stop-circle" : "play-circle"}
                                                        size={26}
                                                        color={(playingId === sound.id) ? theme.accent : theme.text2}
                                                    />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            </AppCard>

                        </View>
                    </View>

                    {/* Permission prompt — shown above the dimmed sections when notificationPermission=false */}
                    {!notificationPermission && (
                        <View style={[styles.permissionCardAlert, { backgroundColor: theme.card }]}>
                            <MaterialCommunityIcons name="bell-off-outline" size={44} color={theme.accent2} />
                            <Text style={[styles.permissionTitle, { color: theme.text2 }]}>
                                {tr.labels.notificationsDisabled}
                            </Text>
                            <Text style={[styles.permissionSubtitle, { color: theme.textMuted }]}>
                                {tr.labels.notificationsDisabledMessage}
                            </Text>
                            <TouchableOpacity
                                style={[styles.permissionButton, { backgroundColor: theme.overlay }]}
                                onPress={handleOpenNotifSettings}
                            >
                                <MaterialCommunityIcons name="cog-outline" size={18} color={theme.accent2} />
                                <Text style={[styles.permissionButtonText, { color: theme.accent }]}>
                                    {tr.buttons.openSettings}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>

        </ModalSheet>
    );
}

const styles = StyleSheet.create({
    // Header styles
    headerContainer: {
        paddingHorizontal: 16,
        paddingBottom: 6,
    },
    headerTitle: {
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

    // Offset selection styles
    offsetContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    offsetChipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1.5,
        gap: 6,
    },
    offsetChipText: {
        fontSize: 14,
    },

    // Sound selection styles
    soundsContainer: {
        gap: 6,
    },
    soundRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 48,
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

    // Permission prompt styles
    permissionCardAlert: {
        position: 'absolute',
        left: 20,
        right: 20,
        top: '25%',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 12,
        zIndex: 20,
    },
    permissionTitle: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
    permissionSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    permissionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
        gap: 6,
    },
    permissionButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },

    // Footer
    saveButton: {},
});