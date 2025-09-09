import { useLanguage } from "@/context/LanguageContext";
import { Picker } from "@react-native-picker/picker";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Button, Platform, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { loadSettings, saveSettings } from "../utils/storage";

export default function Start() {
  const router = useRouter();
  // LanguageContext
  const { setContextLanguage, lang } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [language, setLanguage] = useState("en");
  const [coords, setCoords] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Check if settings exist on first load
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

  // Change language
  async function changeLanguage(value) {
    setLoading(true);
    try {
      setLanguage(value);
      // Update context
      setContextLanguage(value);
    } catch (error) {
      console.error("Language change error:", err);
      Alert.alert("Error", "Failed to language setting.");
    } finally {
      setLoading(false);
    }
  }

  // Request location permission
  async function requestLocation() {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location required",
          "You can skip, but prayer times will not be location-based."
        );
        setStep(3);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setCoords(loc.coords);
      setStep(3);
    } catch (err) {
      console.error("Location error:", err);
      Alert.alert("Error", "Failed to get location.");
    } finally {
      setLoading(false);
    }
  }

  // Request notification permission
  async function requestNotifications() {
    setLoading(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === "granted";
      setNotificationsEnabled(granted);

      // Pass coords directly to finishOnboarding
      await finishOnboarding(granted, coords);
    } catch (err) {
      console.error("Notification error:", err);
      Alert.alert("Error", "Failed to request notifications.");
    } finally {
      setLoading(false);
    }
  }

  // Save settings and redirect to home
  async function finishOnboarding(notifications, userCoords) {
    const prefs = { language, coords: userCoords, notifications };
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
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 16 }}>

        {/* Step 1: Language */}
        {step === 1 && (
          <>
            <Text style={{ color: "#a78d8dff", fontSize: 20, marginBottom: 12 }}>Select Language</Text>
            {Platform.OS === "android" ? (
              <Picker
                selectedValue={language}
                onValueChange={(value) => changeLanguage(value)}
                style={{ width: '100%', backgroundColor: '#cccccc', color: '#000' }}
              >
                <Picker.Item label="English" value="en" />
                <Picker.Item label="Shqip" value="sq" />
                <Picker.Item label="Deutsch" value="de" />
              </Picker>
            ) : (
              <View style={{ width: '100%', marginVertical: 12 }}>
                <Button title={`Language: ${language}`} onPress={() => Alert.alert("iOS", "Implement picker for iOS")} />
              </View>
            )}
            <View style={{ width: '100%', marginVertical: 12 }}>
              <Button title="Next" onPress={() => setStep(2)} />
            </View>
          </>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <>
            <Text style={{ color: "#a78d8dff", fontSize: 20, marginBottom: 12 }}>Location Access</Text>
            <Button title="Allow Location" onPress={requestLocation} />
          </>
        )}

        {/* Step 3: Notifications */}
        {step === 3 && (
          <>
            <Text style={{ color: "#a78d8dff", fontSize: 20, marginBottom: 12 }}>Notifications Access</Text>
            <View style={{ marginBottom: 12 }}>
              <Button title="Allow Notifications" onPress={requestNotifications} />
            </View>
            <Button title="Skip" color="red" onPress={() => finishOnboarding(false, coords)} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
