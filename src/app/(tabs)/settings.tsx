import AppCard from "@/components/AppCard";
import AppLoading from "@/components/AppLoading";
import AppTabScreen from "@/components/AppTabScreen";
import CustomPicker from "@/components/CustomPicker";
import { useDeviceSettingsStore } from "@/store/deviceSettingsStore";
import { useLanguageStore } from "@/store/languageStore";
import { useLocationStore } from "@/store/locationStore";
import { useNotificationsStore } from "@/store/notificationsStore";
import { usePrayersStore } from "@/store/prayersStore";
import { useThemeStore } from "@/store/themeStore";
import { Language, LANGUAGES } from "@/types/language.types";
import { SpecialType } from "@/types/notification.types";
import { Theme, THEMES } from "@/types/theme.types";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import Slider from '@react-native-community/slider';
import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import notifee, { AuthorizationStatus } from "react-native-notify-kit";

export default function SettingsScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const themeMode = useThemeStore((state) => state.themeMode);
    const language = useLanguageStore((state) => state.language);
    const tr = useLanguageStore((state) => state.tr);
    const locationPermission = useDeviceSettingsStore((state) => state.locationPermission);
    const notificationPermission = useDeviceSettingsStore((state) => state.notificationPermission);
    const batteryOptimization = useDeviceSettingsStore((state) => state.batteryOptimization);
    const alarmPermission = useDeviceSettingsStore((state) => state.alarmPermission);
    const deviceSettingsReady = useDeviceSettingsStore((state) => state.isReady);
    const deviceSettingsError = useDeviceSettingsStore((state) => state.deviceSettingsError);
    const location = useLocationStore((state) => state.location);
    const fullAddress = useLocationStore((state) => state.fullAddress);
    const locationReady = useLocationStore((state) => state.isReady);
    const prayerTimes = usePrayersStore((state) => state.prayerTimes);
    const prayersError = usePrayersStore((state) => state.prayersError);
    const prayersOutdated = usePrayersStore((state) => state.prayersOutdated);
    const lastFetchedDate = usePrayersStore((state) => state.lastFetchedDate);
    const prayersLoading = usePrayersStore((state) => state.isLoading);
    const notifSettings = useNotificationsStore((state) => state.notifSettings);
    const notifReady = useNotificationsStore((state) => state.isReady);
    const specials = useNotificationsStore((state) => state.specials);

    // Local state
    const [localLoading, setLocalLoading] = useState(false);
    const [tempVolume, setTempVolume] = useState(Number(notifSettings?.volume ?? 1.0));

    // Refs
    const saveTimeout = useRef<NodeJS.Timeout | number | null>(null);

    // ------------------------------------------------------------
    // Change theme
    // ------------------------------------------------------------
    const handleTheme = async (value: Theme) => {
        if (themeMode === value) return; // no change

        setLocalLoading(true);
        try {
            // Update themeStore
            useThemeStore.getState().setTheme(value);

            console.log("✅ Theme changed to:", value);
        } catch (err) {
            console.error("Theme change error:", err);
            Alert.alert(tr.labels.error, tr.labels.themeError);
        } finally {
            setLocalLoading(false);
        }
    };

    // ------------------------------------------------------------
    // Change Language
    // ------------------------------------------------------------
    const handleLanguage = async (value: Language) => {
        if (language === value) return; // no change

        setLocalLoading(true);
        try {
            // Update languageStore
            useLanguageStore.getState().setLanguage(value);
            console.log("🌐 Language changed to:", value);
        } catch (err) {
            console.error("Language change error:", err);
            Alert.alert(tr.labels.error, tr.labels.languageError);
        } finally {
            setLocalLoading(false);
        }
    };

    // ------------------------------------------------------------
    // Update Location
    // ------------------------------------------------------------
    const updateLocation = async () => {
        setLocalLoading(true);
        try {
            await usePrayersStore.getState().reloadPrayerTimes();
        } catch (err) {
            console.warn("Prayers refresh failed:", err);
        } finally {
            setLocalLoading(false);
        }
    };

    // ------------------------------------------------------------
    // Handle prayers refresh
    // ------------------------------------------------------------
    const handlePrayersRefresh = async () => {
        setLocalLoading(true);
        try {
            await usePrayersStore.getState().reloadPrayerTimes();
        } catch (err) {
            console.warn("Prayers refresh failed:", err);
        } finally {
            setLocalLoading(false);
        }
    }

    // ------------------------------------------------------------
    // Handle Notifications
    // ------------------------------------------------------------
    async function handleNotifications() {
        setLocalLoading(true);
        try {
            if (!notificationPermission) {
                const settings = await notifee.requestPermission();
                if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
                    // Not allowed → open system settings
                    Alert.alert(
                        tr.labels.notificationsDisabled,
                        tr.labels.notificationsDisabledMessage,
                        [
                            { text: tr.buttons.cancel, style: "cancel" },
                            {
                                text: tr.buttons.openSettings,
                                onPress: async () => {
                                    if (Platform.OS === "android") {
                                        await notifee.openNotificationSettings();
                                    } else {
                                        Linking.openSettings();
                                    }
                                }
                            }
                        ]
                    );
                }
            }
            else {
                // Already allowed → open system settings
                if (Platform.OS === "android") {
                    await notifee.openNotificationSettings();
                } else {
                    Linking.openSettings();
                }
            }
        } catch (err) {
            console.error('Error checking notifications permission:', err);
            Alert.alert(tr.labels.error, tr.labels.notificationError);
        } finally {
            setLocalLoading(false);
        }
    }

    // ------------------------------------------------------------
    // Change Notification Sound Volume
    // ------------------------------------------------------------
    const handleVolume = async (value: number) => {
        if (notifSettings?.volume === Number(value.toFixed(2))) return; // no change

        setLocalLoading(true);

        // Clear any pending save
        if (saveTimeout.current) clearTimeout(saveTimeout.current);

        // Schedule save after debounce
        saveTimeout.current = setTimeout(async () => {
            try {
                // Save notifSettings
                useNotificationsStore.getState().setSettings({ volume: Number(value.toFixed(1)) });

                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                console.log("🌐 Sound Volume changed to:", Number(value.toFixed(1)));
            } catch (err) {
                console.error("Sound volume change error:", err);
                Alert.alert(tr.labels.error, tr.labels.volumeError);
            } finally {
                setLocalLoading(false);
            }
        }, 500);
    };

    // ------------------------------------------------------------
    // Toggle Notification Vibration
    // ------------------------------------------------------------
    const handleVibration = async (value: string) => {
        if (notifSettings?.vibration === value) return; // no change
        setLocalLoading(true);
        try {
            // Save notifSettings
            useNotificationsStore.getState().setSettings({ vibration: value });

            console.log("📳 Vibration pattern changed to:", value);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (err) {
            console.error("Vibration change error:", err);
            Alert.alert(tr.labels.error, tr.labels.vibrationError);
        } finally {
            setLocalLoading(false);
        }
    };

    // ------------------------------------------------------------
    // Toggle Special Notification (Friday, DailyQuote, etc.)
    // ------------------------------------------------------------
    const handleSpecialNotification = async (type: SpecialType, value: boolean) => {
        setLocalLoading(true);
        try {
            // Save special notification settings
            useNotificationsStore.getState().setSpecial(type, { enabled: value });

            console.log(`📳 ${type} Reminder changed to: ${value ? 'enabled' : 'disabled'}`);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (err) {
            console.error("Friday Reminder change error:", err);
            Alert.alert(tr.labels.error, tr.labels.specialNotificationError);
        } finally {
            setLocalLoading(false);
        }
    };

    // ------------------------------------------------------------
    // Change Notification snozee timeout
    // ------------------------------------------------------------
    const handleSnooze = async (value: number) => {
        if (notifSettings?.snooze === value) return; // no change

        setLocalLoading(true);
        try {
            // Save notifSettings
            useNotificationsStore.getState().setSettings({ snooze: value });

            console.log(`⏳ Snooze timeout changed to: ${value}min`);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (err) {
            console.error("Snooze timeout change error:", err);
            Alert.alert(tr.labels.error, tr.labels.snoozeError);
        } finally {
            setLocalLoading(false);
        }
    };

    // ------------------------------------------------------------
    // Open Notifications settings
    // ------------------------------------------------------------
    const openNotificationSettings = async () => {
        if (Platform.OS === "android") {
            await notifee.openNotificationSettings();
        } else {
            Linking.openSettings();
        }
    };

    // ------------------------------------------------------------
    // Open Battery settings
    // ------------------------------------------------------------
    const openBatteryOptimizationSettings = async () => {
        if (Platform.OS === "android") {
            await notifee.openBatteryOptimizationSettings();
        } else {
            Linking.openSettings();
        }
    };

    // ------------------------------------------------------------
    // Open Alarm & reminders settings
    // ------------------------------------------------------------
    const openAlarmPermissionSettings = async () => {
        if (Platform.OS === "android") {
            await notifee.openAlarmPermissionSettings();
        } else {
            Linking.openSettings();
        }
    };

    // Loading state
    if (!deviceSettingsReady || !locationReady || !notifReady) {
        // prayersLoading is not used, because it covers the entire screen!
        return <AppLoading text={tr.labels.loadingSettings} />
    }

    // Error state
    if (deviceSettingsError) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: theme.bg }]}>
                <View style={styles.errorBanner}>
                    <Ionicons name="settings-outline" size={80} color={theme.primary} />
                </View>
                <Text style={[styles.errorText, { color: theme.text2 }]}>{tr.labels.deviceSettingsError}</Text>
            </View>
        );
    }

    // Main Content
    return (
        <AppTabScreen>
            {/* Inline Loading */}
            {localLoading && <AppLoading inline={true} text={tr.labels.updatingSettings} />}

            <ScrollView
                style={[styles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {/* ------ Theme Setting ------ */}
                <AppCard style={styles.settingCard}>
                    <Text style={[styles.settingTitle, { color: theme.text }]}>
                        {tr.labels.theme}
                    </Text>
                    <CustomPicker
                        style={styles.picker}
                        items={THEMES}
                        selectedValue={themeMode}
                        onValueChange={(value) => handleTheme(value as Theme)}
                        enabled={!localLoading}
                        textColor={theme.text}
                        selectedColor={theme.text}
                        backgroundColor={theme.overlay}
                        modalBackgroundColor={theme.card}
                    />
                </AppCard>

                {/* ------ Language Setting ------ */}
                <AppCard style={styles.settingCard}>
                    <Text style={[styles.settingTitle, { color: theme.text }]}>
                        {tr.labels.language}
                    </Text>
                    <CustomPicker
                        style={styles.picker}
                        items={LANGUAGES}
                        selectedValue={language}
                        onValueChange={(value) => handleLanguage(value as Language)}
                        enabled={!localLoading}
                        textColor={theme.text}
                        selectedColor={theme.text}
                        backgroundColor={theme.overlay}
                        modalBackgroundColor={theme.card}
                    />
                </AppCard>

                {/* ------ Location Setting ------ */}
                <AppCard style={styles.settingCard}>
                    <View style={styles.statusRow}>
                        <Text style={[styles.settingTitle, { color: theme.text }]}>
                            {tr.labels.location}
                        </Text>
                        <MaterialIcons
                            name={locationPermission ? "location-on" : "location-off"}
                            size={24}
                            color={locationPermission ? theme.accent : theme.border} />
                    </View>

                    {/* Divider */}
                    <View style={[styles.divider, { borderColor: theme.divider2 }]}></View>

                    {/* Update Location Button */}
                    <TouchableOpacity
                        style={[styles.updateLocationButton, { backgroundColor: theme.overlay }]}
                        onPress={updateLocation}
                        disabled={localLoading}
                    >
                        <MaterialCommunityIcons name="web-refresh" size={16} color={theme.text2} />
                        <Text style={[styles.updateLocationButtonText, { color: theme.text2 }]}>
                            {location ? (tr.labels.locationButtonText1) : (tr.labels.locationButtonText2)}
                        </Text>
                    </TouchableOpacity>

                    {/* fullAddress */}
                    {fullAddress && (
                        <Text style={[styles.addressText, { color: theme.placeholder }]}>
                            {fullAddress || (tr.labels.loading)}
                        </Text>
                    )}
                </AppCard>

                {/* ------ Prayer Times Status ------ */}
                <AppCard style={styles.settingCard}>
                    <Text style={[styles.settingTitle, { color: theme.text }]}>
                        {tr.labels.prayerTimesStatus}
                    </Text>

                    {/* Divider */}
                    <View style={[styles.divider, { borderColor: theme.divider2 }]}></View>

                    <View style={styles.statusRow}>
                        {/* Prayers Status */}
                        <Text style={[styles.statusText, { color: theme.text2 }]}>
                            {prayerTimes ? (tr.labels.loaded) : (tr.labels.notLoaded)}
                        </Text>
                        {/* lastFetchedDate */}
                        {lastFetchedDate && (
                            <Text style={[styles.fetchedDateText, { color: theme.placeholder }]}>
                                {lastFetchedDate || (tr.labels.loading)}
                            </Text>
                        )}
                        {/* Prayers loading icon */}
                        {(prayersLoading || localLoading)
                            ? (<ActivityIndicator size="small" color={theme.accent} />)
                            : (<Ionicons name="refresh" size={24} color={theme.accent} onPress={handlePrayersRefresh} />)}
                    </View>

                    {/* prayersError */}
                    {prayersError &&
                        <>
                            {/* Divider */}
                            <View style={[styles.divider, { borderColor: theme.divider2 }]}></View>

                            <Text style={[styles.statusSubText, { color: theme.text2, marginBottom: 3 }]}>
                                ⚠️ {tr.labels.prayersError}
                            </Text>
                        </>
                    }
                    {/* prayersOutdated */}
                    {prayersOutdated &&
                        <>
                            {/* Divider */}
                            <View style={[styles.divider, { borderColor: theme.divider2 }]}></View>

                            <Text style={[styles.statusSubText, { color: theme.text2, marginBottom: 3 }]}>
                                {tr.labels.prayerTimesOutdated}
                            </Text>
                        </>
                    }
                </AppCard>

                {/* ------ Notifications Settings ------ */}
                <AppCard style={styles.settingCard}>
                    <View style={styles.statusRow}>
                        <Text style={[styles.settingTitle, { color: theme.text }]}>
                            {tr.labels.notifications}
                        </Text>
                        <Switch
                            value={notificationPermission}
                            onValueChange={handleNotifications}
                            disabled={localLoading}
                            trackColor={{ false: theme.overlay, true: theme.accent }}
                            thumbColor={notificationPermission ? theme.border : theme.border}
                        />
                    </View>

                    {/* Divider */}
                    <View style={[styles.divider, { borderColor: theme.divider2 }]}></View>

                    {/* ------ Notifications (Disabled overlay when notificationPermission=false) ------ */}
                    <View style={styles.subSections} pointerEvents={notificationPermission ? 'auto' : 'none'}>
                        {!notificationPermission && (
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.card, opacity: 0.7, zIndex: 10, borderRadius: 12 }]} />
                        )}

                        {/* ------ Sound Volume ------ */}
                        <View style={[styles.subGroup, { backgroundColor: theme.overlayLight, borderColor: theme.border }]}>
                            <View style={styles.statusRow}>
                                <Text style={[styles.statusText, { color: theme.text }]}>
                                    {tr.labels.volume}
                                </Text>
                                <Text style={{ color: theme.text2, opacity: 0.7 }}>
                                    {tempVolume === 0 ? "off" : `${Math.round((tempVolume) * 100)}%`}
                                </Text>
                            </View>
                            <Slider
                                style={{ flex: 1, marginTop: 8, marginBottom: 3, marginHorizontal: -8 }}
                                minimumValue={0}
                                maximumValue={1}
                                step={0.1}
                                value={tempVolume}
                                onValueChange={setTempVolume}
                                onSlidingComplete={handleVolume}
                                minimumTrackTintColor={theme.primary}
                                maximumTrackTintColor={theme.border}
                                thumbTintColor={theme.accent}
                            />
                        </View>

                        {/* ------ Vibration ------ */}
                        <View style={[styles.subGroup, { backgroundColor: theme.overlayLight, borderColor: theme.border }]}>
                            <View style={styles.statusRow}>
                                <Text style={[styles.statusText, { color: theme.text }]}>
                                    {tr.labels.vibration}
                                </Text>
                                <Text style={{ color: theme.text2, opacity: 0.7 }}>
                                    {notifSettings?.vibration ?? 'short'}
                                </Text>
                            </View>
                            <View style={styles.presets}>
                                {(['off', 'short', 'medium', 'long'] as const).map((pattern) => {
                                    const label = pattern === 'off' ? 'off'
                                        : pattern === 'short' ? tr.labels.vibrationShort
                                            : pattern === 'medium' ? tr.labels.vibrationMedium
                                                : tr.labels.vibrationLong;
                                    return (
                                        <TouchableOpacity
                                            key={pattern}
                                            style={[
                                                styles.presetBtnWide,
                                                {
                                                    backgroundColor: notifSettings?.vibration === pattern ? theme.primary + '20' : theme.card,
                                                    borderColor: notifSettings?.vibration === pattern ? theme.primary : 'transparent',
                                                    marginTop: 4,
                                                    marginBottom: 2,
                                                }
                                            ]}
                                            onPress={() => handleVibration(pattern)}
                                            disabled={localLoading}
                                        >
                                            <Text style={[
                                                styles.presetText,
                                                { color: notifSettings?.vibration === pattern ? theme.primary : theme.text2 }
                                            ]}>
                                                {label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            <Text style={[styles.statusSubText, { color: theme.text2, marginTop: 8, marginBottom: 0 }]}>
                                {tr.labels.vibrationNote}{' '}
                                <Text onPress={openNotificationSettings} disabled={localLoading}>
                                    <Text style={{ color: theme.primary }}> {tr.buttons.openSettings}</Text>
                                </Text>
                            </Text>
                        </View>

                        {/* ------ Snooze/Reminder Timeout ------ */}
                        <View style={[styles.subGroup, { backgroundColor: theme.overlayLight, borderColor: theme.border }]}>
                            <View style={styles.statusRow}>
                                <Text style={[styles.statusText, { color: theme.text }]}>
                                    {tr.labels.remindLater}
                                </Text>
                                <Text style={{ color: theme.text2, opacity: 0.7 }}>
                                    {notifSettings?.snooze ?? 5}min
                                </Text>
                            </View>
                            <View style={styles.presets}>
                                {[1, 5, 10, 15, 20, 30, 60].map((st) => (
                                    <TouchableOpacity
                                        key={st}
                                        style={[
                                            styles.presetBtn,
                                            {
                                                backgroundColor: notifSettings?.snooze === st ? theme.primary + '20' : theme.card,
                                                borderColor: notifSettings?.snooze === st ? theme.primary : 'transparent',
                                                marginTop: 4,
                                                marginBottom: 2
                                            }
                                        ]}
                                        onPress={() => handleSnooze(st)}
                                    >
                                        <Text style={[
                                            styles.presetText,
                                            { color: notifSettings?.snooze === st ? theme.primary : theme.text2 }
                                        ]}>
                                            {st}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* ------ Friday Reminder + Daily Reminder ------ */}
                        <View style={[styles.subGroup, { backgroundColor: theme.overlayLight, borderColor: theme.border }]}>
                            <View style={styles.statusRow}>
                                <Text style={[styles.statusText, { color: theme.text }]}>
                                    {tr.labels.fridayReminder}
                                </Text>
                                <Switch
                                    value={specials.Friday.enabled}
                                    onValueChange={(value) => handleSpecialNotification('Friday', value)}
                                    disabled={localLoading}
                                    trackColor={{ false: theme.card, true: theme.primary }}
                                    thumbColor={specials.Friday.enabled ? theme.border : theme.border}
                                />
                            </View>
                            <View style={[styles.divider, { borderColor: theme.divider2 }]}></View>
                            <View style={styles.statusRow}>
                                <Text style={[styles.statusText, { color: theme.text }]}>
                                    {tr.labels.dailyReminders}
                                </Text>
                                <Switch
                                    value={specials.DailyQuote.enabled}
                                    onValueChange={(value) => handleSpecialNotification('DailyQuote', value)}
                                    disabled={localLoading}
                                    trackColor={{ false: theme.card, true: theme.primary }}
                                    thumbColor={specials.DailyQuote.enabled ? theme.border : theme.border}
                                />
                            </View>
                        </View>

                        {/* ------ Battery Optimization + Alarm ------ */}
                        <View style={[styles.subGroup, { backgroundColor: theme.overlayLight, borderColor: theme.border }]}>
                            <View style={styles.statusRow}>
                                <Text style={[styles.statusText, { color: theme.text }]}>
                                    {tr.labels.batteryOptTitle} {batteryOptimization ? "" : "✅"}
                                </Text>
                                <Pressable onPress={openBatteryOptimizationSettings} disabled={localLoading}>
                                    <Text style={{ color: theme.primary }}>{tr.buttons.openSettings}</Text>
                                </Pressable>
                            </View>
                            {batteryOptimization &&
                                <Text style={[styles.statusSubText, { color: theme.text2, marginTop: 8, marginBottom: 0 }]}>
                                    {tr.labels.batteryOptBody}
                                </Text>
                            }
                            {(!alarmPermission && batteryOptimization) &&
                                <>
                                    <View style={[styles.divider, { borderColor: theme.divider2 }]}></View>
                                    <View style={styles.statusRow}>
                                        <Text style={[styles.statusText, { color: theme.text }]}>
                                            {tr.labels.alarmAccessTitle}
                                        </Text>
                                        <Pressable onPress={openAlarmPermissionSettings} disabled={localLoading}>
                                            <Text style={{ color: theme.primary }}>{tr.buttons.openSettings}</Text>
                                        </Pressable>
                                    </View>
                                    <Text style={[styles.statusSubText, { color: theme.text2, marginTop: 8, marginBottom: 0 }]}>
                                        {tr.labels.alarmAccessBody}
                                    </Text>
                                </>
                            }
                        </View>

                    </View>
                </AppCard>

            </ScrollView>
        </AppTabScreen>
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
        gap: 10,
    },

    // Settings Card
    settingCard: {
        padding: 14,
    },
    settingTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statusText: {
        fontSize: 16,
    },
    statusSubText: {
        fontSize: 14,
        marginBottom: 20,
    },
    picker: {
        width: '100%',
        marginTop: 8,
    },
    divider: {
        width: "100%",
        borderWidth: 1,
        marginVertical: 8,
    },

    // Settings Card sub-groups
    subSections: {
        marginTop: 5,
        gap: 8,
    },
    subGroup: {
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
    },

    // Location
    updateLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        marginTop: 5,
        borderRadius: 8,
        gap: 6,
    },
    updateLocationButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    addressText: {
        marginTop: 8,
        marginBottom: 1,
    },
    fetchedDateText: {
        fontSize: 12,
    },

    // Presets
    presets: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-evenly',
        gap: 6,
        marginVertical: 6,
    },

    presetBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    presetBtnWide: {
        width: 'auto',
        paddingHorizontal: 14,
        height: 34,
        borderRadius: 17,
        borderWidth: 1,
        borderColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },

    presetText: {
        fontSize: 16,
        fontWeight: '600',
        opacity: 0.8,
    },

    // Error / Empty States
    errorContainer: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorBanner: {
        marginBottom: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    errorButton: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    errorButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
