import { globalStyles } from "@/constants/styles";
import { PRAYER_CELEBRATIONS_TR } from "@/constants/translations/celebrations.tr";
import { useDebugStore } from "@/store/debugStore";
import { useLanguageStore } from "@/store/languageStore";
import { useLocationStore } from "@/store/locationStore";
import { useModalStore } from "@/store/modalStore";
import { useNotificationsStore } from "@/store/notificationsStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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

interface PillProps {
  label: string;
  color: string;
  bg: string;
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
// Small rounded status badge (ON/OFF state, delay seconds, …)
// ------------------------------------------------------------
function Pill({ label, color, bg }: PillProps) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

// ------------------------------------------------------------
// Debug row with an ON / OFF state pill
// ------------------------------------------------------------
function DebugToggle({ label, value, onPress }: DebugToggleProps) {
  const theme = useThemeStore((state) => state.theme);
  return (
    <DebugButton
      label={`Toggle ${label}`}
      color={theme.violet}
      onPress={onPress}
      right={
        <Pill
          label={value ? "ON" : "OFF"}
          color={value ? theme.islamicGreen : theme.placeholder}
          bg={value ? theme.islamicGreen + "20" : theme.overlay}
        />
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
      style={[styles.button, { backgroundColor: theme.overlayLight }]}
      activeOpacity={0.6}
      onPress={onPress}
    >
      <Text style={[styles.buttonText, { color }]}>{label}</Text>
      {right}
    </TouchableOpacity>
  );
}

// Renders the debug controls only — the containing AppCard + "Debug Tools"
// title live in the Settings screen, so it matches the other setting cards.
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

  // Main component
  return (
    <>
      <TouchableOpacity
        style={[styles.selector, { backgroundColor: theme.overlay }]}
        activeOpacity={0.7}
        onPress={() => setExpanded((v) => !v)}
      >
        <Ionicons name="bug" size={20} color={theme.danger} style={styles.selectorIcon} />
        <Text style={[styles.selectorText, { color: theme.danger }]}>
          {expanded ? "Hide debug actions" : "Show debug actions"}
        </Text>
        <MaterialCommunityIcons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={24}
          color={theme.danger}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />

          {/* Onboarding */}
          <DebugButton
            label="Show Onboarding Screen"
            color={theme.info}
            onPress={() => useOnboardingStore.getState().setOnboarding(false)}
          />

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />

          {/* Celebration modal previews */}
          <DebugButton label="Show 'Prayer' Celebration Modal" color={theme.teal} onPress={showPrayerCelebration} />
          <DebugButton label="Show 'Khatam' Celebration Modal" color={theme.teal} onPress={showKhatamCelebration} />

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />

          {/* UI toggles */}
          <DebugToggle label="Holiday Card" value={forceHoliday} onPress={toggleHoliday} />
          <DebugToggle label="Friday Badge" value={forceFriday} onPress={toggleFriday} />
          <DebugToggle label="Quran Now-Playing" value={forceQuranPlaying} onPress={toggleQuranPlaying} />

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />

          {/* Test notifications */}
          {TEST_FUNCTIONS.map(({ label, func }) => (
            <DebugButton
              key={label}
              label={`Test ${label}`}
              color={theme.orange}
              onPress={() => func({ options: { language, location, hasAlarm: true }, notifSettings, seconds })}
              right={<Pill label={`${seconds}s`} color={theme.placeholder} bg={theme.overlay} />}
            />
          ))}
          {/* Channels & scheduled dump */}
          <DebugButton label="Debug Channels & Scheduled" color={theme.gray} onPress={debugChannelsAndScheduled} />

        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 8,
  },
  selectorIcon: {
    marginRight: 10,
  },
  selectorText: {
    fontSize: 17,
    flex: 1,
    fontWeight: "500",
  },
  body: {
    gap: 6,
    marginVertical: 8,
  },

  // Action row + right-side indicators
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "500",
  },

  // Rounded status badge (ON/OFF, delay seconds)
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 36,
    alignItems: "center",
  },
  pillText: {
    fontSize: 11,
    fontWeight: "700",
  },

  divider: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
});
