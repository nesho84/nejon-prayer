import { useModalStore } from "@/store/modalStore";
import { useThemeStore } from "@/store/themeStore";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons/static";
import * as Clipboard from "expo-clipboard";
import { ReactNode, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ToggleProps {
  label: string;
  color?: string;
  value: boolean;
  hint?: string;
  onPress: () => void;
}

interface ButtonProps {
  label: string;
  color: string;
  right?: ReactNode;
  hint?: string;
  onPress: () => void;
}

interface InfoButtonProps {
  active: boolean;
  onPress: () => void;
}

interface HintProps {
  text: string;
}

interface BadgeProps {
  label: string;
  color: string;
  bg: string;
}

interface JsonViewerProps {
  json: string;
}

interface SectionProps {
  title: string;
  children: ReactNode;
}

interface ModalHeadProps {
  title: string;
  hint: string;
}

// How scenario-based features really trigger — shown under their ⓘ
export const STORE_UPDATE_LAUNCH_HINT =
  "When ON, every app start acts as if the store reported an update (no real check, no 5 s wait) — " +
  "so the launch order and the waits apply. Stays ON across restarts until you turn it off " +
  "(or debug mode is turned off).";
export const UP_TO_DATE_HINT =
  "Shows the green line under Settings → \"Check for update\" without a real check, until the app restarts. " +
  "Real: shown after a manual check finds no newer store version.";
export const CHECK_FAILED_HINT =
  "Shows the red line under Settings → \"Check for update\" without a real check, until the app restarts. " +
  "Real: shown when a manual check runs offline, or Play can't answer (e.g. the app wasn't installed from Play).";
export const NO_PRAYER_TIMES_HINT =
  "Real: Home shows the placeholder (explorable Home + retry strip) instead of the prayer list when there are " +
  "no prayer times — no location saved yet, or nothing could be loaded and nothing is saved " +
  "(e.g. offline on the first start). Without prayer times no notifications get scheduled. " +
  "Here: only Home changes.";
export const OUTDATED_HINT =
  "Real: shown on Home and Settings when the saved prayer times are from last year and this year's " +
  "download failed (e.g. offline after New Year) — the app keeps using last year's times. " +
  "Clears after the next successful download.";
export const LOCATION_CHANGED_HINT =
  "Real: on app start and on every return to the app (at most every 15 min) a quick location check runs. " +
  "50 km or more from the saved location → warning on Home and Settings. Clears when you update the location " +
  "in Settings, or when a later check is back under 50 km.";
export const PRAYER_CELEBRATION_HINT =
  "Auto: on Home only, when your tap marks the last of today's 5 prayers. Once a day — but if Isha is the last one " +
  "marked, it shows again. Never from the Timings modal or the notification's \"Prayed\" button. " +
  "(The 3rd prayer marked in a day asks for Rate App instead.) Here: a random message, tracking untouched.";
export const KHATAM_HINT =
  "Auto: in Khatam mode only, when you tap \"Complete Khatam\" at the end of Surah 114. " +
  "Adds 1 to the khatam count and clears the khatam bookmark; Share or OK then closes the reading screen. " +
  "Reading mode never shows it. Here: preview only — count and bookmark untouched.";
export const HOLIDAY_CARD_HINT =
  "Real: on Home, the next of Ramadan, Laylat al-Qadr and the two Eids appears 1–7 days before it " +
  "(7 for Ramadan and the Eids, 3 for Laylat al-Qadr) — not on the day itself. " +
  "Here: a fake Ramadan start in 3 days.";

// How the four auto modals work — shown under their ⓘ
export const STORE_UPDATE_HINT =
  "Checked on every app start (release builds only, up to 5 s). Android asks Google Play (In-App Updates), " +
  "which only works when the app was installed from Play; iOS isn't set up yet.\n" +
  "First in the launch order: Store Update → Notif Reminder → Feedback, at most one per start.\n" +
  "Newer version → shows; the next two starts show it again, then every 3 days. Never stops.\n" +
  "Up to date (and online) → starts over.\n" +
  "From Settings → \"Check for update\": opens when one is found, not recorded. OTA updates reload silently.\n" +
  "Here: counts like a real show — during the 3-day wait, you get a Reset.";
export const NOTIF_REMINDER_HINT =
  "First show: on an app start 3+ days after the app first saw notifications turned off.\n" +
  "\"Not now\" or \"Enable\" → asks again 7 days later, then 14 days later (on an app start).\n" +
  "Never again: after 3 shows — starts over once notifications are allowed and later turned off again.\n" +
  "Waits while Store Update showed on that start, or another modal is open.\n" +
  "Here: counts like a real show and skips the waits — when blocked, you get a Reset.";
export const RATE_APP_HINT =
  "First show (Android only): the first time a 3rd prayer gets marked in one day (Home: today; Timings: any day), " +
  "or Quran reading scrolls past ayah 20 — can already happen on day one.\n" +
  "\"Later\" → asks again 7 days later, at the next such moment.\n" +
  "Never again: \"Open Store\", \"Already rated\", or after 3 shows.\n" +
  "Waits while Feedback was shown in the last 7 days, Store Update or Notif Reminder showed since the app started, " +
  "or another modal is open.\n" +
  "From About: always opens; only \"Open Store\" / \"Already rated\" are recorded.\n" +
  "Here: counts like a real show and skips the waits — when blocked, you get a Reset.";
export const FEEDBACK_HINT =
  "First show: on an app start at least 7 days after onboarding.\n" +
  "\"Maybe later\" or close → asks again 30 days later, on an app start.\n" +
  "Never again: sent, \"Don't ask again\", or after 3 shows.\n" +
  "Waits while Rate App was shown in the last 7 days, Store Update or Notif Reminder showed on that start, " +
  "or another modal is open.\n" +
  "From About: always opens at the questions; only sending is recorded.\n" +
  "Here: counts like a real show and skips the waits — when blocked, you get a Reset.";

// ------------------------------------------------------------
// Small rounded status badge (ON/OFF state, delay seconds, …)
// ------------------------------------------------------------
export function Badge({ label, color, bg }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ------------------------------------------------------------
// ⓘ button that toggles a hint
// ------------------------------------------------------------
function InfoButton({ active, onPress }: InfoButtonProps) {
  const theme = useThemeStore((state) => state.theme);
  return (
    <TouchableOpacity
      style={[styles.infoButton, active && { backgroundColor: theme.pressed }]}
      activeOpacity={0.6}
      hitSlop={8}
      onPress={onPress}
    >
      <MaterialDesignIcons name="information-outline" size={18} color={theme.textMuted} />
    </TouchableOpacity>
  );
}

// ------------------------------------------------------------
// Explanation shown under a row or auto-modal title
// ------------------------------------------------------------
function Hint({ text }: HintProps) {
  const theme = useThemeStore((state) => state.theme);
  return <Text style={[styles.hint, { color: theme.danger, backgroundColor: theme.overlayLight }]}>{text}</Text>;
}

// ------------------------------------------------------------
// Reusable debug row — label on the left, optional ⓘ hint and
// value/indicator (e.g. "10s") on the right
// ------------------------------------------------------------
export function DebugButton({ label, color, right, hint, onPress }: ButtonProps) {
  const theme = useThemeStore((state) => state.theme);
  const [showHint, setShowHint] = useState(false);
  return (
    <>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.overlayLight }]}
        activeOpacity={0.6}
        onPress={onPress}
      >
        <Text style={[styles.buttonText, { color }]}>{label}</Text>
        <View style={styles.buttonRight}>
          {hint && <InfoButton active={showHint} onPress={() => setShowHint((v) => !v)} />}
          {right}
        </View>
      </TouchableOpacity>
      {hint && showHint && <Hint text={hint} />}
    </>
  );
}

