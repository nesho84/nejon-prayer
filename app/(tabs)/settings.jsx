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
    const { scheduleDailyPrayerNotifications } = usePrayerNotifications();

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
    async function saveAndSchedule(newSettings) {
        setLoading(true);
        try {
            setSettings(newSettings);
            await saveSettings(newSettings);

            // If notifications and location enabled, re-schedule notifications
            if (newSettings.notifications && newSettings.coords) {
                const times = await fetchPrayerTimes(newSettings.coords.latitude, newSettings.coords.longitude);
                if (!times) {
                    console.log("Failed to fetch prayer times or no data returned");
                    return;
                }
                await scheduleDailyPrayerNotifications(times);
            }
        } catch (error) {
            console.error("❌ Failed to save and schedule prayer notifications", err);
        } finally {
            setLoading(false);
        }
    }

    // Change language
    async function changeLanguage(value) {
        setLoading(true);
        try {
            const newSettings = { ...settings, language: value };
            setSettings(newSettings);
            await saveSettings(newSettings);
            // Update context
            setContextLanguage(value);
        } catch (error) {
            console.error("Language change error:", err);
            Alert.alert("Error", "Failed to update language setting.");
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

    // Set or update location and Reschedule notifications
    async function resetLocation() {
        setLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== "granted") {
                Alert.alert("Location denied", "Prayer times will not be location-based.");
                return;
            }
            const loc = await Location.getCurrentPositionAsync({});
            const newSettings = { ...settings, coords: loc.coords };
            await saveAndSchedule(newSettings);
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
            if (value) {
                // User wants to enable notifications → check/request permission
                const { status } = await Notifications.requestPermissionsAsync();
                if (status !== "granted") {
                    Alert.alert("Notifications denied", "You won't receive prayer reminders.");
                    value = false; // force disable in settings
                }
            }
            // Save the actual state (granted or false)
            const newSettings = { ...settings, notifications: value };
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
