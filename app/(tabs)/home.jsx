import { scheduleDailyPrayerNotifications } from "@/utils/notifications";
import { useIsFocused } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchPrayerTimes } from "../../utils/api";
import { initLanguage, lang } from "../../utils/language";
import { loadSettings } from "../../utils/storage";

const PRAYER_ORDER = ["Imsak", "Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

export default function Home() {
    const isFocused = useIsFocused();
    const [settings, setSettings] = useState(null);
    const [warning, setWarning] = useState(null);
    const [prayerTimes, setPrayerTimes] = useState(null);
    const [nextPrayer, setNextPrayer] = useState(null);
    const [nextPrayerTime, setNextPrayerTime] = useState(null);
    const [countdown, setCountdown] = useState("");

    // On mount: load settings, fetch prayer times, schedule notifications, start interval to update next prayer
    useEffect(() => {
        let interval;

        (async () => {
            // ensure translation uses saved language
            await initLanguage();

            const saved = await loadSettings();
            if (!saved) return;
            setSettings(saved);

            // fetch prayer times and schedule notifications (if coords exist)
            if (saved.coords) {
                try {
                    const times = await fetchPrayerTimes(saved.coords.latitude, saved.coords.longitude);

                    // Filter and keep only the prayers in the fixed order
                    const filtered = {};
                    PRAYER_ORDER.forEach((key) => {
                        if (times[key]) filtered[key] = times[key];
                    });
                    setPrayerTimes(filtered);

                    // schedule notifications (util cancels old prayer notifs first)
                    if (saved.notifications) {
                        await scheduleDailyPrayerNotifications(filtered);
                    }

                    // Set the first update immediately
                    updateNextPrayer(filtered);

                    // Then start interval
                    interval = setInterval(() => updateNextPrayer(filtered), 1000);
                } catch (error) {
                    console.error("Failed fetching prayer times:", err);
                }
            }
        })();

        // cleanup on unmount
        return () => clearInterval(interval);
    }, []);

    // On focus: reload settings to update warnings
    useEffect(() => {
        (async () => {
            const saved = await loadSettings();
            if (!saved) return;
            setSettings(saved);

            // set warning based on explicit boolean values
            if (!saved?.coords && !saved?.notifications) {
                setWarning("Location and notifications are disabled. Prayer times are not location-based and no notifications will be sent.");
            } else if (!saved?.coords) {
                setWarning("Location is disabled. Prayer times are not location-based.");
            } else if (!saved?.notifications) {
                setWarning("Notifications are disabled. You won't receive prayer reminders.");
            } else {
                setWarning(null);
            }
        })();
    }, [isFocused]);

    // Update next prayer and countdown
    function updateNextPrayer(times) {
        if (!times) return;

        const now = new Date();
        let upcomingTime = nextPrayerTime; // local copy for countdown

        // Only recalc nextPrayer if it's null or has passed
        if (!nextPrayerTime || nextPrayerTime <= now) {
            let upcoming = null;

            Object.entries(times).forEach(([name, time]) => {
                const [hour, minute] = time.split(":").map((x) => parseInt(x, 10));
                const prayerDate = new Date();
                prayerDate.setHours(hour, minute, 0, 0);

                if (prayerDate > now && !upcoming) {
                    upcoming = { name, time: prayerDate };
                }
            });

            if (!upcoming) {
                // No more prayers today → use tomorrow's Fajr
                const fajrTime = times["Fajr"];
                if (fajrTime) {
                    const [hour, minute] = fajrTime.split(":").map(x => parseInt(x, 10));
                    const tomorrowFajr = new Date();
                    tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
                    tomorrowFajr.setHours(hour, minute, 0, 0);
                    upcoming = { name: "Fajr", time: tomorrowFajr };
                }
            }

            if (upcoming) {
                setNextPrayer(upcoming.name);         // update text only when prayer changes
                setNextPrayerTime(upcoming.time);     // update state
                upcomingTime = upcoming.time;         // use for countdown immediately
            } else {
                setNextPrayer(null);
                setNextPrayerTime(null);
                upcomingTime = null;
            }
        }

        // Update countdown using local variable, not state
        if (upcomingTime) {
            const diff = upcomingTime - now;
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setCountdown(`${hours}h ${minutes}m ${seconds}s`);
        } else {
            // setCountdown("");
            setCountdown("No more prayers today");
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.inner}>

                {/* Warnings box */}
                {warning && (
                    <View style={styles.warningBox}>
                        <Text style={styles.warningText}>{warning}</Text>
                    </View>
                )}

                {/* Current date */}
                <Text style={styles.date}>{new Date().toDateString()}</Text>

                {/* Next prayer countdown */}
                {nextPrayer && (
                    <Text style={styles.countdown}>
                        {countdown} » {nextPrayer ? lang(`prayers.${nextPrayer}`) : ""}
                    </Text>
                )}

                {/* Prayer times list */}
                {prayerTimes ? (
                    <FlatList
                        contentContainerStyle={{ padding: 20 }}
                        data={Object.entries(prayerTimes)}
                        keyExtractor={([name]) => name}
                        renderItem={({ item: [name, time] }) => (
                            <View style={styles.row}>
                                <Text style={styles.prayer}>{lang(`prayers.${name}`)}</Text>
                                <Text style={styles.time}>{time}</Text>
                            </View>
                        )}
                    />
                ) : (
                    <Text>{lang("labels.loading")}</Text>
                )}

                {/* <Button title="Log Scheduled Notifications" onPress={listScheduledNotifications} /> */}

                {/* <View style={{ padding: 20, marginTop: 20, backgroundColor: "#fdecea", borderWidth: 1, borderColor: "#f5c2c7", borderRadius: 4 }}>
                    <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 12 }}>Testing Notifications</Text>
                    <Button title="Send Test Notification" onPress={sendTestNotification} />
                </View> */}

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    inner: {
        flex: 1,
        padding: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    date: {
        fontSize: 18,
        color: "#000",
        marginTop: 100,
        marginBottom: 38,
    },
    countdown: {
        fontSize: 26,
        fontWeight: "500",
        color: "#4D3C3C",
        marginBottom: 30,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: "#333",
    },
    prayer: {
        fontSize: 18,
        color: "#000",
    },
    time: {
        fontSize: 18,
        fontWeight: "500",
        color: "#000",
    },
    warningBox: {
        padding: 8,
        backgroundColor: "#fdecea",
        borderWidth: 1,
        borderColor: "#f5c2c7",
        borderRadius: 4
    },
    warningText: {
        color: "#856404",
        textAlign: "center",
        fontWeight: "500",
    },
});