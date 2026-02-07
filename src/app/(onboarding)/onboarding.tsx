import { useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppContext } from "@/context/AppContext";
import notifee, { AuthorizationStatus } from "@notifee/react-native";
import { getUserLocation } from "@/services/locationService";
import { Ionicons } from "@expo/vector-icons";
import AppLoading from "@/components/AppLoading";
import AppTabScreen from "@/components/AppTabScreen";
import CustomPicker from "@/components/CustomPicker";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useLanguageStore } from "@/store/languageStore";
import { Language, LANGUAGES } from "@/types/language.types";
import { useThemeStore } from "@/store/themeStore";

export default function OnboardingScreen() {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const setOnboarding = useOnboardingStore((state) => state.setOnboarding);
  const language = useLanguageStore((state) => state.language);
  const tr = useLanguageStore((state) => state.tr);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  // Contexts
  const {
    appSettings,
    isReady: settingsReady,
    isLoading: settingsLoading,
    saveAppSettings
  } = useAppContext();


  // Local state
  const [localLoading, setLocalLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Refs for onboarding data
  const languageRef = useRef(language); // @TODO: should be removed after refactor
  const locationRef = useRef(appSettings?.location);
  const fullAddressRef = useRef(appSettings?.fullAddress);
  const timeZoneRef = useRef(appSettings?.timeZone);

  // ------------------------------------------------------------
  // 1️⃣ (Step 1) Handle language
  // ------------------------------------------------------------
  async function handleLanguage(value?: string | number) {
    setLocalLoading(true);
    try {
      // If called with a language value (from picker), update language
      if (value && typeof value === 'string') {
        languageRef.current = value as Language;
        setLanguage(value as Language);
      } else {
        // If called from Next button, proceed to next step
        setStep(2);
      }
    } catch (err) {
      console.error("Language change error:", err);
      Alert.alert("Error", "Failed to save language setting.");
    } finally {
      setLocalLoading(false);
    }
  }

  // ------------------------------------------------------------
  // 2️⃣ (Step 2) Request location permission
  // ------------------------------------------------------------
  async function requestLocation() {
    setLocalLoading(true);
    try {
      const data = await getUserLocation(tr);

      if (!data) {
        console.log("📍 Location denied or unavailable, continuing anyway");
        setStep(3);
        return;
      }

      // Update Refs
      locationRef.current = data.location;
      fullAddressRef.current = data.fullAddress;
      timeZoneRef.current = data.timeZone;

      setStep(3);
    } catch (err) {
      console.error("❌ Location access error:", err);
      Alert.alert("Error", "Failed to get location. Please try again.");
    } finally {
      setLocalLoading(false);
    }
  }

  // ------------------------------------------------------------
  // 3️⃣ (Step 3) Request notification permission
  // ------------------------------------------------------------
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

  // ------------------------------------------------------------
  // 🏁 (Finish) Update AppContext and redirect to HomeScreen
  // ------------------------------------------------------------
  async function finishOnboarding() {
    setLocalLoading(true);
    try {
      // Update onboarding store
      setOnboarding(true);

      // Update AppContext
      await saveAppSettings({
        language: languageRef.current, // @TODO: should be removed after refactor
        location: locationRef.current,
        fullAddress: fullAddressRef.current,
        timeZone: timeZoneRef.current,
      });

      // Redirect to HomeScreen
      // Stack.Protected will auto-redirect to (tabs) when onboarding becomes true
    } catch (err) {
      console.error("❌ Onboarding error:", err);
      Alert.alert("Error", "Failed to finish onboarding. Please try again.");
    } finally {
      setLocalLoading(false);
    }
  }

  // Loadng state
  if (!settingsReady || settingsLoading || localLoading) {
    return <AppLoading />;
  }

  return (
    <AppTabScreen>
      <View style={[styles.content, { backgroundColor: theme.bg }]}>

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
              <CustomPicker
                style={{ color: theme.text }}
                items={LANGUAGES}
                selectedValue={language}
                onValueChange={handleLanguage}
                enabled={!localLoading}
                textColor={theme.text}
                selectedColor={theme.text}
                modalBackgroundColor={theme.card}
              />
            </View>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={() => handleLanguage()}
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
                styles.stepDot,
                { backgroundColor: step === i ? theme.primary : theme.divider },
              ]}
            />
          ))}
        </View>

      </View>
    </AppTabScreen>
  );
}

const styles = StyleSheet.create({
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
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
