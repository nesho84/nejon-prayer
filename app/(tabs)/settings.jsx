import { Picker } from "@react-native-picker/picker";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Button, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchPrayerTimes } from "../../utils/api";
import { scheduleDailyPrayerNotifications } from "../../utils/notifications";
import { loadSettings, saveSettings } from "../../utils/storage";

export default function Settings() {
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

    async function changeLanguage(value) {
        const newSettings = { ...settings, language: value };
        await saveAndSchedule(newSettings);
    }

    async function resetLocation() {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
            Alert.alert("Location denied", "Prayer times will not be location-based.");
            return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        const newSettings = { ...settings, coords: loc.coords };
        await saveAndSchedule(newSettings);
        setLoading(false);
    }

    async function clearLocation() {
        const newSettings = { ...settings, coords: null };
        await saveAndSchedule(newSettings);
    }

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
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flex: 1, padding: 16 }}>
                <Text style={{ fontSize: 20, marginBottom: 12 }}>Language</Text>
                <Picker
                    selectedValue={settings.language}
                    onValueChange={(value) => changeLanguage(value)}
                    dropdownIconColor={'#000'}
                    dropdownIconRippleColor={'#000'}
                    style={{ width: '100%', backgroundColor: '#fff', color: '#000' }}
                >
                    <Picker.Item label="English" value="en" />
                    <Picker.Item label="Arabic" value="ar" />
                    <Picker.Item label="Turkish" value="tr" />
                    <Picker.Item label="Shqip" value="sq" />
                </Picker>

                <View style={{ marginVertical: 12, backgroundColor: '#fff', padding: 8 }}>
                    <Text style={{ fontSize: 20, marginBottom: 12 }}>Location</Text>
                    <Button
                        title={settings.coords ? "Update Location" : "Set Location"}
                        onPress={resetLocation}
                    />

                    {/* human-readable Address */}
                    {settings.coords && (
                        <Text style={{ marginTop: 8, marginBottom: 16 }}>
                            {address ? address : "Loading address..."}
                        </Text>
                    )}

                    {settings.coords && (
                        <Button
                            title="Clear Location"
                            color="red"
                            onPress={clearLocation}
                        />
                    )}
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", width: '100%', justifyContent: 'space-between', backgroundColor: '#fff', padding: 8 }}>
                    <Text style={{ fontSize: 20, marginRight: 12 }}>Notifications</Text>
                    <Switch
                        value={settings.notifications}
                        onValueChange={(value) => toggleNotifications(value)}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}
