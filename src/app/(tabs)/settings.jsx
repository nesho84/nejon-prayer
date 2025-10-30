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
import Slider from '@react-native-community/slider';
import { Picker } from "@react-native-picker/picker";
import * as Haptics from "expo-haptics";
import { useThemeContext } from "@/context/ThemeContext";
import { useAppContext } from "@/context/AppContext";
import { usePrayersContext } from "@/context/PrayersContext";
import useTranslation from "@/hooks/useTranslation";
import notifee, { AuthorizationStatus } from "@notifee/react-native";
import { getUserLocation, hasLocationChanged } from "@/services/locationService";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AppTabScreen from "@/components/AppTabScreen";
import AppLoading from "@/components/AppLoading";
import AppCard from "@/components/AppCard";

export default function SettingsScreen() {
    const { theme, themeMode, changeTheme } = useThemeContext();
    const { tr, language } = useTranslation();
    const {
        appSettings,
        deviceSettings,
        isLoading: settingsLoading,
        settingsError,
        saveAppSettings,
        reloadAppSettings
    } = useAppContext();
    const {
        prayerTimes,
        isLoading: prayersLoading,
        prayersOutdated,
        lastFetchedDate,
        prayersError,
        reloadPrayerTimes
    } = usePrayersContext();

    // Extract config for cleaner dependency tracking
    const notificationsConfig = appSettings?.notificationsConfig;

    // Local state
    const [localLoading, setLocalLoading] = useState(false);
    const [tempVolume, setTempVolume] = useState(Number(notificationsConfig?.volume ?? 1.0));

    const saveTimeout = useRef(null);

    // ------------------------------------------------------------
    // Handle settings refresh
    // ------------------------------------------------------------
    const handleSettingsRefresh = async () => {
        try {
            await reloadAppSettings();
        } catch (err) {
            console.warn("Settings refresh failed:", err);
        }
    }

    // ------------------------------------------------------------
    // Change theme
    // ------------------------------------------------------------
    const handleTheme = async (value) => {
        if (themeMode === value) return; // no change

        setLocalLoading(true);
        try {
            // Update ThemeContext
            await changeTheme(value);

            console.log("✅ Theme changed to:", value);
        } catch (err) {
            console.error("Theme change error:", err);
            Alert.alert(tr("labels.error"), tr("labels.themeError"));
        } finally {
            setLocalLoading(false);
        }
    };

    // ------------------------------------------------------------
    // Change Language
    // ------------------------------------------------------------
    const handleLanguage = async (value) => {
        if (appSettings.language === value) return; // no change

        setLocalLoading(true);
        try {
            // Save appSettings
            await saveAppSettings({ language: value });

            console.log("🌐 Language changed to:", value);
            // Reschedule notifications with new language (handled in NotificationsContext)
        } catch (err) {
            console.error("Language change error:", err);
            Alert.alert(tr("labels.error"), tr("labels.languageError"));
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
            // Get fresh location
            const data = await getUserLocation(tr);

            if (!data) {
                console.log("❌ Could not get location");
                return;
            }

            // Check for location changes
            if (!hasLocationChanged(appSettings, data)) {
                console.log("📍 Location unchanged — skipping save");
                return;
            } else {
                // Save appSettings
                await saveAppSettings({
                    location: data.location,
                    fullAddress: data.fullAddress,
                    timeZone: data.timeZone
                });

                console.log("📍 Location updated to:", data.location);
            }
            // Reschedule notifications with new location (handled in NotificationsContext)
        } catch (err) {
            console.error("Location access error:", err);
            Alert.alert(tr("labels.error"), tr("labels.locationError"));
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
            await reloadPrayerTimes();
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
            if (!deviceSettings.notificationPermission) {
                const settings = await notifee.requestPermission();
                if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
                    // Not allowed → open system settings
                    Alert.alert(
                        tr("labels.notificationsDisabled"),
                        tr("labels.notificationsDisabledMessage"),
                        [
                            { text: tr("buttons.cancel"), style: "cancel" },
                            {
                                text: tr("buttons.openSettings"),
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
            Alert.alert(tr("labels.error"), tr("labels.notificationError"));
        } finally {
            setLocalLoading(false);
        }
    }

    // ------------------------------------------------------------
    // Change Notification Sound Volume
    // ------------------------------------------------------------
    const handleVolume = async (value) => {
        if (notificationsConfig?.volume === Number(value.toFixed(2))) {
            return; // no change
        }

        setLocalLoading(true);

        // Clear any pending save
        if (saveTimeout.current) clearTimeout(saveTimeout.current);

        // Schedule save after debounce
        saveTimeout.current = setTimeout(async () => {
            try {
                // Save appSettings
                await saveAppSettings({
                    notificationsConfig: {
                        ...appSettings.notificationsConfig,
                        volume: Number(value.toFixed(1)),
                    }
                });

                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                console.log("🌐 Sound Volume changed to:", Number(value.toFixed(1)));
                // Reschedule notifications with new volume (handled in NotificationsContext)
            } catch (err) {
                console.error("Sound volume change error:", err);
                Alert.alert(tr("labels.error"), tr("labels.volumeError"));
            } finally {
                setLocalLoading(false);
            }
        }, 500);
    };

    // ------------------------------------------------------------
    // Change Notification Vibration
    // ------------------------------------------------------------
    const handleVibration = async (value) => {
        setLocalLoading(true);

        try {
            // Save appSettings
            await saveAppSettings({
                notificationsConfig: {
                    ...appSettings.notificationsConfig,
                    vibration: value ? 'on' : 'off',
                },
            });

            console.log("📳 Vibration changed to:", value ? 'on' : 'off');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (err) {
            console.error("Vibration change error:", err);
            Alert.alert(tr("labels.error"), tr("labels.vibrationError"));
        } finally {
            setLocalLoading(false);
        }
    };

    // ------------------------------------------------------------
    // Change Notification snozee timeout
    // ------------------------------------------------------------
    const handleSnooze = async (value) => {
        if (notificationsConfig?.snooze === value) {
            return; // no change
        }

        setLocalLoading(true);
        try {
            // Save appSettings
            await saveAppSettings({
                notificationsConfig: {
                    ...appSettings.notificationsConfig,
                    snooze: value,
                },
            });

            console.log(`⏳ Snooze timeout changed to: ${value}min`);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (err) {
            console.error("Snooze timeout change error:", err);
            Alert.alert(tr("labels.error"), tr("labels.snoozeError"));
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
    // Open Alarm & reminders settings
    // ------------------------------------------------------------
    const openAlarmPermissionSettings = async () => {
        if (Platform.OS === "android") {
            await notifee.openAlarmPermissionSettings();
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

    // Loading state
    if (settingsLoading) {
        return <AppLoading text={tr("labels.loadingSettings")} />
    }

    // Error state
    if (settingsError) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: theme.bg }]}>
                <View style={styles.errorBanner}>
                    <Ionicons name="settings-outline" size={80} color={theme.primary} />
                </View>
                <Text style={[styles.errorText, { color: theme.text2 }]}>{tr("labels.settingsError")}</Text>
                <TouchableOpacity
                    style={[styles.errorButton, { backgroundColor: theme.danger }]}
                    onPress={handleSettingsRefresh}>
                    <Text style={styles.errorButtonText}>{tr("buttons.retry")}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Main Content
    return (
        <AppTabScreen>
            {/* Inline Loading */}
            {localLoading && <AppLoading inline={true} text={tr("labels.updatingSettings")} />}

            <ScrollView
                style={[styles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {/* ------ Theme Setting ------ */}
                <AppCard style={styles.settingCard}>
                    <Text style={[styles.settingTitle, { color: theme.text }]}>
                        {tr("labels.theme")}
                    </Text>
                    <Picker
                        selectedValue={themeMode}
                        onValueChange={handleTheme}
                        dropdownIconColor={theme.text}
                        dropdownIconRippleColor={theme.text}
                        enabled={!localLoading}
                        style={[styles.picker, { backgroundColor: theme.overlay, color: theme.text }]}
                    >
                        <Picker.Item label="Dark" value="dark" />
                        <Picker.Item label="Light" value="light" />
                        <Picker.Item label="System" value="system" />
                    </Picker>
                </AppCard>

                {/* ------ Language Setting ------ */}
                <AppCard style={styles.settingCard}>
                    <Text style={[styles.settingTitle, { color: theme.text }]}>
                        {tr("labels.language")}
                    </Text>
                    <Picker
                        selectedValue={language}
                        onValueChange={handleLanguage}
                        dropdownIconColor={theme.text}
                        dropdownIconRippleColor={theme.text}
                        enabled={!localLoading}
                        style={[styles.picker, { backgroundColor: theme.overlay, color: theme.text }]}
                    >
                        <Picker.Item label="English" value="en" />
                        <Picker.Item label="Shqip" value="sq" />
                        <Picker.Item label="Deutsch" value="de" />
                    </Picker>
                </AppCard>

                {/* ------ Location Setting ------ */}
                <AppCard style={styles.settingCard}>
                    <View style={styles.statusRow}>
                        <Text style={[styles.settingTitle, { color: theme.text }]}>
                            {tr("labels.location")}
                        </Text>
                        <Switch
                            value={deviceSettings.locationPermission}
                            onValueChange={null}
                            disabled={true}
                            trackColor={{ false: theme.overlay, true: theme.placeholder }}
                            thumbColor={deviceSettings.locationPermission ? theme.border : theme.border}
                        />
                    </View>

                    {/* Divider */}
                    <View style={[styles.divider, { borderColor: theme.divider }]}></View>

                    {/* Update Location Button */}
                    <TouchableOpacity
                        style={[styles.updateLocationButton, { backgroundColor: theme.overlay }]}
                        onPress={updateLocation}
                        disabled={localLoading}
                    >
                        <MaterialCommunityIcons name="web-refresh" size={16} color={theme.text2} onPress={handlePrayersRefresh} />
                        <Text style={[styles.updateLocationButtonText, { color: theme.text2 }]}>
                            {appSettings.location
                                ? (tr("labels.locationButtonText1"))
                                : (tr("labels.locationButtonText2"))}
                        </Text>
                    </TouchableOpacity>

                    {/* fullAddress */}
                    {appSettings.fullAddress && (
                        <Text style={[styles.addressText, { color: theme.placeholder }]}>
                            {appSettings.fullAddress || (tr("labels.loading"))}
                        </Text>
                    )}
                </AppCard>

                {/* ------ Prayer Times Status ------ */}
                <AppCard style={styles.settingCard}>
                    <Text style={[styles.settingTitle, { color: theme.text }]}>
                        {tr("labels.prayerTimesStatus")}
                    </Text>

                    {/* Divider */}
                    <View style={[styles.divider, { borderColor: theme.divider }]}></View>

                    <View style={styles.statusRow}>
                        <Text style={[styles.statusText, { color: theme.text2 }]}>
                            {prayerTimes ? (tr("labels.loaded")) : (tr("labels.notLoaded"))}
                        </Text>
                        {/* lastFetchedDate */}
                        {lastFetchedDate && (
                            <Text style={[styles.fetchedDateText, { color: theme.placeholder }]}>
                                {lastFetchedDate || (tr("labels.loading"))}
                            </Text>
                        )}
                        {/* Prayers loading icon */}
                        {(prayersLoading || localLoading) ? (<ActivityIndicator size="small" color={theme.accent} />)
                            : (<Ionicons name="refresh" size={24} color={theme.accent} onPress={handlePrayersRefresh} />)}
                    </View>

                    {/* prayersError */}
                    {prayersError &&
                        <>
                            {/* Divider */}
                            <View style={[styles.divider, { borderColor: theme.divider2 }]}></View>

                            <Text style={[styles.statusSubText, { color: theme.text2, marginBottom: 3 }]}>
                                ⚠️ {tr("labels.prayersError")}
                            </Text>
                        </>
                    }

                    {/* prayersOutdated */}
                    {prayersOutdated &&
                        <>
                            {/* Divider */}
                            <View style={[styles.divider, { borderColor: theme.divider2 }]}></View>

                            <Text style={[styles.statusSubText, { color: theme.text2, marginBottom: 3 }]}>
                                {tr("labels.prayerTimesOutdated")}
                            </Text>
                        </>
                    }
                </AppCard>

                {/* ------ Notifications Settings ------ */}
                <AppCard style={styles.settingCard}>
                    <View style={styles.statusRow}>
                        <Text style={[styles.settingTitle, { color: theme.text }]}>
                            {tr("labels.notifications")}
                        </Text>
                        <Switch
                            value={deviceSettings.notificationPermission}
                            onValueChange={handleNotifications}
                            disabled={localLoading}
                            trackColor={{ false: theme.overlay, true: theme.accent }}
                            thumbColor={deviceSettings.notificationPermission ? theme.border : theme.border}
                        />
                    </View>

                    {/* ------ notificationsConfig (show only if notificationPermission=true) ------ */}
                    {deviceSettings.notificationPermission && (
                        <>
                            {/* Divider */}
                            <View style={[styles.divider, { borderColor: theme.divider }]}></View>

                            {/* ------ Sound Volume ------ */}
                            <View style={styles.statusRow}>
                                <Text style={[styles.statusText, { color: theme.text }]}>
                                    {tr("labels.volume")}
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
                                maximumTrackTintColor={theme.overlay}
                                thumbTintColor={theme.accent}
                            />

                            {/* Divider */}
                            <View style={[styles.divider, { borderColor: theme.divider2 }]}></View>

                            {/* ------ Vibration ------ */}
                            <View style={styles.statusRow}>
                                <Text style={[styles.statusText, { color: theme.text }]}>
                                    {tr("labels.vibration")}
                                </Text>
                                <Switch
                                    value={notificationsConfig?.vibration === 'on'}
                                    onValueChange={handleVibration}
                                    disabled={localLoading}
                                    trackColor={{ false: theme.overlay, true: theme.primary }}
                                    thumbColor={notificationsConfig?.vibration === 'on' ? theme.border : theme.border}
                                />
                            </View>
                            {/* Vibration Note */}
                            <Text style={[styles.statusSubText, { color: theme.text2, marginTop: 8, marginBottom: 3 }]}>
                                {tr("labels.vibrationNote")}
                                <Text onPress={openNotificationSettings} disabled={localLoading}>
                                    <Text style={{ color: theme.primary }}> {tr("buttons.openSettings")}</Text>
                                </Text>
                            </Text>

                            {/* Divider */}
                            <View style={[styles.divider, { borderColor: theme.divider2 }]}></View>

                            {/* ------ Snooze/Reminder Timeout ------ */}
                            <View style={styles.statusRow}>
                                <Text style={[styles.statusText, { color: theme.text }]}>
                                    {tr("labels.snooze")}
                                </Text>
                                <Text style={{ color: theme.text2, opacity: 0.7 }}>
                                    {notificationsConfig?.snooze ?? 5}min
                                </Text>
                            </View>
                            <View style={styles.presets}>
                                {[1, 5, 10, 15, 20, 30, 60].map((st) => (
                                    <TouchableOpacity
                                        key={st}
                                        style={[
                                            styles.presetBtn,
                                            {
                                                backgroundColor: notificationsConfig?.snooze === st ? theme.primary + '20' : theme.card,
                                                borderColor: notificationsConfig?.snooze === st ? theme.primary : 'transparent',
                                                marginTop: 8,
                                                marginBottom: 3
                                            }
                                        ]}
                                        onPress={() => handleSnooze(st)}
                                    >
                                        <Text style={[
                                            styles.presetText,
                                            { color: notificationsConfig?.snooze === st ? theme.primary : theme.text2 }
                                        ]}>
                                            {st}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Divider */}
                            <View style={[styles.divider, { borderColor: theme.divider2 }]}></View>

                            {/* ------ Battery Optimization ------ */}
                            <View style={styles.statusRow}>
                                <Text style={[styles.statusText, { color: theme.text }]}>
                                    {tr("labels.batteryOptTitle")} {deviceSettings.batteryOptimization ? "" : "✅"}
                                </Text>
                                <Pressable onPress={openBatteryOptimizationSettings} disabled={localLoading}>
                                    <Text style={{ color: theme.primary }}>{tr("buttons.openSettings")}</Text>
                                </Pressable>
                            </View>
                            {deviceSettings.batteryOptimization &&
                                <Text style={[styles.statusSubText, { color: theme.text2, marginTop: 8, marginBottom: 3 }]}>
                                    {tr("labels.batteryOptBody")}
                                </Text>}

                            {/* ------ Alarm&reminders (show only if alarmPermission=false and batteryOptimization=true) ------ */}
                            {(!deviceSettings.alarmPermission && deviceSettings.batteryOptimization) &&
                                <>
                                    {/* Divider */}
                                    <View style={[styles.divider, { borderColor: theme.divider2 }]}></View>
                                    <View style={styles.statusRow}>
                                        <Text style={[styles.statusText, { color: theme.text }]}>
                                            {tr("labels.alarmAccessTitle")}
                                        </Text>
                                        <Pressable onPress={openAlarmPermissionSettings} disabled={localLoading}>
                                            <Text style={{ color: theme.primary }}>{tr("buttons.openSettings")}</Text>
                                        </Pressable>
                                    </View>
                                    <Text style={[styles.statusSubText, { color: theme.text2, marginTop: 8, marginBottom: 3 }]}>
                                        {tr("labels.alarmAccessBody")}
                                    </Text>
                                </>
                            }
                        </>
                    )}
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
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 24,
        gap: 16,
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
