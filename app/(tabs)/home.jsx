import { useEffect, useState } from "react";
import { Button, FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchPrayerTimes } from "../../utils/api";
import { schedulePrayerNotifications, sendTestNotification } from "../../utils/notifications";
import { loadSettings } from "../../utils/storage";

export default function Dashboard() {
    const [settings, setSettings] = useState(null);
    const [prayerTimes, setPrayerTimes] = useState(null);
    const [warning, setWarning] = useState(null);

    useEffect(() => {
        (async () => {
            const saved = await loadSettings();
            if (!saved) return;
            setSettings(saved);

            if (!saved.coords && !saved.notifications) {
                setWarning(
                    "Location and notifications are disabled. Prayer times are not location-based and no notifications will be sent."
                );
            } else if (!saved.coords) {
                setWarning(
                    "Location is disabled. Prayer times are not location-based."
                );
            } else if (!saved.notifications) {
                setWarning(
                    "Notifications are disabled. You won't receive prayer reminders."
                );
            }

            // Fetch prayer times if coords exist
            if (saved.coords) {
                let times = await fetchPrayerTimes(
                    saved.coords.latitude,
                    saved.coords.longitude
                );
                const prayerNames = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
                const filtered = {};
                prayerNames.forEach((name) => {
                    if (times[name]) filtered[name] = times[name];
                });
                setPrayerTimes(filtered);

                // Schedule notifications only if enabled
                if (saved.notifications) {
                    schedulePrayerNotifications(filtered);
                }
            }
        })();
    }, []);

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flex: 1, padding: 16 }}>
                {warning ? (
                    <View
                        style={{
                            padding: 8,
                            marginBottom: 12,
                            backgroundColor: "#fdecea",
                            borderWidth: 1,
                            borderColor: "#f5c2c7",
                            borderRadius: 4,
                        }}
                    >
                        <Text style={{ color: "#b71c1c" }}>{warning}</Text>
                    </View>
                ) : null}

                <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>Prayer Times</Text>
                {prayerTimes ? (
                    <FlatList
                        data={Object.entries(prayerTimes)}
                        keyExtractor={([k]) => k}
                        renderItem={({ item: [name, time] }) => (
                            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
                                <Text>{name}</Text>
                                <Text>{time}</Text>
                            </View>
                        )}
                    />
                ) : (
                    <Text>Loading...</Text>
                )}

                <Text style={{ fontSize: 22, fontWeight: "700", marginVertical: 12 }}>Testing Notifications</Text>
                <Button title="Send Test Notification" onPress={sendTestNotification} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    warningBox: {
        backgroundColor: "#fff3cd",
        borderBottomWidth: 1,
        borderColor: "#ffeeba",
        padding: 10,
    },
    warningText: {
        color: "#856404",
        textAlign: "center",
        fontWeight: "500",
    },
});