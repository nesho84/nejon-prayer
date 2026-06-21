import { useLanguageStore } from "@/store/languageStore";
import { useLocationStore } from "@/store/locationStore";
import { useNotificationsStore } from "@/store/notificationsStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useThemeStore } from "@/store/themeStore";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  debugChannelsAndScheduled,
  testDailyQuoteNotification,
  testEventNotification,
  testFridayNotification,
  testHolidayNotification,
  testPrayerNotification,
  testPrayerReminderNotification,
} from "./notificationsTests";

const TEST_FUNCTIONS = [
  { label: "Prayer", func: testPrayerNotification },
  { label: "Prayer Event", func: testEventNotification },
  { label: "Prayer Reminder", func: testPrayerReminderNotification },
  { label: "Friday", func: testFridayNotification },
  { label: "Daily Quote", func: testDailyQuoteNotification },
  { label: "Islamic Holiday", func: testHolidayNotification },
] as const;

interface Props {
  seconds?: number;
}

export default function DebugPanel({ seconds = 10 }: Props) {
  const theme = useThemeStore((state) => state.theme);
  const language = useLanguageStore((state) => state.language);
  const location = useLocationStore((state) => state.location);
  const notifSettings = useNotificationsStore((state) => state.notifSettings);

  const options = { language, location, hasAlarm: true };

  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.container, { borderColor: theme.danger }]}>
      {/* Toggle header */}
      <TouchableOpacity
        style={styles.header}
        activeOpacity={0.6}
        onPress={() => setExpanded((v) => !v)}
      >
        <Text style={[styles.headerText, { color: theme.placeholder }]}>
          {expanded ? "▼" : "▶"} Debug
        </Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          {/* Show Onboarding */}
          <TouchableOpacity
            style={[styles.button, { borderColor: theme.border }]}
            activeOpacity={0.6}
            onPress={() => useOnboardingStore.getState().setOnboarding(false)}
          >
            <Text style={[styles.buttonText, { color: theme.info }]}>Show Onboarding</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={[styles.divider, { borderColor: theme.divider2 }]}></View>

          {/* Test buttons */}
          {TEST_FUNCTIONS.map(({ label, func }) => (
            <TouchableOpacity
              key={label}
              style={[styles.button, { borderColor: theme.border }]}
              activeOpacity={0.6}
              onPress={() => func({ options, notifSettings, seconds })}
            >
              <Text style={[styles.buttonText, { color: theme.orange }]}>
                Test {label}
              </Text>
              <Text style={[styles.delayText, { color: theme.placeholder }]}>
                {seconds}s
              </Text>
            </TouchableOpacity>
          ))}

          {/* Debug button */}
          <TouchableOpacity
            style={[styles.button, { borderColor: theme.border }]}
            activeOpacity={0.6}
            onPress={debugChannelsAndScheduled}
          >
            <Text style={[styles.buttonText, { color: theme.brown }]}>
              Debug Channels & Scheduled
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  header: {
    padding: 10,
  },
  headerText: {
    fontSize: 14,
    fontWeight: "700",
  },
  body: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 6,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  delayText: {
    fontSize: 12,
  },
  divider: {
    width: "100%",
    borderWidth: 1,
    marginVertical: 4,
  },
});
