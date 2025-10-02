import { useState } from "react";
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
import { Picker } from "@react-native-picker/picker";
import * as Location from "expo-location";
import { useThemeContext } from "@/contexts/ThemeContext";
import { useSettingsContext } from "@/contexts/SettingsContext";
import { usePrayersContext } from "@/contexts/PrayersContext";
import useTranslation from "@/hooks/useTranslation";
import notifee, { AuthorizationStatus } from "@notifee/react-native";
import { formatAddress, getTimeZone } from "@/utils/geoInfo";
import { Ionicons } from "@expo/vector-icons";
import AppLoading from "@/components/AppLoading";
import AppScreen from "@/components/AppScreen";

export default function SettingsScreen() {
    const { theme, themeMode, changeTheme } = useThemeContext();
    const { tr, language } = useTranslation();
    const {
        appSettings,
        deviceSettings,
        settingsLoading,
        settingsError,
        saveAppSettings,
        reloadAppSettings
    } = useSettingsContext();
    const {
        prayersLoading,
        prayersError,
        hasPrayerTimes,
        prayersOutdated,
        lastFetchedDate,
        reloadPrayerTimes
    } = usePrayersContext();

    // Local state
    const [localLoading, setLocalLoading] = useState(false);
    const isLoading = settingsLoading || localLoading;
    const hasError = settingsError || prayersError;

    // ------------------------------------------------------------
    // Change theme
    // ------------------------------------------------------------
    const handleTheme = async (value) => {
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
        setLocalLoading(true);
        try {
            // Save settings
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
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(tr("labels.locationDenied"), tr("labels.locationDeniedMessage"));
                return;
            }
            // Try high accuracy first, fallback to balanced
            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
                timeout: 5000,
            }).catch(() =>
                Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                    timeout: 10000,
                })
            );
            if (!loc?.coords) {
                Alert.alert(tr("labels.error"), tr("labels.locationError"));
                return;
            }

            const newFullAddress = await formatAddress(loc.coords);
            const newTimeZone = await getTimeZone(loc.coords); // not used!

            // Save settings
            await saveAppSettings({
                location: loc.coords,
                fullAddress: newFullAddress,
                timeZone: newTimeZone
            });

            console.log("📍 Location updated to:", loc.coords);
            // Reschedule notifications with new location (handled in NotificationsContext)
        } catch (err) {
            console.error("Location access error:", err);
            Alert.alert(tr("labels.error"), tr("labels.locationError"));
        } finally {
            setLocalLoading(false);
        }
    };

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
    // Handle prayers refresh
    // ------------------------------------------------------------
    const handlePrayersRefresh = async () => {
        try {
            await reloadPrayerTimes();
        } catch (err) {
            console.warn("Prayers refresh failed:", err);
        }
    }

    // Loading state
    if (isLoading) {
        return <AppLoading text={tr("labels.loadingSettings")} />
    }

    // Error state
    if (hasError) {
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
        <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.bg }]}
            showsVerticalScrollIndicator={false}
        >

            {/* Theme Setting */}
            <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                    {tr("labels.theme")}
                </Text>
                <Picker
                    selectedValue={themeMode}
                    onValueChange={handleTheme}
                    dropdownIconColor={theme.text}
                    dropdownIconRippleColor={theme.text}
                    style={[styles.picker, { backgroundColor: theme.overlay, color: theme.text }]}
                    enabled={!localLoading}
                >
                    <Picker.Item label="Dark" value="dark" />
                    <Picker.Item label="Light" value="light" />
                    <Picker.Item label="System" value="system" />
                </Picker>
            </View>

            {/* Language Setting */}
            <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                    {tr("labels.language")}
                </Text>
                <Picker
                    selectedValue={language}
                    onValueChange={handleLanguage}
                    dropdownIconColor={theme.text}
                    dropdownIconRippleColor={theme.text}
                    style={[styles.picker, { backgroundColor: theme.overlay, color: theme.text }]}
                    enabled={!localLoading}
                >
                    <Picker.Item label="English" value="en" />
                    <Picker.Item label="Shqip" value="sq" />
                    <Picker.Item label="Deutsch" value="de" />
                </Picker>
            </View>

            {/* Location Setting */}
            <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
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
                <View style={[styles.divider, { borderColor: theme.divider }]}></View>
                <TouchableOpacity
                    style={[styles.updateLocationButton, { backgroundColor: theme.overlay }]}
                    onPress={updateLocation}
                    disabled={localLoading}
                >
                    <Text style={[styles.updateLocationButtonText, { color: theme.text }]}>
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
            </View>

            {/* Notifications Settings */}
            <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
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

                {/* Battery Optimization */}
                <View style={[styles.divider, { borderColor: theme.divider }]}></View>
                <>
                    <View style={styles.statusRow}>
                        <Text style={[styles.statusText, { color: theme.text }]}>
                            {tr("labels.batteryOptTitle")} {deviceSettings.batteryOptimization ? "" : "✅ Unrestricted"}
                        </Text>
                        <Pressable onPress={openBatteryOptimizationSettings} disabled={localLoading}>
                            <Text style={{ color: theme.primary }}>{tr("buttons.openSettings")}</Text>
                        </Pressable>
                    </View>
                    {deviceSettings.batteryOptimization &&
                        <Text style={[styles.statusSubText, { color: theme.text2, marginTop: 8, marginBottom: 3 }]}>
                            {tr("labels.batteryOptBody")}
                        </Text>}
                </>

                {/* Alarm&reminders (show only if alarmPermission=false and batteryOptimization=true) */}
                {(!deviceSettings.alarmPermission && deviceSettings.batteryOptimization) &&
                    <>
                        <View style={[styles.divider, { borderColor: theme.divider }]}></View>
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
            </View>

            {/* Prayer Times Status */}
            <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                    {tr("labels.prayerTimesStatus")}
                </Text>
                <View style={[styles.divider, { borderColor: theme.divider }]}></View>
                <View style={styles.statusRow}>
                    <Text style={[styles.statusText, { color: theme.text2 }]}>
                        {hasPrayerTimes ? (tr("labels.loaded")) : (tr("labels.notLoaded"))}
                    </Text>
                    {/* lastFetchedDate */}
                    {lastFetchedDate && (
                        <Text style={[styles.fetchedDateText, { color: theme.placeholder }]}>
                            {lastFetchedDate || (tr("labels.loading"))}
                        </Text>
                    )}
                    {/* Prayers loading icon */}
                    {prayersLoading ? (<ActivityIndicator size="small" color={theme.accent} />)
                        : (<Ionicons name="refresh" size={24} color={theme.accent} onPress={handlePrayersRefresh} />)}
                </View>
                {/* prayersOutdated */}
                {prayersOutdated &&
                    <>
                        <View style={[styles.divider, { borderColor: theme.divider }]}></View>
                        <Text style={[styles.statusSubText, { color: theme.text2, marginBottom: 3 }]}>
                            {tr("labels.prayerTimesOutdated")}
                        </Text>
                    </>
                }
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 12,
    },
    settingCard: {
        borderRadius: 8,
        marginBottom: 12,
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 14,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
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
    updateLocationButton: {
        alignItems: 'center',
        padding: 10,
        marginTop: 5,
        borderRadius: 8,
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
