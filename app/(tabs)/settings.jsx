import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { Button, Platform, Switch, Text, View } from "react-native";
import { loadSettings, saveSettings } from "../../utils/storage";

export default function Settings() {
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        (async () => {
            const s = await loadSettings();
            setSettings(s);
        })();
    }, []);

    if (!settings) return <Text>Loading...</Text>;

    function toggleNotifications() {
        setSettings({ ...settings, notifications: !settings.notifications });
    }

    async function saveAndBack() {
        await saveSettings(settings);
        alert("Settings saved");
    }

    return (
        <View style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontSize: 20, marginBottom: 12 }}>Settings</Text>

            {/* Notifications toggle */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <Text style={{ flex: 1 }}>Notifications</Text>
                <Switch value={settings.notifications} onValueChange={toggleNotifications} />
            </View>

            {/* Language selector */}
            <Text style={{ marginTop: 12, marginBottom: 6 }}>Language</Text>
            {Platform.OS === "android" ? (
                <Picker
                    selectedValue={settings.language}
                    onValueChange={(lang) => setSettings({ ...settings, language: lang })}
                    style={{ width: 200, color: "#000" }}
                >
                    <Picker.Item label="English" value="en" />
                    <Picker.Item label="Arabic" value="ar" />
                    <Picker.Item label="Turkish" value="tr" />
                    <Picker.Item label="Shqip" value="sq" />
                </Picker>
            ) : (
                <Button
                    title={`Language: ${settings.language}`}
                    onPress={() => alert("Implement picker for iOS")}
                />
            )}

            <Button title="Save" onPress={saveAndBack} style={{ marginTop: 20 }} />
        </View>
    );
}
