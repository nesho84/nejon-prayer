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
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import * as Location from "expo-location";
import { useThemeContext } from "@/contexts/ThemeContext";
import { useSettingsContext } from "@/contexts/SettingsContext";
import { usePrayersContext } from "@/contexts/PrayersContext";
import useTranslation from "@/hooks/useTranslation";
import useNotifications from "@/hooks/useNotifications";
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
    const {
        prayersTimes,
        prayersLoading,
        prayersError,
        hasPrayersTimes,
        lastFetchedDate,
        refetchPrayersTimes
    } = usePrayersContext();
    const { schedulePrayerNotifications, cancelPrayerNotifications } = useNotifications();

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
    // Handle Notifications
    // ----------------------------------------------------------------
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
        } catch (error) {
            console.error('Error checking notifications permission:', error);
            Alert.alert(tr("labels.error"), tr("labels.notificationError"));
        } finally {
            setLocalLoading(false);
        }
    }

    // ----------------------------------------------------------------
    // Open Alarm & reminders settings
    // ----------------------------------------------------------------
    const openAlarmPermissionSettings = async () => {
        if (Platform.OS === "android") {
            await notifee.openAlarmPermissionSettings();
        } else {
            Linking.openSettings();
        }
    };

    // ----------------------------------------------------------------
    // Open Battery settings
    // ----------------------------------------------------------------
    const openBatteryOptimizationSettings = async () => {
        if (Platform.OS === "android") {
            await notifee.openBatteryOptimizationSettings();
        } else {
            Linking.openSettings();
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
                        <Switch
                            value={deviceSettings.locationPermission}
                            onValueChange={null}
                            disabled={true}
                            trackColor={{ false: theme.placeholder, true: theme.primary }}
                            thumbColor={theme.primaryText}
                        />
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
                    <View style={styles.statusRow}>
                        <Text style={[styles.settingTitle, { color: theme.primaryText }]}>
                            {tr("labels.notifications")}
                        </Text>
                        <Switch
                            value={deviceSettings.notificationPermission}
                            onValueChange={handleNotifications}
                            disabled={localLoading}
                            trackColor={{ false: theme.placeholder, true: theme.primary }}
                            thumbColor={theme.primaryText}
                        />
                    </View>

                    {/* Battery Optimization */}
                    <View style={[styles.divider, { borderColor: theme.divider }]}></View>
                    <>
                        <View style={styles.statusRow}>
                            <Text style={[styles.statusText, { color: theme.primaryText }]}>
                                {tr("labels.batteryOptTitle")} {deviceSettings.batteryOptimization ? "" : "✅ Unrestricted"}
                            </Text>
                            <Pressable onPress={openBatteryOptimizationSettings} disabled={localLoading}>
                                <Text style={{ color: theme.primary }}>{tr("buttons.openSettings")}</Text>
                            </Pressable>
                        </View>
                        {deviceSettings.batteryOptimization &&
                            <Text style={[styles.subText, { color: theme.secondaryText, marginTop: 4, marginBottom: 3 }]}>
                                {tr("labels.batteryOptBody")}
                            </Text>}
                    </>

                    {/* Alarm&reminders (show only if alarmPermission=false and batteryOptimization=true) */}
                    {(!deviceSettings.alarmPermission && deviceSettings.batteryOptimization) &&
                        <>
                            <View style={[styles.divider, { borderColor: theme.divider }]}></View>
                            <View style={styles.statusRow}>
                                <Text style={[styles.statusText, { color: theme.primaryText }]}>
                                    {tr("labels.alarmAccessTitle")}
                                </Text>
                                <Pressable onPress={openAlarmPermissionSettings} disabled={localLoading}>
                                    <Text style={{ color: theme.primary }}>{tr("buttons.openSettings")}</Text>
                                </Pressable>
                            </View>
                            <Text style={[styles.subText, { color: theme.secondaryText, marginTop: 4, marginBottom: 3 }]}>
                                {tr("labels.alarmAccessBody")}
                            </Text>
                        </>
                    }
                </View>

                {/* Prayer Times Status */}
                <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
                    <Text style={[styles.settingTitle, { color: theme.primaryText }]}>
                        {tr("labels.prayerTimesStatus")}
                    </Text>
                    <View style={[styles.divider, { borderColor: theme.divider }]}></View>
                    <View style={styles.statusRow}>
                        <Text style={[styles.statusText, { color: theme.secondaryText }]}>
                            {hasPrayersTimes ? (tr("labels.loaded")) : (tr("labels.notLoaded"))}
                        </Text>
                        {/* Prayers loading... */}
                        {prayersLoading ? (<ActivityIndicator size="small" color={theme.accent} />)
                            : (<Ionicons name="refresh" size={24} color={theme.accent} onPress={handlePrayersRefresh} />)}
                    </View>
                    {/* lastFetchedDate */}
                    {lastFetchedDate && (
                        <Text style={[styles.addressText, { color: theme.secondaryText }]}>
                            {lastFetchedDate || (tr("labels.loading"))}
                        </Text>
                    )}
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
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 3,
    },
    settingTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    statusText: {
        fontSize: 16,
    },
    subText: {
        fontSize: 14,
        marginBottom: 20,
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
        marginTop: 12,
    },
    divider: {
        width: "100%",
        borderWidth: 1,
        marginVertical: 8,
    },
    resetLocationButton: {
        backgroundColor: '#1f1f1fb9',
        alignItems: 'center',
        padding: 10,
        marginTop: 12,
        borderRadius: 8,
    },
    resetLocationButtonText: {
        color: "#e2d5d5ff",
        fontSize: 16,
        fontWeight: '600',
    },
    addressText: {
        marginTop: 8,
        marginBottom: 1,
    },
    errorText: {
        fontSize: 16,
        color: '#FF3B30',
        textAlign: 'center',
        marginBottom: 20,
    },
});
