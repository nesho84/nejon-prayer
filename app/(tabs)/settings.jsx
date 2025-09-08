import { useLanguage } from "@/context/LanguageContext";
import useTheme from "@/hooks/useTheme";
import { Picker } from "@react-native-picker/picker";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Button, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchPrayerTimes } from "../../utils/api";
import { scheduleDailyPrayerNotifications } from "../../utils/notifications";
import { loadSettings, saveSettings } from "../../utils/storage";

export default function Settings() {
    const { theme } = useTheme();
    // LanguageContext
    const { setContextLanguage, lang } = useLanguage();

    const [settings, setSettings] = useState({ language: "en", coords: null, notifications: false });
    const [address, setAddress] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const saved = await loadSettings();
            if (saved) setSettings(saved);
            setLoading(false);
        })();
    }, []);

    // Reverse geocode to get human-readable address
    useEffect(() => {
        if (!settings.coords) {
            setAddress(null);
            return;
        }

        (async () => {
            try {
                const [loc] = await Location.reverseGeocodeAsync({
                    latitude: settings.coords.latitude,
                    longitude: settings.coords.longitude,
                });

                if (loc) {
                    // Build a full readable address
                    const fullAddress = [
                        loc.street,       // street name
                        loc.name,         // e.g., building / house number
                        loc.postalCode,   // postal code
                        loc.city,         // city
                        // loc.region,       // state/region
                        loc.country       // country
                    ].filter(Boolean).join(", ");
                    setAddress(fullAddress);
                }
            } catch (err) {
                console.error("Reverse geocoding error:", err);
                setAddress(null);
            }
        })();
    }, [settings.coords]);

    // Save settings and re-schedule notifications if needed
    async function saveAndSchedule(newSettings) {
        setLoading(true);

        setSettings(newSettings);
        await saveSettings(newSettings);

        // If notifications and location enabled, re-schedule notifications
        if (newSettings.notifications && newSettings.coords) {
            const times = await fetchPrayerTimes(
                newSettings.coords.latitude,
                newSettings.coords.longitude
            );
            const PRAYER_ORDER = ["Imsak", "Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
            const filtered = {};
            PRAYER_ORDER.forEach((key) => {
                if (times[key]) filtered[key] = times[key];
            });
            await scheduleDailyPrayerNotifications(filtered);
        }
        setLoading(false);
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
            Alert.alert("Error", "Failed to language setting.");
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

                <View style={{ borderRadius: 5, marginTop: 16, padding: 8, backgroundColor: theme.card }}>
                    <Text style={{ fontSize: 20, marginBottom: 12, color: theme.primaryText }}>{lang("labels.language")}</Text>
                    <Picker
                        selectedValue={settings.language}
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

const styles = StyleSheet.create({

});
