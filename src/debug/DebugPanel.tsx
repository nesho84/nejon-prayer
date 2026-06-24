import { globalStyles } from "@/constants/styles";
import { PRAYER_CELEBRATIONS_TR } from "@/constants/translations/celebrations.tr";
import { useDebugStore } from "@/store/debugStore";
import { useLanguageStore } from "@/store/languageStore";
import { useLocationStore } from "@/store/locationStore";
import { useModalStore } from "@/store/modalStore";
import { useNotificationsStore } from "@/store/notificationsStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useThemeStore } from "@/store/themeStore";
import { ReactNode, useState } from "react";
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

interface Props {
  seconds?: number;
}

interface DebugToggleProps {
  label: string;
  value: boolean;
  onPress: () => void;
}

interface DebugButtonProps {
  label: string;
  color: string;
  right?: ReactNode;
  onPress: () => void;
}

// Test-notification triggers (label + payload builder)
const TEST_FUNCTIONS = [
  { label: "Prayer", func: testPrayerNotification },
  { label: "Prayer Event", func: testEventNotification },
  { label: "Prayer Reminder", func: testPrayerReminderNotification },
  { label: "Friday", func: testFridayNotification },
  { label: "Daily Quote", func: testDailyQuoteNotification },
  { label: "Islamic Holiday", func: testHolidayNotification },
] as const;

// ------------------------------------------------------------
// Debug row with an ON / OFF state indicator
// ------------------------------------------------------------
function DebugToggle({ label, value, onPress }: DebugToggleProps) {
  const theme = useThemeStore((state) => state.theme);
  return (
    <DebugButton
      label={`Toggle ${label}`}
      color={theme.danger}
      onPress={onPress}
      right={
        <Text style={[styles.toggleValue, { color: value ? theme.islamicGreen : theme.placeholder }]}>
          {value ? "ON" : "OFF"}
        </Text>
      }
    />
  );
}

// ------------------------------------------------------------
// Reusable debug row — label on the left, optional
// value/indicator (e.g. "10s") on the right
// ------------------------------------------------------------
function DebugButton({ label, color, right, onPress }: DebugButtonProps) {
  const theme = useThemeStore((state) => state.theme);
  return (
    <TouchableOpacity
      style={[styles.button, { borderColor: theme.border }]}
      activeOpacity={0.6}
      onPress={onPress}
    >
      <Text style={[styles.buttonText, { color }]}>{label}</Text>
      {right}
    </TouchableOpacity>
  );
}

export default function DebugPanel({ seconds = 10 }: Props) {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const language = useLanguageStore((state) => state.language);
  const tr = useLanguageStore((state) => state.tr);
  const location = useLocationStore((state) => state.location);
  const notifSettings = useNotificationsStore((state) => state.notifSettings);

  // Debug toggles (force scenario-gated UI: holiday card, Friday badge, Quran now-playing)
  const forceHoliday = useDebugStore((state) => state.forceHoliday);
  const forceFriday = useDebugStore((state) => state.forceFriday);
  const forceQuranPlaying = useDebugStore((state) => state.forceQuranPlaying);
  const toggleHoliday = useDebugStore((state) => state.toggleHoliday);
  const toggleFriday = useDebugStore((state) => state.toggleFriday);
  const toggleQuranPlaying = useDebugStore((state) => state.toggleQuranPlaying);

  // Local state
  const [expanded, setExpanded] = useState(false);

  // ------------------------------------------------------------
  // Fires a celebration modal (shared by the prayer & khatam previews)
  // ------------------------------------------------------------
  const showCelebration = (emoji: string, title: string, message: string) => {
    useModalStore.getState().show({
      type: "alert",
      celebrationAnimation: true,
      component: (
        <View style={globalStyles.bannerContainer}>
          <Text style={globalStyles.bannerEmoji}>{emoji}</Text>
          <Text style={[globalStyles.bannerTitle, { color: theme.text2 }]}>{title}</Text>
          <Text style={[globalStyles.bannerMessage, { color: theme.textMuted }]}>{message}</Text>
        </View>
      ),
      buttons: [{
        label: "OK",
        action: "ok",
        buttonStyle: { backgroundColor: theme.accentLight, borderWidth: 1, borderColor: theme.divider2 },
        labelStyle: { fontSize: 16, fontWeight: "600", color: theme.accent },
      }],
    });
  };

  // ------------------------------------------------------------
  // Prayer-complete celebration with a random localized message
  // ------------------------------------------------------------
  const showPrayerCelebration = () => {
    const variants = PRAYER_CELEBRATIONS_TR[language] ?? PRAYER_CELEBRATIONS_TR["en"];
    const variant = variants[Math.floor(Math.random() * variants.length)];
    showCelebration(variant.emoji, variant.title, variant.message);
  };

  // ------------------------------------------------------------
  // Khatam-complete celebration
  // ------------------------------------------------------------
  const showKhatamCelebration = () => {
    showCelebration("📖", tr.labels.khatamCompleteTitle, tr.labels.khatamCompleteMessage);
  };

  return (
    <View style={[styles.container, { borderColor: theme.danger }]}>

      {/* Expand/collapse header */}
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

          {/* Onboarding */}
          <DebugButton
            label="Show Onboarding"
            color={theme.info}
            onPress={() => useOnboardingStore.getState().setOnboarding(false)}
          />

          {/* Divider */}
          <View style={[styles.divider, { borderColor: theme.divider2 }]} />

          {/* Celebration modal previews */}
          <DebugButton label="Show 'Prayer' Celebration Modal" color={theme.gray} onPress={showPrayerCelebration} />
          <DebugButton label="Show 'Khatam' Celebration Modal" color={theme.gray} onPress={showKhatamCelebration} />

          {/* Divider */}
          <View style={[styles.divider, { borderColor: theme.divider2 }]} />

          {/* Scenario-gated UI toggles */}
          <DebugToggle label="Holiday Card" value={forceHoliday} onPress={toggleHoliday} />
          <DebugToggle label="Friday Badge" value={forceFriday} onPress={toggleFriday} />
          <DebugToggle label="Quran Now-Playing" value={forceQuranPlaying} onPress={toggleQuranPlaying} />

          {/* Divider */}
          <View style={[styles.divider, { borderColor: theme.divider2 }]} />

          {/* Test notifications */}
          {TEST_FUNCTIONS.map(({ label, func }) => (
            <DebugButton
              key={label}
              label={`Test ${label}`}
              color={theme.orange}
              onPress={() => func({ options: { language, location, hasAlarm: true }, notifSettings, seconds })}
              right={<Text style={[styles.delayText, { color: theme.placeholder }]}>{seconds}s</Text>}
            />
          ))}

          {/* Channels & scheduled dump */}
          <DebugButton label="Debug Channels & Scheduled" color={theme.orange} onPress={debugChannelsAndScheduled} />

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

  // Action row + right-side indicators
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
  toggleValue: {
    fontSize: 12,
    fontWeight: "700",
  },

  divider: {
    width: "100%",
    borderWidth: 1,
    marginVertical: 4,
  },
});
