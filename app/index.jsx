import { useEffect, useRef, useState } from "react";
import { Alert, Button, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { Picker } from "@react-native-picker/picker";
import { useThemeContext } from "@/contexts/ThemeContext";
import { useSettingsContext } from "@/contexts/SettingsContext";
import notifee, { AuthorizationStatus } from "@notifee/react-native";
import { formatAddress, formatTimezone } from "@/utils/geoInfo";
import { Ionicons } from "@expo/vector-icons";
import LoadingScreen from "@/components/LoadingScreen";

export default function OnboardingScreen() {
  const router = useRouter();
  const { theme } = useThemeContext();
  const { appSettings, settingsLoading, saveAppSettings } = useSettingsContext();

  const [localLoading, setLocalLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Refs for onboarding data
  const languageRef = useRef("en");
  const locationRef = useRef(null);
  const prayerTimesRef = useRef(null); // this will be saved in PrayersContext and storage
  const fullAddressRef = useRef(null);
  const timeZoneRef = useRef(null);

  // -----------------------------------------------------------------
  // Onboarding check: Redirect once settings are loaded
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!settingsLoading && !localLoading && appSettings?.onboarding) {
      // Show HomeScreen (if already onboarded)
      router.replace("/(tabs)/HomeScreen");
    }
  }, [settingsLoading, appSettings?.onboarding]);

  // If still loading settings
  if (settingsLoading) {
    return <LoadingScreen message="Loading settings..." style={{ backgroundColor: theme.bg }} />;
  }
  // Redirecting...
  if (appSettings?.onboarding) {
    return <LoadingScreen message="Redirecting..." style={{ backgroundColor: theme.bg }} />;
  }
  // Show local loading
  if (localLoading) {
    return <LoadingScreen message="Please Wait..." style={{ backgroundColor: theme.bg }} />;
  }

  // ----------------------------
  // 1️⃣ (Step 1) Handle language
  // ----------------------------
  async function handleLanguage() {
    setLocalLoading(true);
    try {
      // Update languageRef: updated in picker->onValueChange
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
          "Notifications Needed",
          "Prayer time reminders will not be delivered until notifications are enabled. You may skip for now and activate them later in Settings."
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
        timeZone: timeZoneRef.current,
      });

      // @TODO: this will be saved in PrayersContext and storage, not in appSettings!
      // prayerTimes: prayerTimesRef.current

      // Redirect to HomeScreen
      router.replace("/(tabs)/HomeScreen");
    } catch (err) {
      console.error("❌ Onboarding error:", err);
      Alert.alert("Error", "Failed to finish onboarding. Please try again.");
    } finally {
      setLocalLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.content}>

        {/* Step 1: Language */}
        {step === 1 && (
          <>
            <View style={styles.banner}>
              <Ionicons name="language" size={80} color={theme.primary} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Choose Your Language</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Select your preferred language to continue
            </Text>
            <View style={styles.inputArea}>
              {Platform.OS === "android" ? (
                <Picker
                  selectedValue={languageRef.current}
                  onValueChange={(value) => (languageRef.current = value)}
                  dropdownIconColor={theme.text}
                  style={{ color: theme.text }}
                >
                  <Picker.Item label="English" value="en" />
                  <Picker.Item label="Shqip" value="sq" />
                  <Picker.Item label="Deutsch" value="de" />
                </Picker>
              ) : (
                <TouchableOpacity
                  style={[styles.pickerButton, { backgroundColor: theme.card }]}
                  onPress={() => Alert.alert("iOS", "Implement picker for iOS")}
                >
                  <Text style={{ color: theme.text }}>Language: {languageRef.current}</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={handleLanguage}
            >
              <Text style={[styles.buttonText, { color: theme.white }]}>Next</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <>
            <View style={styles.banner}>
              <Ionicons name="location-outline" size={80} color={theme.primary} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Enable Location</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Enable location to get accurate prayer times for your area.
            </Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={requestLocation}
            >
              <Text style={[styles.buttonText, { color: theme.white }]}>Allow Location</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Step 3: Notifications */}
        {step === 3 && (
          <>
            <View style={styles.banner}>
              <Ionicons name="alarm-outline" size={80} color={theme.primary} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Stay Updated</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Allow notifications to stay on track with your daily prayers.
            </Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={requestNotifications}
            >
              <Text style={[styles.buttonText, { color: theme.white }]}>Allow Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.danger }]}
              onPress={finishOnboarding}
            >
              <Text style={[styles.buttonText, { color: theme.white }]}>Skip</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: step === i ? theme.primary : theme.divider },
              ]}
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  banner: {
    marginBottom: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 32,
  },
  inputArea: {
    width: "100%",
    marginBottom: 24,
  },
  pickerButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  stepIndicator: {
    flexDirection: "row",
    marginTop: 24,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
