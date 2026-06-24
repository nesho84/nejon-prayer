import AppCard from "@/components/AppCard";
import AppLayout from "@/components/AppLayout";
import AppLoading from "@/components/AppLoading";
import CustomPicker from "@/components/CustomPicker";
import { globalStyles } from "@/constants/styles";
import DebugPanel from "@/debug/DebugPanel";
import { restoreDefaults } from "@/services/resetAppService";
import { useDeviceSettingsStore } from "@/store/deviceSettingsStore";
import { useLanguageStore } from "@/store/languageStore";
import { useLocationStore } from "@/store/locationStore";
import { useNotificationsStore } from "@/store/notificationsStore";
import { usePrayersStore } from "@/store/prayersStore";
import { useThemeStore } from "@/store/themeStore";
import { Language, LANGUAGES } from "@/types/language.types";
import { SpecialType } from "@/types/notification.types";
import { Theme, THEMES } from "@/types/theme.types";
import { openAlarmPermissionSettings, openBatteryOptimizationSettings, openNotificationSettings } from "@/utils/system";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import Slider from '@react-native-community/slider';
import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
    const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Safe area insets
    const insets = useSafeAreaInsets();
    const topInset = insets.top + 4;
    const bottomInset = insets.bottom + 12;

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
                                onPress: openNotificationSettings,
                            }
                        ]
                    );
                }
            }
            else {
                // Already allowed → open system settings
                await openNotificationSettings();
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
    // Change Notification snooze timeout
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
    // Toggle Special Notification (Friday, Holidays, DailyQuote, etc.)
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
    // Reset App — wipes all data and relaunches into onboarding
    // ------------------------------------------------------------
    const confirmResetApp = async () => {
        setLocalLoading(true);
        try {
            const result = await restoreDefaults();

            if (result.status === "failed") {
                Alert.alert(tr.labels.error, tr.labels.resetAppErrorMessage);
                return;
            }

            if (result.status === "wiped-no-reload") {
                Alert.alert(tr.labels.resetAppDoneTitle, tr.labels.resetAppDoneMessage);
            }
            // "reloaded": app is already relaunching — nothing to show
        } finally {
            setLocalLoading(false);
        }
    };

    const handleResetApp = () => {
        Alert.alert(
            tr.labels.resetAppTitle,
            tr.labels.resetAppMessage,
            [
                { text: tr.buttons.cancel, style: "cancel" },
                { text: tr.labels.resetApp, style: "destructive", onPress: confirmResetApp },
            ]
        );
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
        <AppLayout>
            {/* Inline Loading */}
            {localLoading && <AppLoading inline={true} text={tr.labels.updatingSettings} />}

            <ScrollView
                style={[globalStyles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={[
                    globalStyles.scrollContent,
                    { paddingTop: topInset, paddingBottom: bottomInset }
                ]}
                showsVerticalScrollIndicator={false}
            >

                {/* ------ Debug Panel (dev only) ------ */}
                {__DEV__ && (
                    <AppCard style={styles.settingCard}>
                        <Text style={[styles.settingTitle, { color: theme.danger }]}>Debug Tools</Text>
                        {/* Divider */}
                        <View style={[styles.divider, { borderColor: theme.divider2 }]}></View>
                        <View style={[styles.subGroup, { backgroundColor: theme.overlayLight, borderColor: theme.border }]}>
                            <DebugPanel />
                        </View>
                    </AppCard>
                )}

                {/* ------ Theme Setting ------ */}
                <AppCard style={styles.settingCard}>
                    <Text style={[styles.settingTitle, { color: theme.text }]}>
                        {tr.labels.theme}
                    </Text>
                    <CustomPicker
                        style={styles.selectPicker}
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
                        style={styles.selectPicker}
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
                        style={[styles.wideButton, { backgroundColor: theme.overlay }]}
                        onPress={updateLocation}
                        disabled={localLoading}
                    >
                        <MaterialCommunityIcons name="web-refresh" size={16} color={theme.text2} />
                        <Text style={[styles.wideButtonText, { color: theme.text2 }]}>
                            {location ? (tr.labels.locationButtonText1) : (tr.labels.locationButtonText2)}
                        </Text>
                    </TouchableOpacity>

                    {/* fullAddress */}
                    {fullAddress && (
                        <Text style={[styles.infoText, { color: theme.placeholder }]}>
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

                        {/* ------ Friday Reminder + Daily Quote Reminder ------ */}
                        <View style={[styles.subGroup, { backgroundColor: theme.overlayLight, borderColor: theme.border }]}>
                            {/* Friday Reminder */}
                            <View style={styles.statusRow}>
                                <Text style={[styles.statusText, { color: theme.text }]}>
                                    {tr.labels.fridayReminder}
                                </Text>
                                <Switch
                                    value={specials.Friday?.enabled}
                                    onValueChange={(value) => handleSpecialNotification('Friday', value)}
                                    disabled={localLoading}
                                    trackColor={{ false: theme.card, true: theme.primary }}
                                    thumbColor={specials.Friday?.enabled ? theme.border : theme.border}
                                />
                            </View>

                            {/* Divider */}
                            <View style={[styles.divider, { borderColor: theme.divider2 }]}></View>

                            {/* Daily Quote Reminder */}
                            <View style={styles.statusRow}>
                                <Text style={[styles.statusText, { color: theme.text }]}>
                                    {tr.labels.dailyReminders}
                                </Text>
                                <Switch
                                    value={specials.DailyQuote?.enabled}
                                    onValueChange={(value) => handleSpecialNotification('DailyQuote', value)}
                                    disabled={localLoading}
                                    trackColor={{ false: theme.card, true: theme.primary }}
                                    thumbColor={specials.DailyQuote?.enabled ? theme.border : theme.border}
                                />
                            </View>

                            {/* Divider */}
                            <View style={[styles.divider, { borderColor: theme.divider2 }]}></View>

                            {/* Islamic Holidays Reminder */}
                            <View style={styles.statusRow}>
                                <Text style={[styles.statusText, { color: theme.text }]}>
                                    {tr.labels.holidayReminders}
                                </Text>
                                <Switch
                                    value={specials.Holidays?.enabled}
                                    onValueChange={(value) => handleSpecialNotification('Holidays', value)}
                                    disabled={localLoading}
                                    trackColor={{ false: theme.card, true: theme.primary }}
                                    thumbColor={specials.Holidays?.enabled ? theme.border : theme.border}
                                />
                            </View>
                        </View>

                        {/* ------ Battery & Alarms (Android only) ------ */}
                        {Platform.OS === 'android' &&
                            <View style={[styles.subGroup, { backgroundColor: theme.overlayLight, borderColor: theme.border }]}>
                                {/* Battery Optimization */}
                                <View style={styles.statusRow}>
                                    <Text style={[styles.statusText, { color: theme.text }]}>
                                        {tr.labels.batteryOptTitle} {batteryOptimization ? "" : " ✅"}
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
                                {/* Divider */}
                                <View style={[styles.divider, { borderColor: theme.divider2 }]}></View>
                                {/* Alarm & reminders */}
                                <View style={styles.statusRow}>
                                    <Text style={[styles.statusText, { color: theme.text }]}>
                                        {tr.labels.alarmAccessTitle} {!alarmPermission ? "" : " ✅"}
                                    </Text>
                                    <Pressable onPress={openAlarmPermissionSettings} disabled={localLoading}>
                                        <Text style={{ color: theme.primary }}>{tr.buttons.openSettings}</Text>
                                    </Pressable>
                                </View>
                                {!alarmPermission &&
                                    <Text style={[styles.statusSubText, { color: theme.text2, marginTop: 8, marginBottom: 0 }]}>
                                        {tr.labels.alarmAccessBody}
                                    </Text>
                                }
                            </View>
                        }
                    </View>
                </AppCard>

                {/* ------ Reset App ------ */}
                <AppCard style={styles.settingCard}>
                    <Text style={[styles.settingTitle, { color: theme.text2 }]}>
                        {tr.labels.resetAppRow}
                    </Text>

                    {/* Divider */}
                    <View style={[styles.divider, { borderColor: theme.divider2 }]}></View>

                    <TouchableOpacity
                        style={[styles.wideButton, { backgroundColor: theme.danger + '15' }]}
                        onPress={handleResetApp}
                        disabled={localLoading}
                    >
                        <MaterialCommunityIcons name="restore-alert" size={16} color={theme.danger} />
                        <Text style={[styles.wideButtonText, { color: theme.danger }]}>
                            {tr.labels.resetAppButton}
                        </Text>
                    </TouchableOpacity>

                    <Text style={[styles.infoText, { color: theme.placeholder }]}>
                        {tr.labels.resetAppMessage}
                    </Text>
                </AppCard>

            </ScrollView>
        </AppLayout>
    );
}

const styles = StyleSheet.create({
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
    selectPicker: {
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

    wideButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        marginTop: 5,
        borderRadius: 8,
        gap: 6,
    },
    wideButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    infoText: {
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
});
