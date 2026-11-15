import { openUpdateAvailableModal } from "@/components/CheckForUpdate";
import { FEEDBACK_MAX_SHOWS, showFeedbackModal } from "@/components/Feedback";
import { NOTIF_REMINDER_MAX_SHOWS, showNotifReminderModal } from "@/components/NotifReminder";
import { RATE_APP_MAX_SHOWS, showRateAppModal } from "@/components/RateApp";
import { UpdatePreview, useDebugStore } from "@/debug/debugStore";
import { useDeviceSettingsStore } from "@/store/deviceSettingsStore";
import { useFeedbackStore } from "@/store/feedbackStore";
import { useHolidaysStore } from "@/store/holidaysStore";
import { useLanguageStore } from "@/store/languageStore";
import { useLocationStore } from "@/store/locationStore";
import { useModalStore } from "@/store/modalStore";
import { useNotificationsStore } from "@/store/notificationsStore";
import { useNotifReminderStore } from "@/store/notifReminderStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { usePrayersStore } from "@/store/prayersStore";
import { usePrayersTrackingStore } from "@/store/prayersTrackingStore";
import { useQuranStore } from "@/store/quranStore";
import { useRateAppStore } from "@/store/rateAppStore";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons } from "@react-native-vector-icons/ionicons/static";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons/static";
import * as Clipboard from "expo-clipboard";
import { ReactNode, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { previewKhatamCelebrationModal, previewPrayerCelebrationModal } from "./debugCelebs";
import {
  debugDailyQuoteN,
  debugEventN,
  debugFridayN,
  debugHolidayN,
  debugPrayerN,
  debugPrayerReminderN,
  getScheduledNData,
  logScheduledN,
} from "./debugNotifs";

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

interface DebugPanelProps {
  status: string;
  onStatusPress: () => void;
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
const UPDATE_MODAL_HINT =
  "Auto (release builds only): checked once on every app start. Android asks Google Play (In-App Updates), " +
  "which only works when the app was installed from Play; iOS isn't set up yet. A newer store version → this modal " +
  "on every start until updated (\"Later\" isn't remembered). OTA updates download and reload silently — no modal. " +
  "Also opens from Settings → \"Check for update\" when one is found. Here it just opens.";
const UPDATE_LAUNCH_HINT =
  "When ON, the \"Update available\" modal opens on the next app start, like a real store update would. " +
  "Stays ON across restarts until you turn it off (or debug mode is turned off).";
const UP_TO_DATE_HINT =
  "Shows the green line under Settings → \"Check for update\" without a real check, until the app restarts. " +
  "Real: shown after a manual check finds no newer store version.";
const CHECK_FAILED_HINT =
  "Shows the red line under Settings → \"Check for update\" without a real check, until the app restarts. " +
  "Real: shown when a manual check runs offline, or Play can't answer (e.g. the app wasn't installed from Play).";
const NO_PRAYER_TIMES_HINT =
  "Real: Home shows the placeholder (explorable Home + retry strip) instead of the prayer list when there are " +
  "no prayer times — no location saved yet, or nothing could be loaded and nothing is saved " +
  "(e.g. offline on the first start). Without prayer times no notifications get scheduled. " +
  "Here: only Home changes.";
const OUTDATED_HINT =
  "Real: shown on Home and Settings when the saved prayer times are from last year and this year's " +
  "download failed (e.g. offline after New Year) — the app keeps using last year's times. " +
  "Clears after the next successful download.";
const LOCATION_CHANGED_HINT =
  "Real: on app start and on every return to the app (at most every 15 min) a quick location check runs. " +
  "50 km or more from the saved location → warning on Home and Settings. Clears when you update the location " +
  "in Settings, or when a later check is back under 50 km.";
const PRAYER_CELEBRATION_HINT =
  "Auto: on Home only, when your tap marks the last of today's 5 prayers. Once a day — but if Isha is the last one " +
  "marked, it shows again. Never from the Timings modal or the notification's \"Prayed\" button. " +
  "(The 3rd prayer marked in a day asks for Rate App instead.) Here: a random message, tracking untouched.";
const KHATAM_HINT =
  "Auto: in Khatam mode only, when you tap \"Complete Khatam\" at the end of Surah 114. " +
  "Adds 1 to the khatam count and clears the khatam bookmark; Share or OK then closes the reading screen. " +
  "Reading mode never shows it. Here: preview only — count and bookmark untouched.";
const HOLIDAY_CARD_HINT =
  "Real: on Home, the next of Ramadan, Laylat al-Qadr and the two Eids appears 1–7 days before it " +
  "(7 for Ramadan and the Eids, 3 for Laylat al-Qadr) — not on the day itself. " +
  "Here: a fake Ramadan start in 3 days.";

// How the three auto modals work — shown under their ⓘ
const RATE_APP_HINT =
  "First show (Android only): the first time a 3rd prayer gets marked in one day (Home or Timings), " +
  "or Quran reading scrolls past ayah 20 — can already happen on day one.\n" +
  "\"Later\" → asks again 7 days later, at the next such moment.\n" +
  "Never again: \"Open Store\", \"Already rated\", or after 3 shows.\n" +
  "Waits while Feedback was shown in the last 14 days, or another modal is open.\n" +
  "From About: always opens; only \"Open Store\" / \"Already rated\" are recorded.\n" +
  "Here: counts like a real show and skips the waits — when blocked, you get a Reset.";
const FEEDBACK_HINT =
  "First show: on an app start at least 14 days after onboarding, once the app has been started 10 times.\n" +
  "\"Maybe later\" or close → asks again 30 days later, on an app start.\n" +
  "Never again: sent, \"Don't ask again\", or after 3 shows.\n" +
  "Waits while Rate App was shown in the last 14 days, or another modal is open.\n" +
  "From About: always opens at the questions; only sending is recorded.\n" +
  "Here: counts like a real show and skips the waits — when blocked, you get a Reset.";
const NOTIF_REMINDER_HINT =
  "First show: on an app start 3+ days after the app first saw notifications turned off.\n" +
  "\"Not now\" or \"Enable\" → asks again 7 days later, then 14 days later (on an app start).\n" +
  "Never again: after 3 shows — starts over once notifications are allowed and later turned off again.\n" +
  "Waits while another modal is open.\n" +
  "Here: counts like a real show and skips the waits — when blocked, you get a Reset.";

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
function DebugButton({ label, color, right, hint, onPress }: ButtonProps) {
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
function DebugToggle({ label, color, value, hint, onPress }: ToggleProps) {
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
function DebugSection({ title, children }: SectionProps) {
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
function AutoModalHead({ title, hint }: ModalHeadProps) {
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
const showJsonViewerModal = (title: string, data: object) =>
  useModalStore.getState().show({
    type: "fullscreen",
    showCloseIcon: true,
    title,
    component: <JsonViewer json={JSON.stringify(data, null, 2)} />,
  });

// Timestamp → readable date for the JSON viewers
const formatTime = (time: number | null) => (time ? new Date(time).toLocaleString("en-GB") : null);

// Debug Tools box (About screen) — status badge on its top border, header toggles the grouped sections
export default function DebugPanel({ status, onStatusPress }: DebugPanelProps) {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const language = useLanguageStore((state) => state.language);
  const location = useLocationStore((state) => state.location);
  const notifSettings = useNotificationsStore((state) => state.notifSettings);

  // Debug toggles (force scenario-gated UI: holiday card, Friday badge, Quran now-playing, no-prayer-times placeholder,
  // outdated prayer times warning, location changed warning)
  const forceHoliday = useDebugStore((state) => state.forceHoliday);
  const forceFriday = useDebugStore((state) => state.forceFriday);
  const forceQuranPlaying = useDebugStore((state) => state.forceQuranPlaying);
  const forcePrayersOutdated = useDebugStore((state) => state.forcePrayersOutdated);
  const forceLocationChange = useDebugStore((state) => state.forceLocationChange);
  const forceNoPrayerTimes = useDebugStore((state) => state.forceNoPrayerTimes);
  const forceUpdateOnLaunch = useDebugStore((state) => state.forceUpdateOnLaunch);
  const toggleHoliday = useDebugStore((state) => state.toggleHoliday);
  const toggleFriday = useDebugStore((state) => state.toggleFriday);
  const toggleQuranPlaying = useDebugStore((state) => state.toggleQuranPlaying);
  const togglePrayersOutdated = useDebugStore((state) => state.togglePrayersOutdated);
  const toggleLocationChange = useDebugStore((state) => state.toggleLocationChange);
  const toggleNoPrayerTimes = useDebugStore((state) => state.toggleNoPrayerTimes);
  const toggleUpdateOnLaunch = useDebugStore((state) => state.toggleUpdateOnLaunch);
  const updatePreview = useDebugStore((state) => state.updatePreview);
  const setUpdatePreview = useDebugStore((state) => state.setUpdatePreview);

  // Local state
  const [expanded, setExpanded] = useState(false);

  // Shared params and handlers
  const notifSeconds = 10; // seconds until the test notification fires
  const notifParams = { options: { language, location, hasAlarm: true }, notifSettings, notifSeconds };
  const notifSecondsBadge = <Badge label={`${notifSeconds}s`} color={theme.placeholder} bg={theme.overlay} />;
  const togglePreview = (value: UpdatePreview) => setUpdatePreview(updatePreview === value ? "idle" : value);
  const showScheduledNModal = async () => showJsonViewerModal("Scheduled Notifications", await getScheduledNData());
  const showPrayerTrackingModal = () => showJsonViewerModal("Prayer Tracking", usePrayersTrackingStore.getState().tracking);
  const showPrayerTimesModal = () => {
    const { prayerTimes, prayerTimesDate, fetchedYear, lastFetchedDate, prayersOutdated, prayersError } = usePrayersStore.getState();
    showJsonViewerModal("Prayer Times", { fetchedYear, prayerTimesDate, lastFetchedDate, prayersError, prayersOutdated, prayerTimes });
  };
  const showHolidaysModal = () => {
    const { yearlyHolidays, fetchedYear } = useHolidaysStore.getState();
    showJsonViewerModal("Islamic Holidays", { fetchedYear, yearlyHolidays });
  };
  const showQuranModal = () => {
    const {
      lastReadSurahName,
      lastReadAyahId,
      lastKhatamSurahName,
      lastKhatamAyahId,
      khatamCount,
      arabicFontSize,
      translationFontSize,
      arabicFontKey,
      selectedEditions,
      favoriteAyahs,
    } = useQuranStore.getState();
    showJsonViewerModal("Quran", {
      lastReadSurahName,
      lastReadAyahId,
      lastKhatamSurahName,
      lastKhatamAyahId,
      khatamCount,
      arabicFontSize,
      translationFontSize,
      arabicFontKey,
      selectedEditions,
      favoriteAyahs,
    });
  };

  // ------------------------------------------------------------
  // Auto modals — the same three parts each: JSON, preview, reset.
  // Previews count like a real show and skip the waits; a block gets an alert with Reset.
  // ------------------------------------------------------------
  const showRateAppJsonModal = () => {
    const { rateAppNextShowAt, rateAppShownAt, rateAppShownCount, rateAppDone } = useRateAppStore.getState();
    showJsonViewerModal("Rate App", {
      rateAppNextShowAt: formatTime(rateAppNextShowAt),
      rateAppShownAt: formatTime(rateAppShownAt),
      rateAppShownCount,
      rateAppDone,
    });
  };
  const resetRateApp = () => {
    useRateAppStore.setState({ rateAppNextShowAt: null, rateAppShownAt: null, rateAppShownCount: 0, rateAppDone: false });
  };
  const previewRateAppModal = () => {
    const { rateAppShownCount, rateAppDone } = useRateAppStore.getState();

    if (rateAppDone) {
      const blockedReason = rateAppShownCount >= RATE_APP_MAX_SHOWS
        ? `Limit reached (${rateAppShownCount}/${RATE_APP_MAX_SHOWS}) — the real modal never shows again.`
        : `"Open Store" or "Already rated" was tapped — the real modal never shows again.`;
      Alert.alert("Rate App", blockedReason, [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", onPress: resetRateApp },
      ]);
      return;
    }
    showRateAppModal();
  };

  const showFeedbackJsonModal = () => {
    const { feedbackNextShowAt, feedbackShownAt, feedbackShownCount, feedbackDone, feedbackLaunchCount } = useFeedbackStore.getState();
    showJsonViewerModal("Feedback", {
      feedbackNextShowAt: formatTime(feedbackNextShowAt),
      feedbackShownAt: formatTime(feedbackShownAt),
      feedbackShownCount,
      feedbackDone,
      feedbackLaunchCount,
    });
  };
  const resetFeedback = () => {
    useFeedbackStore.setState({
      feedbackNextShowAt: null,
      feedbackShownAt: null,
      feedbackShownCount: 0,
      feedbackDone: false,
      feedbackLaunchCount: 0,
    });
  };
  const previewFeedbackModal = () => {
    const { feedbackShownCount, feedbackDone } = useFeedbackStore.getState();

    if (feedbackDone) {
      const blockedReason = feedbackShownCount >= FEEDBACK_MAX_SHOWS
        ? `Limit reached (${feedbackShownCount}/${FEEDBACK_MAX_SHOWS}) — the real modal never shows again.`
        : `Sent, or "Don't ask again" was tapped — the real modal never shows again.`;
      Alert.alert("Feedback", blockedReason, [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", onPress: resetFeedback },
      ]);
      return;
    }
    showFeedbackModal();
  };

  const showNotifReminderJsonModal = () => {
    const { notifReminderNextShowAt, notifReminderShownAt, notifReminderShownCount, notifReminderDone } = useNotifReminderStore.getState();
    showJsonViewerModal("Notif Reminder", {
      notificationPermission: useDeviceSettingsStore.getState().notificationPermission,
      notifReminderNextShowAt: formatTime(notifReminderNextShowAt),
      notifReminderShownAt: formatTime(notifReminderShownAt),
      notifReminderShownCount,
      notifReminderDone,
    });
  };
  const resetNotifReminder = () => {
    useNotifReminderStore.setState({ notifReminderNextShowAt: null, notifReminderShownAt: null, notifReminderShownCount: 0, notifReminderDone: false });
  };
  const previewNotifReminderModal = () => {
    const { notifReminderShownCount, notifReminderDone } = useNotifReminderStore.getState();

    if (notifReminderDone) {
      Alert.alert("Notif Reminder", `Limit reached (${notifReminderShownCount}/${NOTIF_REMINDER_MAX_SHOWS}) — the real reminder won't show again until notifications are granted and turned off again.`, [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", onPress: resetNotifReminder },
      ]);
      return;
    }
    showNotifReminderModal();
  };

  // Main component
  return (
    <View style={[styles.box, { backgroundColor: theme.bg2, borderColor: theme.danger + "40" }]}>
      {/* Status badge — sits on the top border (page background cuts the line); taps count toward deactivating */}
      <View style={styles.statusWrap} pointerEvents="box-none">
        <TouchableOpacity activeOpacity={0.6} hitSlop={8} onPress={onStatusPress}>
          <Text style={[styles.statusBadge, { color: theme.placeholder, borderColor: theme.danger, backgroundColor: theme.bg }]}>
            {status}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.selector, { backgroundColor: theme.danger + "15" }]}
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

          {/* App: onboarding + check-for-update previews (modal + the two inline status lines) */}
          <DebugSection title="App">
            <DebugButton label="Show Onboarding Screen" color={theme.info} onPress={() => useOnboardingStore.getState().setOnboarding(false)} />
            <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />
            <DebugButton label="Show 'Update available' Modal" color={theme.green} hint={UPDATE_MODAL_HINT} onPress={openUpdateAvailableModal} />
            <DebugToggle label="Toggle 'Up to date' line" color={theme.green} value={updatePreview === "upToDate"} hint={UP_TO_DATE_HINT} onPress={() => togglePreview("upToDate")} />
            <DebugToggle label="Toggle 'Check failed' line" color={theme.green} value={updatePreview === "error"} hint={CHECK_FAILED_HINT} onPress={() => togglePreview("error")} />
            <DebugToggle label="Toggle 'Update available' On Launch" color={theme.green} value={forceUpdateOnLaunch} hint={UPDATE_LAUNCH_HINT} onPress={toggleUpdateOnLaunch} />
          </DebugSection>

          {/* Prayers */}
          <DebugSection title="Prayers">
            <DebugToggle label="Toggle No Prayer Times (Fresh Install)" value={forceNoPrayerTimes} hint={NO_PRAYER_TIMES_HINT} onPress={toggleNoPrayerTimes} />
            <DebugToggle label="Toggle Outdated Prayer Times" value={forcePrayersOutdated} hint={OUTDATED_HINT} onPress={togglePrayersOutdated} />
            <DebugToggle label="Toggle Location Changed" value={forceLocationChange} hint={LOCATION_CHANGED_HINT} onPress={toggleLocationChange} />
            <DebugToggle label="Toggle Friday Badge" value={forceFriday} onPress={toggleFriday} />
            <DebugButton label="Show 'Prayer' Celebration Modal" color={theme.teal} hint={PRAYER_CELEBRATION_HINT} onPress={previewPrayerCelebrationModal} />
            <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />
            <DebugButton label="Show 'Prayer Times' JSON" color={theme.gray} onPress={showPrayerTimesModal} />
            <DebugButton label="Show 'Prayer Tracking' JSON" color={theme.gray} onPress={showPrayerTrackingModal} />
          </DebugSection>

          {/* Quran */}
          <DebugSection title="Quran">
            <DebugToggle label="Toggle Quran Now-Playing" value={forceQuranPlaying} onPress={toggleQuranPlaying} />
            <DebugButton label="Show 'Khatam' Celebration Modal" color={theme.teal} hint={KHATAM_HINT} onPress={previewKhatamCelebrationModal} />
            <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />
            <DebugButton label="Show 'Quran' JSON" color={theme.gray} onPress={showQuranModal} />
          </DebugSection>

          {/* Islamic Holidays */}
          <DebugSection title="Islamic Holidays">
            <DebugToggle label="Toggle Holiday Card" value={forceHoliday} hint={HOLIDAY_CARD_HINT} onPress={toggleHoliday} />
            <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />
            <DebugButton label="Show 'Islamic Holidays' JSON" color={theme.gray} onPress={showHolidaysModal} />
          </DebugSection>

          {/* Auto modals — one card, a block per modal */}
          <DebugSection title="Auto Modals">
            <AutoModalHead title="Rate App" hint={RATE_APP_HINT} />
            <DebugButton label="Show 'Rate App' Modal" color={theme.teal} onPress={previewRateAppModal} />
            <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />
            <DebugButton label="Show 'Rate App' JSON" color={theme.gray} onPress={showRateAppJsonModal} />

            <View style={[styles.blockSeparator, { backgroundColor: theme.bg2 }]} />

            <AutoModalHead title="Feedback" hint={FEEDBACK_HINT} />
            <DebugButton label="Show 'Feedback' Modal" color={theme.teal} onPress={previewFeedbackModal} />
            <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />
            <DebugButton label="Show 'Feedback' JSON" color={theme.gray} onPress={showFeedbackJsonModal} />

            <View style={[styles.blockSeparator, { backgroundColor: theme.bg2 }]} />

            <AutoModalHead title="Notif Reminder" hint={NOTIF_REMINDER_HINT} />
            <DebugButton label="Show 'Notif Reminder' Modal" color={theme.teal} onPress={previewNotifReminderModal} />
            <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />
            <DebugButton label="Show 'Notif Reminder' JSON" color={theme.gray} onPress={showNotifReminderJsonModal} />
          </DebugSection>

          {/* Test notifications */}
          <DebugSection title="Notifications">
            <DebugButton label="Test Prayer Not." color={theme.orange} onPress={() => debugPrayerN(notifParams)} right={notifSecondsBadge} />
            <DebugButton label="Test Prayer Event Not." color={theme.orange} onPress={() => debugEventN(notifParams)} right={notifSecondsBadge} />
            <DebugButton label="Test Prayer Reminder Not." color={theme.orange} onPress={() => debugPrayerReminderN(notifParams)} right={notifSecondsBadge} />
            <DebugButton label="Test Friday Not." color={theme.orange} onPress={() => debugFridayN(notifParams)} right={notifSecondsBadge} />
            <DebugButton label="Test Islamic Holiday Not." color={theme.orange} onPress={() => debugHolidayN(notifParams)} right={notifSecondsBadge} />
            <DebugButton label="Test Daily Quote Not." color={theme.orange} onPress={() => debugDailyQuoteN(notifParams)} right={notifSecondsBadge} />
            <DebugButton label="Log Channels & Scheduled" color={theme.orange} onPress={logScheduledN} />
            <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />
            <DebugButton label="Show 'Scheduled Notifications' JSON" color={theme.gray} onPress={showScheduledNModal} />
          </DebugSection>

        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Own bordered box — sets the panel apart from the About content
  // paddingTop leaves room for the badge that overlaps the top border
  box: {
    marginHorizontal: 14,
    borderWidth: 1,
    borderRadius: 16,
    padding: 8,
    paddingTop: 22,
  },
  statusWrap: {
    position: "absolute",
    top: -13,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: "500",
    includeFontPadding: false,
    overflow: "hidden",
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectorIcon: {
    marginRight: 10,
  },
  selectorText: {
    fontSize: 17,
    flex: 1,
  },
  body: {
    gap: 16,
    marginTop: 16,
    marginBottom: 6,
  },

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
  blockSeparator: {
    height: 3,
    marginHorizontal: -8,
    marginVertical: 6,
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

  divider: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
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
