import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { fetchPrayerTimes } from "@/hooks/api";
import { loadSettings, saveSettings } from "@/hooks/storage";
import usePrayerNotifications from "@/hooks/usePrayerNotifications";
import { Picker } from "@react-native-picker/picker";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Button, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Settings() {
    // ThemeContext
    const { theme, currentTheme, setContextTheme } = useTheme();
    // LanguageContext
    const { lang, currentLang, setContextLanguage } = useLanguage();
    const { schedulePrayerNotifications, cancelPrayerNotifications } = usePrayerNotifications();

    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({ language: "en", coords: null, notifications: false });
    const [address, setAddress] = useState(null);

    useEffect(() => {
        (async () => {
            const saved = await loadSettings();
            if (saved) setSettings(saved);

            setLoading(false);
        })();
    }, []);

    useEffect(() => {
        if (!settings.coords) {
            setAddress(null);
            return;
        }

        // Reverse geocode to get human-readable address
        (async () => {
            try {
                const [loc] = await Location.reverseGeocodeAsync({
                    latitude: settings.coords.latitude,
                    longitude: settings.coords.longitude,
                });

                if (loc) {
                    // Build a full readable address
                    const fullAddress = [
                        loc.street,
                        loc.name,
                        loc.postalCode,
                        loc.city,
                        loc.country
                    ].filter(Boolean).join(", ");
                    setAddress(fullAddress);
                }
            } catch (err) {
                console.error("Reverse geocoding error:", err);
                setAddress(null);
            }
        })();
    }, [settings.coords]);

    // Save settings and re-schedule notifications
    async function updateAndSchedule(newSettings) {
        setLoading(true);
        try {
            setSettings(newSettings);
            await saveSettings(newSettings);

            // If notifications and location enabled, re-schedule notifications
            if (newSettings.notifications && newSettings.coords) {
                const times = await fetchPrayerTimes(newSettings.coords.latitude, newSettings.coords.longitude);
                if (times) await schedulePrayerNotifications(times);
            }
        } catch (error) {
            console.error("❌ Failed to save and schedule prayer notifications", err);
        } finally {
            setLoading(false);
        }
    }

    // Change theme
    async function changeTheme(value) {
        setLoading(true);
        try {
            const newSettings = { ...settings, theme: value };
            setSettings(newSettings);
            await saveSettings(newSettings);
            // Update context
            setContextTheme(value);
        } catch (err) {
            console.error("Theme change error:", err);
            Alert.alert("Error", "Failed to update theme setting.");
        } finally {
            setLoading(false);
        }
    }

    // Change language
    async function changeLanguage(value) {
        setLoading(true);
        try {
            // Update context
            setContextLanguage(value);

            const newSettings = { ...settings, language: value };
            // Update settings and reschedule notifications if enabled
            await updateAndSchedule(newSettings);
        } catch (error) {
            console.error("Language change error:", err);
            Alert.alert("Error", "Failed to update language setting.");
        } finally {
            setLoading(false);
        }
    }

    // Set or update location and Reschedule notifications
    async function resetLocation() {
        setLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Location denied", "Prayer times will not be location-based.");
                return;
            }

            // Get current position with high accuracy
            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
            });

            const newSettings = { ...settings, coords: loc.coords };
            // Update settings and reschedule notifications if enabled
            await updateAndSchedule(newSettings);
        } catch (err) {
            console.error("Location error:", err);
            Alert.alert("Error", "Failed to get location.");
        } finally {
            setLoading(false);
        }
    }

    // Toggle notifications
    async function toggleNotifications(value) {
        setLoading(true);
        try {
            let finalValue = value;

            if (value) {
                // 1️⃣ Check current status
                const { status } = await Notifications.getPermissionsAsync();

                if (status !== "granted") {
                    // 2️⃣ Request permission (shows modal only first time)
                    const { status: newStatus } = await Notifications.requestPermissionsAsync();
                    if (newStatus !== "granted") {
                        // 3️⃣ Denied → open system settings
                        Alert.alert(
                            "Notifications Disabled",
                            "To receive prayer reminders, please enable notifications in system settings.",
                            [
                                { text: "Cancel", style: "cancel" },
                                { text: "Open Settings", onPress: () => Linking.openSettings() },
                            ]
                        );
                        finalValue = false; // force disable
                    }
                }
                // 4️⃣ If granted and location available, schedule notifications
                if (finalValue && settings.coords) {
                    const times = await fetchPrayerTimes(settings.coords.latitude, settings.coords.longitude);
                    if (times) await schedulePrayerNotifications(times);
                }
            } else {
                // User turned off notifications → cancel all scheduled prayer notifications
                await cancelPrayerNotifications();
            }

            // 5️⃣ Save settings
            const newSettings = { ...settings, notifications: finalValue };
            await saveSettings(newSettings);
            setSettings(newSettings);

        } catch (err) {
            console.error("Notification toggle error:", err);
            Alert.alert("Error", "Failed to update notifications setting.");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
            <View style={{ flex: 1, padding: 16 }}>

                {/* Theme */}
                <View style={{ borderRadius: 5, marginTop: 16, padding: 8, backgroundColor: theme.card }}>
                    <Text style={{ fontSize: 20, marginBottom: 12, color: theme.primaryText }}>{lang("labels.theme")}</Text>
                    <Picker
                        selectedValue={settings.theme || currentTheme}
                        onValueChange={(value) => changeTheme(value)}
                        dropdownIconColor={theme.primaryText}
                        dropdownIconRippleColor={theme.primaryText}
                        style={{ width: '100%', backgroundColor: theme.background, color: theme.primaryText }}
                    >
                        <Picker.Item label="Dark" value="dark" />
                        <Picker.Item label="Light" value="light" />
                        <Picker.Item label="System" value="system" />
                    </Picker>
                </View>

                {/* Language */}
                <View style={{ borderRadius: 5, marginTop: 16, padding: 8, backgroundColor: theme.card }}>
                    <Text style={{ fontSize: 20, marginBottom: 12, color: theme.primaryText }}>{lang("labels.language")}</Text>
                    <Picker
                        selectedValue={settings.language || currentLang}
                        onValueChange={(value) => changeLanguage(value)}
                        dropdownIconColor={theme.primaryText}
                        dropdownIconRippleColor={theme.primaryText}
                        style={{ width: '100%', backgroundColor: theme.background, color: theme.primaryText }}
                    >
                        <Picker.Item label="English" value="en" />
                        <Picker.Item label="Shqip" value="sq" />
                        <Picker.Item label="Deutsch" value="de" />
                    </Picker>
                </View>

                {/* Location */}
                <View style={{ borderRadius: 5, marginVertical: 12, padding: 8, backgroundColor: theme.card }}>
                    <Text style={{ fontSize: 20, marginBottom: 12, color: theme.primaryText }}>{lang("labels.location")}</Text>
                    <Button
                        title={settings.coords ? lang("labels.locationButtonText1") : lang("labels.locationButtonText2")}
                        onPress={resetLocation}
                    />

                    {/* human-readable Address */}
                    {settings.coords && (
                        <Text style={{ marginVertical: 8, color: theme.primaryText }}>
                            {address ? address : lang("labels.loading")}
                        </Text>
                    )}
                </View>

                {/* Notifications */}
                <View style={{ borderRadius: 5, flexDirection: "row", alignItems: "center", width: '100%', justifyContent: 'space-between', backgroundColor: theme.card, padding: 8 }}>
                    <Text style={{ fontSize: 20, marginRight: 12, color: theme.primaryText }}>{lang("labels.notifications")}</Text>
                    <Switch
                        value={settings.notifications}
                        onValueChange={(value) => toggleNotifications(value)}
                    />
                </View>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({});
