import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { loadSettings, saveSettings } from "@/hooks/storage";
import usePrayerNotifications from "@/hooks/usePrayerNotifications";
import usePrayerService from "@/hooks/usePrayerService";
import { Picker } from "@react-native-picker/picker";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Button, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Settings() {
    // ThemeContext
    const { theme, currentTheme, changeTheme } = useTheme();
    // LanguageContext
    const { lang, currentLang, changeLanguage } = useLanguage();
    const { schedulePrayerNotifications, cancelPrayerNotifications } = usePrayerNotifications();

    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({});
    const [address, setAddress] = useState(null);
    const [selectedLanguage, setSelectedLanguage] = useState(lang.current);

    useEffect(() => {
        (async () => {
            const saved = await loadSettings();
            if (saved) setSettings(saved);
            setLoading(false);
        })();
    }, []);

    // Prayer times hook for prayer times
    const { prayerTimes } = usePrayerService(settings.coords?.latitude, settings.coords?.longitude);

    // Important: handleLanguage updates the LanguageContext asynchronously.
    // Because of React timing, this effect ensures notifications are scheduled
    // only after the context language has actually changed, so they always use the latest translated text.
    useEffect(() => {
        if (settings.notifications && settings.coords) {
            if (prayerTimes) {
                schedulePrayerNotifications(prayerTimes);
                console.log("🔔 Notifications schedule after Language change → to:", currentLang);
            }
        }
    }, [currentLang]);

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

    // Set or update location and reschedule notifications
    async function resetLocation() {
        setLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Location denied", "Prayer times will not be location-based.");
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
                Alert.alert("Error", "Failed to get location. Please try again.");
                return;
            }

            // Save settings
            const newSettings = { ...settings, coords: loc.coords };
            await saveSettings(newSettings);
            setSettings(newSettings);

            // Reschedule notifications if enabled
            if (newSettings.notifications && newSettings.coords) {
                if (prayerTimes) {
                    schedulePrayerNotifications(prayerTimes);
                    console.log("🔔 Notifications scheduled after Location reset");
                }
            }
        } catch (err) {
            console.error("Location error:", err);
            Alert.alert("Error", "Failed to get location.");
        } finally {
            setLoading(false);
        }
    }

    // New: Change language
    async function handleLanguage(value) {
        setLoading(true);
        try {
            setSelectedLanguage(value);
            // Update LanguageContext
            changeLanguage(value);
        } catch (error) {
            console.error("Language change error:", error);
            Alert.alert("Error", "Failed to update language setting.");
        } finally {
            setLoading(false);
        }
    }

    // Change theme
    async function handleTheme(value) {
        setLoading(true);
        try {
            // Update context
            changeTheme(value);

            const newSettings = { ...settings, theme: value };
            setSettings(newSettings);
            await saveSettings(newSettings);
        } catch (err) {
            console.error("Theme change error:", err);
            Alert.alert("Error", "Failed to update theme setting.");
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
                    console.log("🔔 Notifications schedule after Notifications enabled");
                }
            } else {
                // User turned off notifications → cancel all scheduled prayer notifications
                await cancelPrayerNotifications();
                console.log("🟧 All existing prayer notifications cancelled");
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
                <Text style={{ color: "#a78d8dff", fontSize: 20, marginVertical: 12 }}>Please Wait</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
            <View style={{ flex: 1, padding: 16 }}>

                {/* Theme */}
                <View style={{ borderRadius: 5, marginTop: 16, padding: 8, backgroundColor: theme.card }}>
                    <Text style={{ fontSize: 20, marginBottom: 12, color: theme.primaryText }}>{lang.tr("labels.theme")}</Text>
                    <Picker
                        selectedValue={settings.theme || currentTheme}
                        onValueChange={(value) => handleTheme(value)}
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
                    <Text style={{ fontSize: 20, marginBottom: 12, color: theme.primaryText }}>{lang.tr("labels.language")}</Text>
                    <Picker
                        selectedValue={selectedLanguage || currentLang}
                        onValueChange={(value) => handleLanguage(value)}
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
                    <Text style={{ fontSize: 20, marginBottom: 12, color: theme.primaryText }}>{lang.tr("labels.location")}</Text>
                    <Button
                        title={settings.coords ? lang.tr("labels.locationButtonText1") : lang.tr("labels.locationButtonText2")}
                        onPress={resetLocation}
                    />

                    {/* human-readable Address */}
                    {settings.coords && (
                        <Text style={{ marginVertical: 8, color: theme.primaryText }}>
                            {address ? address : lang.tr("labels.loading")}
                        </Text>
                    )}
                </View>

                {/* Notifications */}
                <View style={{ borderRadius: 5, flexDirection: "row", alignItems: "center", width: '100%', justifyContent: 'space-between', backgroundColor: theme.card, padding: 8 }}>
                    <Text style={{ fontSize: 20, marginRight: 12, color: theme.primaryText }}>{lang.tr("labels.notifications")}</Text>
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
