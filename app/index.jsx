import { useEffect, useRef, useState } from "react";
import { Alert, Button, Platform, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useSettingsContext } from "@/contexts/SettingsContext";
import notifee, { AuthorizationStatus } from "@notifee/react-native";
import { formatAddress, formatTimezone } from "@/utils/geoInfo";
import LoadingScreen from "@/components/LoadingScreen";

export default function OnboardingScreen() {
  const router = useRouter();
  const { appSettings, settingsLoading, saveAppSettings } = useSettingsContext();

  const [localLoading, setLocalLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Refs for onboarding data
  const languageRef = useRef("en");
  const locationRef = useRef(null);
  const prayerTimesRef = useRef(null);
  const fullAddressRef = useRef(null);
  const timeZoneRef = useRef(null);

  // -----------------------------------------------------------------
  // Onboarding check: Redirect once settings are loaded
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!settingsLoading && !localLoading && appSettings?.onboarding) {
      // Show HomeScreen (if already onboarded)
      router.replace("/(tabs)/home");
    }
  }, [settingsLoading, appSettings?.onboarding]);

  // If still loading settings
  if (settingsLoading) {
    return <LoadingScreen message="Loading settings..." />;
  }
  // Redirecting...
  if (appSettings?.onboarding) {
    return <LoadingScreen message="Redirecting..." />;
  }
  // Show local loading
  if (localLoading) {
    return <LoadingScreen message="Please Wait..." />;
  }

  // ----------------------------
  // 1️⃣ (Step 1) Handle language
  // ----------------------------
  async function handleLanguage() {
    setLocalLoading(true);
    try {
      // Update languageRef: updated in the dropdown-picker
      setStep(2);
    } catch (err) {
      console.error("Language change error:", err);
      Alert.alert("Error", "Failed to save language setting.");
    } finally {
      setLocalLoading(false);
    }
  }

  // ----------------------------------------
  // 2️⃣ (Step 2) Request location permission
  // ----------------------------------------
  async function requestLocation() {
    setLocalLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location needed",
          "You can skip for now, but prayer times won't load until you allow location access. You can update it later in Settings."
        );
        setStep(3);
        return;
      }
      // Try high accuracy first, fallback to balanced
      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        timeout: 5000,
      }).catch(() =>
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 10000,
        })
      );
      if (!loc?.coords) {
        Alert.alert("Error", "Failed to request location. Please try again.");
        return;
      }

      // Update Refs
      locationRef.current = loc.coords;
      fullAddressRef.current = await formatAddress(loc.coords);
      timeZoneRef.current = await formatTimezone(loc.coords);

      setStep(3);
    } catch (err) {
      console.error("❌ Location access error:", err);
      Alert.alert("Error", "Failed to get location. Please try again.");
    } finally {
      setLocalLoading(false);
    }
  }

  // --------------------------------------------
  // 3️⃣ (Step 3) Request notification permission
  // --------------------------------------------
  async function requestNotifications() {
    setLocalLoading(true);
    try {
      const settings = await notifee.requestPermission();
      if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
        Alert.alert(
          "Notifications needed",
          "You can skip for now, but you won’t receive prayer time reminders until you allow notifications. You can enable them later in Settings."
        );
        await finishOnboarding();
        return;
      }

      // Finish Onboarding (final step)
      await finishOnboarding();
    } catch (err) {
      console.error("❌ Notification access error:", err);
      Alert.alert("Error", "Failed to request notifications. Please try again.");
    } finally {
      setLocalLoading(false);
    }
  }

  // ----------------------------------------------------------------------------
  // 🏁 (Finish) Update SettingsContext and redirect to HomeScreen
  // ----------------------------------------------------------------------------
  async function finishOnboarding() {
    setLocalLoading(true);
    try {
      // Update SettingsContext
      await saveAppSettings({
        onboarding: true,
        language: languageRef.current,
        location: locationRef.current,
        fullAddress: fullAddressRef.current,
        timeZone: timeZoneRef.current
      });

      // Redirect to HomeScreen
      router.replace("/(tabs)/home");
    } catch (err) {
      console.error("❌ Onboarding error:", err);
      Alert.alert("Error", "Failed to finish onboarding. Please try again.");
    } finally {
      setLocalLoading(false);
    }
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
                selectedValue={languageRef.current}
                onValueChange={(value) => languageRef.current = value}
                dropdownIconColor={'#000'}
                dropdownIconRippleColor={'#000'}
                style={{ width: '100%', backgroundColor: '#cccccc', color: '#000' }}
              >
                <Picker.Item label="English" value="en" />
                <Picker.Item label="Shqip" value="sq" />
                <Picker.Item label="Deutsch" value="de" />
              </Picker>
            ) : (
              <View style={{ width: '100%', marginVertical: 12 }}>
                <Button title={`Language: ${languageRef.current}`} onPress={() => Alert.alert("iOS", "Implement picker for iOS")} />
              </View>
            )}
            <View style={{ width: '100%', marginVertical: 12 }}>
              <Button title="Next" onPress={handleLanguage} />
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
            <Button title="Skip" color="red" onPress={finishOnboarding} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
