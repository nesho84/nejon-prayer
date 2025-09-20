import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useThemeContext } from "@/contexts/ThemeContext";
import { useSettingsContext } from "@/contexts/SettingsContext";
import { usePrayersContext } from "@/contexts/PrayersContext";
import usePrayerNotifications from "@/hooks/usePrayerNotifications";
import useTranslation from "@/hooks/useTranslation";
import { Ionicons } from "@expo/vector-icons";
import { formatLocation } from "@/utils/timeZone";
import LoadingScreen from "@/components/LoadingScreen";

export default function SettingsScreen() {
    const { theme, currentTheme, changeTheme } = useThemeContext();
    const { tr, currentLang } = useTranslation();
    const { settings, reloadSettings, settingsLoading, settingsError, saveSettings } = useSettingsContext();
    const { prayersTimes, prayersLoading, prayersError, refetchPrayersTimes, hasPrayersTimes } = usePrayersContext();
    const { schedulePrayerNotifications, cancelPrayerNotifications } = usePrayerNotifications();

    // Local state
    const [localLoading, setLocalLoading] = useState(false);
    const [fullAddress, setFullAddress] = useState(null);

    // Show loading if contexts are loading or local operations
    const isLoading = settingsLoading || localLoading;

    // ----------------------------------------------------------------
    // Format address when location changes
    // ----------------------------------------------------------------
    useEffect(() => {
        (async () => {
            if (!settings?.location || settingsLoading) return;
            try {
                const formattedAddress = await formatLocation(settings.location);
                if (formattedAddress) setFullAddress(formattedAddress);
            } catch (err) {
                console.warn("Error formatting address:", err);
            }
        })();
    }, [settings?.location, settingsLoading]);

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
    // Change language
    // ----------------------------------------------------------------
    const handleLanguage = async (value) => {
        setLocalLoading(true);
        try {
            // Save settings
            await saveSettings({ language: value });
            console.log("🌐 Language changed to:", value);

            // Reschedule notifications with new language
            if (settings.notifications && hasPrayersTimes) {
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
    // Set or update location
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

            // Save settings
            await saveSettings({ location: loc.coords });
            console.log("📍 Location changed to:", loc.coords);

            // Reschedule notifications with new prayer times
            if (settings.notifications && hasPrayersTimes) {
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
    // Toggle notifications
    // ----------------------------------------------------------------
    const toggleNotifications = async (value) => {
        setLocalLoading(true);
        try {
            if (value) {
                // Check permission first
                const { status } = await Notifications.getPermissionsAsync();

                if (status !== 'granted') {
                    const { status: newStatus } = await Notifications.requestPermissionsAsync();
                    if (newStatus !== 'granted') {
                        // Denied → open system settings
                        Alert.alert(
                            tr("labels.notificationsDisabled"),
                            tr("labels.notificationsDisabledMessage"),
                            [
                                { text: tr("buttons.cancel"), style: "cancel" },
                                { text: tr("buttons.openSettings"), onPress: Linking.openSettings },
                            ]
                        );
                        return;
                    }
                }
            }

            // Save settings
            await saveSettings({ notifications: value });
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
            await reloadSettings();
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
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.content}>

                    {/* Theme Setting */}
                    <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
                        <Text style={[styles.settingTitle, { color: theme.primaryText }]}>
                            {tr("labels.theme")}
                        </Text>
                        <Picker
                            selectedValue={settings.theme || currentTheme}
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
                        <Text style={[styles.settingTitle, { color: theme.primaryText }]}>
                            {tr("labels.location")}
                        </Text>
                        <TouchableOpacity
                            style={styles.resetLocationButton}
                            onPress={resetLocation}
                            disabled={localLoading}
                        >
                            <Text style={styles.resetLocationButtonText}>
                                {settings.location
                                    ? (tr("labels.locationButtonText1"))
                                    : (tr("labels.locationButtonText2"))}
                            </Text>
                        </TouchableOpacity>
                        {settings.location && (
                            <Text style={[styles.addressText, { color: theme.secondaryText }]}>
                                {fullAddress || (tr("labels.loading"))}
                            </Text>
                        )}
                    </View>

                    {/* Notifications Setting */}
                    <View style={[styles.settingCard, styles.notificationCard, { backgroundColor: theme.card }]}>
                        <Text style={[styles.settingTitle, { color: theme.primaryText, paddingTop: 10 }]}>
                            {tr("labels.notifications")}
                        </Text>
                        <Switch
                            value={settings.notifications || false}
                            onValueChange={toggleNotifications}
                            disabled={localLoading}
                            trackColor={{ false: theme.border, true: theme.accent }}
                            thumbColor={settings.notifications ? theme.primary : theme.placeholder}
                        />
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

                </View>
            </ScrollView>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 16,
    },
    content: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    settingCard: {
        borderRadius: 12,
        marginBottom: 16,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
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
    notificationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    picker: {
        width: '100%',
        borderRadius: 8,
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
