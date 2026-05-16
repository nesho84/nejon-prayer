import { useLanguageStore } from "@/store/languageStore";
import { useLocationStore } from "@/store/locationStore";
import { useNotificationsStore } from "@/store/notificationsStore";
import { useThemeStore } from "@/store/themeStore";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  debugChannelsAndScheduled,
  testDailyQuoteNotification,
  testEventNotification,
  testFridayNotification,
  testPrayerNotification,
  testPrayerReminderNotification,
} from "./notifTest";

const TEST_FUNCTIONS = [
  { label: "Prayer", func: testPrayerNotification },
  { label: "Prayer Event", func: testEventNotification },
  { label: "Prayer Reminder", func: testPrayerReminderNotification },
  { label: "Friday", func: testFridayNotification },
  { label: "Daily Quote", func: testDailyQuoteNotification },
] as const;

interface Props {
  seconds?: number;
}

export default function NotificationTester({ seconds = 10 }: Props) {
  const theme = useThemeStore((s) => s.theme);
  const language = useLanguageStore((s) => s.language);
  const location = useLocationStore((s) => s.location);
  const notifSettings = useNotificationsStore((s) => s.notifSettings);

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
        <Text style={[styles.headerText, { color: theme.danger }]}>
          {expanded ? "▼" : "▶"} Notification Tester
        </Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          {/* Test buttons */}
          {TEST_FUNCTIONS.map(({ label, func }) => (
            <TouchableOpacity
              key={label}
              style={[styles.button, { borderColor: theme.border }]}
              activeOpacity={0.6}
              onPress={() => func({ options, notifSettings, seconds })}
            >
              <Text style={[styles.buttonText, { color: theme.text }]}>
                Test {label}
              </Text>
              <Text style={[styles.delayText, { color: theme.text2 }]}>
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
            <Text style={[styles.buttonText, { color: theme.placeholder }]}>
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
    marginHorizontal: 8,
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
    opacity: 0.6,
  },
});