// ------------------------------------------------------------
// Debug row with an ON / OFF state badge
// ------------------------------------------------------------
export function DebugToggle({ label, color, value, hint, onPress }: ToggleProps) {
  const theme = useThemeStore((state) => state.theme);
  return (
    <DebugButton
      label={label}
      color={color ?? theme.violet}
      hint={hint}
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

// ------------------------------------------------------------
// Feature section — uppercase heading + one card holding its rows
// ------------------------------------------------------------
export function DebugSection({ title, children }: SectionProps) {
  const theme = useThemeStore((state) => state.theme);
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>{children}</View>
    </View>
  );
}

// ------------------------------------------------------------
// Auto-modal title with an ⓘ that shows how it works
// ------------------------------------------------------------
export function AutoModalHead({ title, hint }: ModalHeadProps) {
  const theme = useThemeStore((state) => state.theme);
  const [showHint, setShowHint] = useState(false);
  return (
    <>
      <View style={styles.modalHead}>
        <Text style={[styles.modalTitle, { color: theme.text2 }]}>{title}</Text>
        <InfoButton active={showHint} onPress={() => setShowHint((v) => !v)} />
      </View>
      {showHint && <Hint text={hint} />}
    </>
  );
}

// ------------------------------------------------------------
// JSON viewer for debugging: scrollable, selectable, copy-to-clipboard
// ------------------------------------------------------------
function JsonViewer({ json }: JsonViewerProps) {
  const theme = useThemeStore((s) => s.theme);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, backgroundColor: theme.bg2 }} contentContainerStyle={{ padding: 6 }}>
        <Text
          selectable
          style={{
            fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
            fontSize: 11,
            color: theme.textMuted,
            lineHeight: 17,
          }}
        >
          {json}
        </Text>
      </ScrollView>
      <TouchableOpacity
        style={[styles.copyBtn, { backgroundColor: theme.green + "20" }]}
        activeOpacity={0.7}
        onPress={handleCopy}
      >
        <Text style={[styles.copyBtnText, { color: theme.green }]}>
          {copied ? "Copied ✓" : "Copy JSON"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ------------------------------------------------------------
// Open a fullscreen JSON viewer modal via ModalProvider
// ------------------------------------------------------------
export const showJsonViewerModal = (title: string, data: object) =>
  useModalStore.getState().show({
    type: "fullscreen",
    showCloseIcon: true,
    title,
    component: <JsonViewer json={JSON.stringify(data, null, 2)} />,
  });

const styles = StyleSheet.create({
  // Feature section
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: 4,
  },
  sectionCard: {
    borderRadius: 12,
    padding: 8,
    gap: 6,
  },

  // Auto-modal block
  modalHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 6,
    paddingRight: 2,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    lineHeight: 17,
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
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "500",
  },
  buttonRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
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

  // Copy-to-clipboard button for JSON viewer
  copyBtn: {
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 8,
  },
  copyBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
