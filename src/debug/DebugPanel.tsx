import { openUpdateAvailableModal } from "@/components/CheckForUpdate";
import { UpdatePreview, useDebugStore } from "@/debug/debugStore";
import { useLanguageStore } from "@/store/languageStore";
import { useLocationStore } from "@/store/locationStore";
import { useNotificationsStore } from "@/store/notificationsStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons } from "@react-native-vector-icons/ionicons/static";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons/static";
import { ReactNode, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { previewKhatamCelebrationModal, previewPrayerCelebrationModal } from "./debugCelebs";
import {
  debugDailyQuoteN,
  debugEventN,
  debugFridayN,
  debugHolidayN,
  debugPrayerN,
  debugPrayerReminderN,
  debugScheduledN
} from "./debugNotifs";

interface ToggleProps {
  label: string;
  color?: string;
  value: boolean;
  onPress: () => void;
}

interface ButtonProps {
  label: string;
  color: string;
  right?: ReactNode;
  onPress: () => void;
}

interface BadgeProps {
  label: string;
  color: string;
  bg: string;
}

// ------------------------------------------------------------
// Small rounded status badge (ON/OFF state, delay seconds, …)
// ------------------------------------------------------------
function Badge({ label, color, bg }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ------------------------------------------------------------
// Reusable debug row — label on the left, optional
// value/indicator (e.g. "10s") on the right
// ------------------------------------------------------------
function DebugButton({ label, color, right, onPress }: ButtonProps) {
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

// ------------------------------------------------------------
// Debug row with an ON / OFF state badge
// ------------------------------------------------------------
function DebugToggle({ label, color, value, onPress }: ToggleProps) {
  const theme = useThemeStore((state) => state.theme);
  return (
    <DebugButton
      label={label}
      color={color ?? theme.violet}
      onPress={onPress}
      right={
        <Badge
          label={value ? "ON" : "OFF"}
          color={value ? theme.islamicGreen : theme.placeholder}
          bg={value ? theme.islamicGreen + "20" : theme.overlay}
        />
      }
    />
  );
}

// Renders the debug controls only — the containing AppCard + "Debug Tools"
export default function DebugPanel() {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const language = useLanguageStore((state) => state.language);
  const location = useLocationStore((state) => state.location);
  const notifSettings = useNotificationsStore((state) => state.notifSettings);

  // Debug toggles (force scenario-gated UI: holiday card, Friday badge, Quran now-playing)
  const forceHoliday = useDebugStore((state) => state.forceHoliday);
  const forceFriday = useDebugStore((state) => state.forceFriday);
  const forceQuranPlaying = useDebugStore((state) => state.forceQuranPlaying);
  const forceUpdateOnLaunch = useDebugStore((state) => state.forceUpdateOnLaunch);
  const toggleHoliday = useDebugStore((state) => state.toggleHoliday);
  const toggleFriday = useDebugStore((state) => state.toggleFriday);
  const toggleQuranPlaying = useDebugStore((state) => state.toggleQuranPlaying);
  const toggleUpdateOnLaunch = useDebugStore((state) => state.toggleUpdateOnLaunch);
  const updatePreview = useDebugStore((state) => state.updatePreview);
  const setUpdatePreview = useDebugStore((state) => state.setUpdatePreview);

  // Local state
  const [expanded, setExpanded] = useState(false);

  // Shared params
  const notifSeconds = 10; // seconds until the test notification fires
  const notifParams = { options: { language, location, hasAlarm: true }, notifSettings, notifSeconds };
  const notifSecondsBadge = <Badge label={`${notifSeconds}s`} color={theme.placeholder} bg={theme.overlay} />;
  const togglePreview = (value: UpdatePreview) => setUpdatePreview(updatePreview === value ? "idle" : value);

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
        <MaterialDesignIcons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={24}
          color={theme.danger}
        />
      </TouchableOpacity>

      {expanded && (
        // The debug panel body
        <View style={styles.body}>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />

          {/* Onboarding */}
          <DebugButton label="Show Onboarding Screen" color={theme.info} onPress={() => useOnboardingStore.getState().setOnboarding(false)} />

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />

          {/* Celebration modal previews */}
          <DebugButton label="Show 'Prayer' Celebration Modal" color={theme.teal} onPress={previewPrayerCelebrationModal} />
          <DebugButton label="Show 'Khatam' Celebration Modal" color={theme.teal} onPress={previewKhatamCelebrationModal} />

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />

          {/* Check-for-update previews (modal + the two inline status lines) */}
          <DebugButton label="Show 'Update available' Modal" color={theme.green} onPress={openUpdateAvailableModal} />
          <DebugToggle label="Toggle 'Up to date' line" color={theme.green} value={updatePreview === "upToDate"} onPress={() => togglePreview("upToDate")} />
          <DebugToggle label="Toggle 'Check failed' line" color={theme.green} value={updatePreview === "error"} onPress={() => togglePreview("error")} />
          <DebugToggle label="Toggle 'Update available' On Launch" color={theme.green} value={forceUpdateOnLaunch} onPress={toggleUpdateOnLaunch} />

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />

          {/* UI toggles */}
          <DebugToggle label="Toggle Holiday Card" value={forceHoliday} onPress={toggleHoliday} />
          <DebugToggle label="Toggle Friday Badge" value={forceFriday} onPress={toggleFriday} />
          <DebugToggle label="Toggle Quran Now-Playing" value={forceQuranPlaying} onPress={toggleQuranPlaying} />

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />

          {/* Test Notifications */}
          <DebugButton label="Test Prayer Not." color={theme.orange} onPress={() => debugPrayerN(notifParams)} right={notifSecondsBadge} />
          <DebugButton label="Test Prayer Event Not." color={theme.orange} onPress={() => debugEventN(notifParams)} right={notifSecondsBadge} />
          <DebugButton label="Test Prayer Reminder Not." color={theme.orange} onPress={() => debugPrayerReminderN(notifParams)} right={notifSecondsBadge} />
          <DebugButton label="Test Friday Not." color={theme.orange} onPress={() => debugFridayN(notifParams)} right={notifSecondsBadge} />
          <DebugButton label="Test Islamic Holiday Not." color={theme.orange} onPress={() => debugHolidayN(notifParams)} right={notifSecondsBadge} />
          <DebugButton label="Test Daily Quote Not." color={theme.orange} onPress={() => debugDailyQuoteN(notifParams)} right={notifSecondsBadge} />
          {/* Test Notifications: Channels & scheduled dump */}
          <DebugButton label="Debug Channels & Scheduled" color={theme.gray} onPress={debugScheduledN} />

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
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 36,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  divider: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
});
