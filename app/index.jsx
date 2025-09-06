import { Picker } from "@react-native-picker/picker"; // install separately
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Button, Platform, Text, View } from "react-native";
import { loadSettings, saveSettings } from "../utils/storage";

export default function Start() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [language, setLanguage] = useState("en");
  const [coords, setCoords] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await loadSettings();
      if (saved) {
        router.replace("/home");
      } else {
        setLoading(false);
      }
    })();
  }, []);

  async function requestLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Location required", "You can skip, but prayer times will not be location-based.");
      setStep(3);
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setCoords(loc.coords);
    setStep(3);
  }

  async function requestNotifications() {
    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === "granted";
    setNotificationsEnabled(granted);
    finishOnboarding(granted);
  }

  async function finishOnboarding(notifications) {
    const prefs = { language, coords, notifications };
    await saveSettings(prefs);
    router.replace("/home");
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 16 }}>
      {step === 1 && (
        <>
          <Text style={{ fontSize: 20, marginBottom: 12 }}>Select Language</Text>
          {Platform.OS === "android" ? (
            <Picker selectedValue={language} onValueChange={setLanguage} style={{ width: 200, color: "#000" }}>
              <Picker.Item label="English" value="en" />
              <Picker.Item label="Arabic" value="ar" />
              <Picker.Item label="Turkish" value="tr" />
              <Picker.Item label="Shqip" value="sq" />
            </Picker>
          ) : (
            <Button title={`Language: ${language}`} onPress={() => Alert.alert("iOS", "Implement picker for iOS")} />
          )}
          <Button title="Next" onPress={() => setStep(2)} />
        </>
      )}

      {step === 2 && (
        <>
          <Text style={{ fontSize: 20, marginBottom: 12 }}>Location Access</Text>
          <Button title="Allow Location" onPress={requestLocation} />
        </>
      )}

      {step === 3 && (
        <>
          <Text style={{ fontSize: 20, marginBottom: 12 }}>Notifications Access</Text>
          <Button title="Allow Notifications" onPress={requestNotifications} />
          <Button title="Skip" onPress={finishOnboarding} />
        </>
      )}
    </View>
  );
}
