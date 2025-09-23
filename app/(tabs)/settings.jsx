import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import * as Location from "expo-location";
import { useThemeContext } from "@/contexts/ThemeContext";
import { useSettingsContext } from "@/contexts/SettingsContext";
import { usePrayersContext } from "@/contexts/PrayersContext";
import useTranslation from "@/hooks/useTranslation";
import usePrayerNotifications from "@/hooks/usePrayerNotifications";
import notifee, { AuthorizationStatus } from "@notifee/react-native";
import { formatAddress, formatTimezone } from "@/utils/geoInfo";
import { Ionicons } from "@expo/vector-icons";
import LoadingScreen from "@/components/LoadingScreen";

export default function SettingsScreen() {
    const { theme, themeMode, changeTheme } = useThemeContext();
    const { tr, currentLang } = useTranslation();
    const {
        appSettings,
        deviceSettings,
        settingsLoading,
        reloadAppSettings,
        settingsError,
        saveAppSettings
    } = useSettingsContext();
    const { prayersTimes, prayersLoading, prayersError, refetchPrayersTimes, hasPrayersTimes } = usePrayersContext();
    const { schedulePrayerNotifications, cancelPrayerNotifications } = usePrayerNotifications();

    // Local state
    const [localLoading, setLocalLoading] = useState(false);

    // Show loading if contexts are loading or local operations
    const isLoading = settingsLoading || localLoading;

    // ----------------------------------------------------------------
    // Change theme
    // ----------------------------------------------------------------
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

    // ----------------------------------------------------------------
    // Change Language
    // ----------------------------------------------------------------
    const handleLanguage = async (value) => {
        setLocalLoading(true);
        try {
            // Save settings
            await saveAppSettings({ language: value });
            console.log("🌐 Language changed to:", value);

            // Reschedule notifications with new language
            if (deviceSettings.notificationPermission && hasPrayersTimes) {
                await schedulePrayerNotifications(prayersTimes, value);
            }
        } catch (err) {
            console.error("Language change error:", err);
            Alert.alert(tr("labels.error"), tr("labels.languageError"));
        } finally {
            setLocalLoading(false);
        }
    };

    // ----------------------------------------------------------------
    // Reset Location
    // ----------------------------------------------------------------
    const resetLocation = async () => {
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
            const newTimeZone = await formatTimezone(loc.coords);

            // Save settings
            await saveAppSettings({
                location: loc.coords,
                fullAddress: newFullAddress,
                timeZone: newTimeZone
            });
            console.log("📍 Location changed to:", loc.coords);

            // Reschedule notifications with new prayer times
            if (deviceSettings.notificationPermission && hasPrayersTimes) {
                await schedulePrayerNotifications(prayersTimes);
            }
        } catch (err) {
            console.error("Location access error:", err);
            Alert.alert(tr("labels.error"), tr("labels.locationError"));
        } finally {
            setLocalLoading(false);
        }
    };

    // ----------------------------------------------------------------
    // We should just show the status of the notifcations permission, but if they are disabled,
    // we will show a button to navigate to app notification (openNotificationSettings)
    // we will get the permission back AuthorizationStatus.DENIED or AuthorizationStatus.AUTHORIZED
    // We should do this with the location, alarm, batery management also....
    // ----------------------------------------------------------------
    async function openAppNotificationSettings() {
        setLocalLoading(true);
        try {
            await notifee.openNotificationSettings();
            console.log('Notification settings opened!');
        } catch (error) {
            console.error('Failed to open notification settings:', error);
            Alert.alert(tr("labels.error"), tr("labels.notificationError"));
        } finally {
            setLocalLoading(false);
        }
    }

    // ----------------------------------------------------------------
    // Toggle notifications
    // ----------------------------------------------------------------
    const toggleNotifications = async (value) => {
        setLocalLoading(true);
        try {
            if (value) {
                const settings = await notifee.getNotificationSettings();
                if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
                    const newSettings = await notifee.requestPermission();
                    if (newSettings === AuthorizationStatus.DENIED) {
                        // Denied → open system settings
                        Alert.alert(
                            tr("labels.notificationsDisabled"),
                            tr("labels.notificationsDisabledMessage"),
                            [
                                { text: tr("buttons.cancel"), style: "cancel" },
                                {
                                    text: tr("buttons.openSettings"),
                                    onPress: await notifee.openNotificationSettings()
                                },
                            ]
                        );
                        return;
                    }
                }
            }

            // Save settings
            await saveAppSettings({ notificationPermission: value });
            console.log("✅ Notifications status changed to:", value);

            //  If granted, schedule notifications
            if (value && hasPrayersTimes) {
                await schedulePrayerNotifications(prayersTimes);
            } else {
                // User turned off notifications → cancel all scheduled notifications
                await cancelPrayerNotifications();
            }
        } catch (err) {
            console.error("Notifications toggle error:", err);
            Alert.alert(tr("labels.error"), tr("labels.notificationError"));
        } finally {
            setLocalLoading(false);
        }
    };

    // ----------------------------------------------------------------
    // Handle settings refresh
    // ----------------------------------------------------------------
    const handleSettingsRefresh = async () => {
        try {
            await reloadAppSettings();
        } catch (err) {
            console.warn("Settings refresh failed:", err);
        }
    }

    // ----------------------------------------------------------------
    // Handle prayers refresh
    // ----------------------------------------------------------------
    const handlePrayersRefresh = async () => {
        try {
            await refetchPrayersTimes();
        } catch (err) {
            console.warn("Prayers refresh failed:", err);
        }
    }

    // Loading State
    if (isLoading) {
        return (
            <LoadingScreen
                message={tr("labels.loadingSettings")}
                style={{ backgroundColor: theme.background }}
            />
        );
    }

    // Error State - settings
    if (settingsError) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>{tr("labels.settingsError")}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={handleSettingsRefresh}>
                        <Text style={styles.retryButtonText}>{tr("buttons.retry")}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Main Content
    return (
        <ScrollView
            style={[styles.scrollContainer, { backgroundColor: theme.background }]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            <SafeAreaView style={styles.innerContainer}>

                {/* Theme Setting */}
                <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
                    <Text style={[styles.settingTitle, { color: theme.primaryText }]}>
                        {tr("labels.theme")}
                    </Text>
                    <Picker
                        selectedValue={themeMode}
                        onValueChange={handleTheme}
                        dropdownIconColor={theme.primaryText}
                        dropdownIconRippleColor={theme.primaryText}
                        style={[styles.picker, { backgroundColor: theme.background, color: theme.primaryText }]}
                        enabled={!localLoading}
                    >
                        <Picker.Item label="Dark" value="dark" />
                        <Picker.Item label="Light" value="light" />
                        <Picker.Item label="System" value="system" />
                    </Picker>
                </View>

                {/* Language Setting */}
                <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
                    <Text style={[styles.settingTitle, { color: theme.primaryText }]}>
                        {tr("labels.language")}
                    </Text>
                    <Picker
                        selectedValue={currentLang}
                        onValueChange={handleLanguage}
                        dropdownIconColor={theme.primaryText}
                        dropdownIconRippleColor={theme.primaryText}
                        style={[styles.picker, { backgroundColor: theme.background, color: theme.primaryText }]}
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
                        <Text style={[styles.settingTitle, { color: theme.primaryText }]}>
                            {tr("labels.location")}
                        </Text>
                        <Text style={[styles.settingTitle, { color: theme.primaryText }]}>
                            {deviceSettings.locationPermission ? "✅ ON" : "❌ OFF"}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.resetLocationButton}
                        onPress={resetLocation}
                        disabled={localLoading}
                    >
                        <Text style={styles.resetLocationButtonText}>
                            {appSettings.location
                                ? (tr("labels.locationButtonText1"))
                                : (tr("labels.locationButtonText2"))}
                        </Text>
                    </TouchableOpacity>
                    {/* fullAddress */}
                    {appSettings.fullAddress && (
                        <Text style={[styles.addressText, { color: theme.secondaryText }]}>
                            {appSettings.fullAddress || (tr("labels.loading"))}
                        </Text>
                    )}
                </View>

                {/* Notifications Settings */}
                <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
                    {/* Notifications */}
                    <View style={styles.statusRow}>
                        <Text style={[styles.settingTitle, { color: theme.primaryText }]}>
                            {tr("labels.notifications")}
                        </Text>
                        <Switch
                            value={deviceSettings.notificationPermission || false}
                            onValueChange={openAppNotificationSettings}
                            disabled={localLoading}
                            trackColor={{ false: theme.border, true: theme.accent }}
                            thumbColor={deviceSettings.notificationPermission ? theme.primary : theme.placeholder}
                        />
                    </View>

                    {/* Notifications status */}
                    <View style={[styles.divider, { borderColor: theme.divider }]}></View>
                    <Text style={[styles.statusText, { color: theme.primaryText }]}>
                        {tr("labels.notifications")} {deviceSettings.notificationPermission ? "✅ ON" : "❌ OFF"}
                    </Text>

                    {/* Alarm & reminders (show only if Battery=Optimized) */}
                    {deviceSettings.batteryOptimization &&
                        <>
                            <View style={[styles.divider, { borderColor: theme.divider }]}></View>
                            <Text style={[styles.statusText, { color: theme.primaryText }]}>
                                Alarms & reminders {deviceSettings.alarmPermission ? "✅ ON" : "❌ OFF"}
                            </Text>
                        </>
                    }

                    {/* Battery Optimization */}
                    <View style={[styles.divider, { borderColor: theme.divider }]}></View>
                    <Text style={[styles.statusText, { color: theme.primaryText }]}>
                        Battery Optimization status: {deviceSettings.batteryOptimization ? "⚠️ Optimized" : "✅ Unrestricted"}
                    </Text>
                    <View style={[styles.divider, { borderColor: theme.divider }]}></View>
                </View>

                {/* Prayer Times Status */}
                <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
                    <Text style={[styles.settingTitle, { color: theme.primaryText }]}>
                        {tr("labels.prayerTimesStatus")}
                    </Text>
                    <View style={styles.statusRow}>
                        <Text style={[styles.statusText, { color: theme.secondaryText }]}>
                            {hasPrayersTimes ? (tr("labels.loaded")) : (tr("labels.notLoaded"))}
                        </Text>
                        {/* Prayers loading... */}
                        {prayersLoading && (
                            <ActivityIndicator size="small" color={theme.accent} />
                        )}
                        {/* Reload prayers... */}
                        {!prayersLoading &&
                            <Ionicons name="refresh" size={24} color={theme.accent} onPress={handlePrayersRefresh} />
                        }
                    </View>
                </View>

            </SafeAreaView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    innerContainer: {
        flex: 1,
        padding: 16,
        minHeight: '100%',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    settingCard: {
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 14,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    settingTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    retryButton: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    picker: {
        width: '100%',
        borderRadius: 8,
    },
    divider: {
        width: "100%",
        borderWidth: 1,
        marginVertical: 6,
    },
    resetLocationButton: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    resetLocationButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    addressText: {
        marginTop: 12,
        fontSize: 14,
        fontStyle: 'italic',
        lineHeight: 20,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statusText: {
        fontSize: 16,
    },
    errorText: {
        fontSize: 16,
        color: '#FF3B30',
        textAlign: 'center',
        marginBottom: 20,
    },
    subText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
    },
});
