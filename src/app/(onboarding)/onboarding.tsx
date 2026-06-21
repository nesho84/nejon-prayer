import AppLayout from "@/components/AppLayout";
import AppLoading from "@/components/AppLoading";
import CustomPicker from "@/components/CustomPicker";
import { globalStyles } from "@/constants/styles";
import { getUserLocation } from "@/services/locationService";
import { useDeviceSettingsStore } from "@/store/deviceSettingsStore";
import { useLanguageStore } from "@/store/languageStore";
import { useLocationStore } from "@/store/locationStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useThemeStore } from "@/store/themeStore";
import { Language, LANGUAGES } from "@/types/language.types";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Application from "expo-application";
import * as IntentLauncher from "expo-intent-launcher";
import { useRef, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import notifee, { AuthorizationStatus } from "react-native-notify-kit";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OnboardingScreen() {
  // Stores
  const setOnboarding = useOnboardingStore((state) => state.setOnboarding);
  const theme = useThemeStore((state) => state.theme);
  const language = useLanguageStore((state) => state.language);
  const tr = useLanguageStore((state) => state.tr);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const location = useLocationStore((state) => state.location);
  const fullAddress = useLocationStore((state) => state.fullAddress);
  const timeZone = useLocationStore((state) => state.timeZone);
  const setLocation = useLocationStore((state) => state.setLocation);
  const locationPermission = useDeviceSettingsStore((state) => state.locationPermission);
  const notificationPermission = useDeviceSettingsStore((state) => state.notificationPermission);
  const batteryOptimization = useDeviceSettingsStore((state) => state.batteryOptimization);
  const alarmPermission = useDeviceSettingsStore((state) => state.alarmPermission);

  // Local state
  const [localLoading, setLocalLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Refs for onboarding data
  const languageRef = useRef(language);
  const locationRef = useRef(location);
  const fullAddressRef = useRef(fullAddress);
  const timeZoneRef = useRef(timeZone);

  // Safe area insets
  const insets = useSafeAreaInsets();
  const topInset = insets.top + 4;
  const bottomInset = insets.bottom + 12;

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
      const newLocation = await getUserLocation(tr);

      if (!newLocation) {
        console.log("📍 Location access denied, continuing anyway");
        setStep(3);
        return;
      }

      // Update Refs
      locationRef.current = newLocation.location;
      fullAddressRef.current = newLocation.fullAddress;
      timeZoneRef.current = newLocation.timeZone;

      setStep(3);
    } catch (err) {
      console.error("❌ Location access error:", err);
      Alert.alert("Error", "Failed to get location. Please try again.");
    } finally {
      setLocalLoading(false);
    }
  }

  // ------------------------------------------------------------
  // 3️⃣ (Step 3A) Request notification permission
  // ------------------------------------------------------------
  async function requestNotifications() {
    if (notificationPermission) return; // already granted, nothing to request

    setLocalLoading(true);
    try {
      const settings = await notifee.requestPermission();
      if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
        Alert.alert(
          "Notifications Needed",
          "Prayer time reminders will not be delivered until notifications are enabled. You may activate them later in Settings."
        );
      }
    } catch (err) {
      console.error("❌ Notification access error:", err);
      Alert.alert("Error", "Failed to request notifications. Please try again.");
    } finally {
      setLocalLoading(false);
    }
  }

  // ------------------------------------------------------------
  // 3️⃣ (Step 3B, Android) Open battery optimization settings
  // ------------------------------------------------------------
  const openBatteryOptimizationSettings = async () => {
    const packageName = Application.applicationId ?? "";
    const batteryOptimizationEnabled = await notifee.isBatteryOptimizationEnabled();

    if (batteryOptimizationEnabled) {
      try {
        await IntentLauncher.startActivityAsync(
          "android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
          { data: `package:${packageName}` }
        );
        return;
      } catch {
        // fallthrough...
      }
    }

    await notifee.openBatteryOptimizationSettings();
  };

  // ------------------------------------------------------------
  // 3️⃣ (Step 3, Android) Open alarms & reminders settings
  // ------------------------------------------------------------
  const openAlarmPermissionSettings = async () => {
    await notifee.openAlarmPermissionSettings();
  };

  // ------------------------------------------------------------
  // 🏁 (Finish) Save data and redirect to HomeScreen
  // ------------------------------------------------------------
  async function finishOnboarding() {
    setLocalLoading(true);
    try {
      // Update onboardingStore
      setOnboarding(true);

      // Update locationStore
      setLocation(
        locationRef.current,
        fullAddressRef.current,
        timeZoneRef.current
      );

      // Redirect to HomeScreen
      // Stack.Protected will auto-redirect to (tabs) when onboarding becomes true
    } catch (err) {
      console.error("❌ Onboarding error:", err);
      Alert.alert("Error", "Failed to finish onboarding. Please try again.");
    } finally {
      setLocalLoading(false);
    }
  }

  // Loading state
  if (localLoading) {
    return <AppLoading />;
  }

  return (
    <AppLayout>
      <ScrollView
        style={[globalStyles.scrollContainer, { backgroundColor: theme.bg }]}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topInset, paddingBottom: bottomInset }
        ]}
        showsVerticalScrollIndicator={false}
      >

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
            {locationPermission && (
              <View style={styles.statusBadge}>
                <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                <Text style={[styles.statusBadgeText, { color: theme.success }]}>Location enabled</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={requestLocation}
            >
              <Text style={[styles.buttonText, { color: theme.white }]}>
                {locationPermission ? "Continue" : "Allow Location"}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Step 3: Permissions */}
        {step === 3 && (
          <>
            <View style={styles.banner}>
              <Ionicons name="alarm-outline" size={80} color={theme.primary} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Stay Updated</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Allow these so prayer reminders reach you on time.
            </Text>

            <View style={[styles.permissionGroup, { backgroundColor: theme.overlayLight, borderColor: theme.border }]}>
              {/* Notifications */}
              <TouchableOpacity style={styles.permissionRow} onPress={requestNotifications} activeOpacity={0.7}>
                <View style={[styles.permissionIcon, { backgroundColor: (notificationPermission ? theme.primary : theme.warning) + '20' }]}>
                  <MaterialCommunityIcons
                    name={notificationPermission ? "bell-check-outline" : "bell-alert-outline"}
                    size={20}
                    color={notificationPermission ? theme.primary : theme.warning}
                  />
                </View>
                <View style={styles.permissionText}>
                  <Text style={[styles.permissionTitle, { color: theme.text }]}>
                    Notifications
                  </Text>
                  <Text style={[styles.permissionBody, { color: theme.text2 }]}>
                    Get notified for upcoming prayer times.
                  </Text>
                </View>
                <Ionicons
                  name={notificationPermission ? "checkmark-circle" : "alert-circle-outline"}
                  size={22}
                  color={notificationPermission ? theme.success : theme.warning}
                />
              </TouchableOpacity>

              {Platform.OS === "android" && (
                <>
                  <View style={[styles.permissionDivider, { borderColor: theme.divider2 }]} />

                  {/* Battery optimization */}
                  <TouchableOpacity style={styles.permissionRow} onPress={openBatteryOptimizationSettings} activeOpacity={0.7}>
                    <View style={[styles.permissionIcon, { backgroundColor: (batteryOptimization ? theme.warning : theme.primary) + '20' }]}>
                      <MaterialCommunityIcons
                        name={batteryOptimization ? "battery-alert-variant-outline" : "battery-check-outline"}
                        size={20}
                        color={batteryOptimization ? theme.warning : theme.success}
                      />
                    </View>
                    <View style={styles.permissionText}>
                      <Text style={[styles.permissionTitle, { color: theme.text }]}>
                        Battery Optimization
                      </Text>
                      <Text style={[styles.permissionBody, { color: theme.text2 }]}>
                        Disable battery optimization so reminders arrive on time.
                      </Text>
                    </View>
                    <Ionicons
                      name={batteryOptimization ? "alert-circle-outline" : "checkmark-circle"}
                      size={22}
                      color={batteryOptimization ? theme.warning : theme.success}
                    />
                  </TouchableOpacity>

                  <View style={[styles.permissionDivider, { borderColor: theme.divider2 }]} />

                  {/* Alarms & reminders */}
                  <TouchableOpacity style={styles.permissionRow} onPress={openAlarmPermissionSettings} activeOpacity={0.7}>
                    <View style={[styles.permissionIcon, { backgroundColor: (alarmPermission ? theme.primary : theme.warning) + '20' }]}>
                      <MaterialCommunityIcons
                        name="alarm"
                        size={20}
                        color={alarmPermission ? theme.primary : theme.warning}
                      />
                    </View>
                    <View style={styles.permissionText}>
                      <Text style={[styles.permissionTitle, { color: theme.text }]}>
                        Alarms & Reminders
                      </Text>
                      <Text style={[styles.permissionBody, { color: theme.text2 }]}>
                        Enable exact alarms for precise prayer reminders.
                      </Text>
                    </View>
                    <Ionicons
                      name={alarmPermission ? "checkmark-circle" : "alert-circle-outline"}
                      size={22}
                      color={alarmPermission ? theme.success : theme.warning}
                    />
                  </TouchableOpacity>
                </>
              )}
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary, marginTop: 24 }]}
              onPress={finishOnboarding}
            >
              <Text style={[styles.buttonText, { color: theme.white }]}>Finish</Text>
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

      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
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
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 24,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  permissionGroup: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  permissionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionText: {
    flex: 1,
    gap: 2,
  },
  permissionTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  permissionBody: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.85,
  },
  permissionDivider: {
    width: "100%",
    borderWidth: 1,
    marginVertical: 8,
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
