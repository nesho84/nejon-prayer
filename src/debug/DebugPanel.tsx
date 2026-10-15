import { openUpdateAvailableModal } from "@/components/CheckForUpdate";
import { MAX_SHOWS, showNotifReminderModal } from "@/components/NotifReminder";
import { showRateAppModal } from "@/components/RateApp";
import { UpdatePreview, useDebugStore } from "@/debug/debugStore";
import { useDeviceSettingsStore } from "@/store/deviceSettingsStore";
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
import Constants from "expo-constants";
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

interface JsonViewerProps {
  json: string;
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

// Renders the debug controls only — the containing AppCard + "Debug Tools"
export default function DebugPanel() {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const language = useLanguageStore((state) => state.language);
  const location = useLocationStore((state) => state.location);
  const notifSettings = useNotificationsStore((state) => state.notifSettings);

  // Debug toggles (force scenario-gated UI: holiday card, Friday badge, Quran now-playing,
  // outdated prayer times warning, location changed warning)
  const forceHoliday = useDebugStore((state) => state.forceHoliday);
  const forceFriday = useDebugStore((state) => state.forceFriday);
  const forceQuranPlaying = useDebugStore((state) => state.forceQuranPlaying);
  const forcePrayersOutdated = useDebugStore((state) => state.forcePrayersOutdated);
  const forceLocationChange = useDebugStore((state) => state.forceLocationChange);
  const forceUpdateOnLaunch = useDebugStore((state) => state.forceUpdateOnLaunch);
  const toggleHoliday = useDebugStore((state) => state.toggleHoliday);
  const toggleFriday = useDebugStore((state) => state.toggleFriday);
  const toggleQuranPlaying = useDebugStore((state) => state.toggleQuranPlaying);
  const togglePrayersOutdated = useDebugStore((state) => state.togglePrayersOutdated);
  const toggleLocationChange = useDebugStore((state) => state.toggleLocationChange);
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

  const showRateAppJsonModal = () => {
    const { rateAppDone, rateAppVersion, rateAppRemindAt } = useRateAppStore.getState();
    showJsonViewerModal("Rate App", {
      version: Constants?.expoConfig?.version,
      rateAppDone,
      rateAppVersion,
      rateAppRemindAt: rateAppRemindAt ? new Date(rateAppRemindAt).toLocaleString("en-GB") : null,
    });
  };
  // Always shows — ignores the platform and waits; a stored choice that blocks it gets an alert with Reset
  const previewRateAppModal = () => {
    const { rateAppDone, rateAppVersion, setRateAppDone, setRateAppVersion, setRateAppRemindAt } = useRateAppStore.getState();
    const version = Constants?.expoConfig?.version ?? null;
    const blockedReason = rateAppDone
      ? `"Already rated" was tapped — the real modal never shows again.`
      : rateAppVersion === version
        ? `"Open Store" was tapped on this version (${version}) — the real modal waits for the next version.`
        : null;

    if (blockedReason) {
      Alert.alert("Rate App", blockedReason, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: () => {
            setRateAppDone(false);
            setRateAppVersion(null);
            setRateAppRemindAt(null);
          },
        },
      ]);
      return;
    }
    showRateAppModal();
  };

  const showNotifReminderJsonModal = () => {
    const { notifReminderAt, notifReminderCount } = useNotifReminderStore.getState();
    showJsonViewerModal("Notif Reminder", {
      notificationPermission: useDeviceSettingsStore.getState().notificationPermission,
      notifReminderAt: notifReminderAt ? new Date(notifReminderAt).toLocaleString("en-GB") : null,
      notifReminderCount,
    });
  };
  // Always shows — ignores permission and waits; closes still count, so the 4th tap hits the limit
  const previewNotifReminderModal = () => {
    const { notifReminderCount, setNotifReminderAt, setNotifReminderCount } = useNotifReminderStore.getState();

    if (notifReminderCount >= MAX_SHOWS) {
      Alert.alert("Notif Reminder", `Limit reached (${notifReminderCount}/${MAX_SHOWS}) — the real reminder won't show again until notifications are granted and turned off again.`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: () => {
            setNotifReminderAt(null);
            setNotifReminderCount(0);
          },
        },
      ]);
      return;
    }
    showNotifReminderModal();
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
          <DebugButton label="Show 'Rate the App' Modal" color={theme.teal} onPress={previewRateAppModal} />
          <DebugButton label="Show 'Notif Reminder' Modal" color={theme.teal} onPress={previewNotifReminderModal} />

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
          <DebugToggle label="Toggle Outdated Prayer Times" value={forcePrayersOutdated} onPress={togglePrayersOutdated} />
          <DebugToggle label="Toggle Location Changed" value={forceLocationChange} onPress={toggleLocationChange} />

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />

          {/* Test Notifications */}
          <DebugButton label="Test Prayer Not." color={theme.orange} onPress={() => debugPrayerN(notifParams)} right={notifSecondsBadge} />
          <DebugButton label="Test Prayer Event Not." color={theme.orange} onPress={() => debugEventN(notifParams)} right={notifSecondsBadge} />
          <DebugButton label="Test Prayer Reminder Not." color={theme.orange} onPress={() => debugPrayerReminderN(notifParams)} right={notifSecondsBadge} />
          <DebugButton label="Test Friday Not." color={theme.orange} onPress={() => debugFridayN(notifParams)} right={notifSecondsBadge} />
          <DebugButton label="Test Islamic Holiday Not." color={theme.orange} onPress={() => debugHolidayN(notifParams)} right={notifSecondsBadge} />
          <DebugButton label="Test Daily Quote Not." color={theme.orange} onPress={() => debugDailyQuoteN(notifParams)} right={notifSecondsBadge} />
          <DebugButton label="Log Channels & Scheduled" color={theme.orange} onPress={logScheduledN} />

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />

          {/* JSON data in full screen modals */}
          <DebugButton label="Show 'Prayer Times - JSON' Modal" color={theme.gray} onPress={showPrayerTimesModal} />
          <DebugButton label="Show 'Prayer Tracking - JSON' Modal" color={theme.gray} onPress={showPrayerTrackingModal} />
          <DebugButton label="Show 'Scheduled Notifications - JSON' Modal" color={theme.gray} onPress={showScheduledNModal} />
          <DebugButton label="Show 'Islamic Holidays - JSON' Modal" color={theme.gray} onPress={showHolidaysModal} />
          <DebugButton label="Show 'Quran - JSON' Modal" color={theme.gray} onPress={showQuranModal} />
          <DebugButton label="Show 'Rate App - JSON' Modal" color={theme.gray} onPress={showRateAppJsonModal} />
          <DebugButton label="Show 'Notif Reminder - JSON' Modal" color={theme.gray} onPress={showNotifReminderJsonModal} />

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
