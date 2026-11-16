import { StoreUpdatePreview, useDebugStore } from "@/debug/debugStore";
import { useHolidaysStore } from "@/store/holidaysStore";
import { useLanguageStore } from "@/store/languageStore";
import { useLocationStore } from "@/store/locationStore";
import { useNotificationsStore } from "@/store/notificationsStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { usePrayersStore } from "@/store/prayersStore";
import { usePrayersTrackingStore } from "@/store/prayersTrackingStore";
import { useQuranStore } from "@/store/quranStore";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons } from "@react-native-vector-icons/ionicons/static";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons/static";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  previewFeedbackModal,
  previewKhatamCelebrationModal,
  previewNotifReminderModal,
  previewPrayerCelebrationModal,
  previewRateAppModal,
  previewStoreUpdateModal,
  showAutoModalsJsonModal,
} from "./debugModals";
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
import {
  Badge,
  CHECK_FAILED_HINT,
  DebugButton,
  DebugSection,
  DebugToggle,
  FEEDBACK_HINT,
  HOLIDAY_CARD_HINT,
  KHATAM_HINT,
  LOCATION_CHANGED_HINT,
  NO_PRAYER_TIMES_HINT,
  NOTIF_REMINDER_HINT,
  OUTDATED_HINT,
  PRAYER_CELEBRATION_HINT,
  RATE_APP_HINT,
  showJsonViewerModal,
  UP_TO_DATE_HINT,
  STORE_UPDATE_HINT,
  STORE_UPDATE_LAUNCH_HINT,
} from "./debugUi";

interface DebugPanelProps {
  status: string;
  onStatusPress: () => void;
}

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
  const forceStoreUpdateOnLaunch = useDebugStore((state) => state.forceStoreUpdateOnLaunch);
  const toggleHoliday = useDebugStore((state) => state.toggleHoliday);
  const toggleFriday = useDebugStore((state) => state.toggleFriday);
  const toggleQuranPlaying = useDebugStore((state) => state.toggleQuranPlaying);
  const togglePrayersOutdated = useDebugStore((state) => state.togglePrayersOutdated);
  const toggleLocationChange = useDebugStore((state) => state.toggleLocationChange);
  const toggleNoPrayerTimes = useDebugStore((state) => state.toggleNoPrayerTimes);
  const toggleStoreUpdateOnLaunch = useDebugStore((state) => state.toggleStoreUpdateOnLaunch);
  const storeUpdatePreview = useDebugStore((state) => state.storeUpdatePreview);
  const setStoreUpdatePreview = useDebugStore((state) => state.setStoreUpdatePreview);
  const expanded = useDebugStore((state) => state.debugPanelExpanded);
  const toggleDebugPanel = useDebugStore((state) => state.toggleDebugPanel);

  // Shared params and handlers
  const notifSeconds = 10; // seconds until the test notification fires
  const notifParams = { options: { language, location, hasAlarm: true }, notifSettings, notifSeconds };
  const notifSecondsBadge = <Badge label={`${notifSeconds}s`} color={theme.placeholder} bg={theme.overlay} />;
  const togglePreview = (value: StoreUpdatePreview) => setStoreUpdatePreview(storeUpdatePreview === value ? "idle" : value);
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
        onPress={toggleDebugPanel}
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

          {/* App */}
          <DebugSection title="App">
            <DebugButton label="Show Onboarding Screen" color={theme.info} onPress={() => useOnboardingStore.getState().setOnboarding(false)} />
          </DebugSection>

          {/* Prayers */}
          <DebugSection title="Prayers">
            <DebugToggle color={theme.teal} label="Toggle No Prayer Times (Fresh Install)" value={forceNoPrayerTimes} hint={NO_PRAYER_TIMES_HINT} onPress={toggleNoPrayerTimes} />
            <DebugToggle color={theme.teal} label="Toggle Outdated Prayer Times" value={forcePrayersOutdated} hint={OUTDATED_HINT} onPress={togglePrayersOutdated} />
            <DebugToggle color={theme.teal} label="Toggle Location Changed" value={forceLocationChange} hint={LOCATION_CHANGED_HINT} onPress={toggleLocationChange} />
            <DebugToggle color={theme.teal} label="Toggle Friday Badge" value={forceFriday} onPress={toggleFriday} />
            <DebugButton label="Show 'Prayer' Celebration Modal" color={theme.teal} hint={PRAYER_CELEBRATION_HINT} onPress={previewPrayerCelebrationModal} />
            <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />
            <DebugButton label="Show 'Prayer Times' JSON" color={theme.gray} onPress={showPrayerTimesModal} />
            <DebugButton label="Show 'Prayer Tracking' JSON" color={theme.gray} onPress={showPrayerTrackingModal} />
          </DebugSection>

          {/* Quran */}
          <DebugSection title="Quran">
            <DebugToggle color={theme.secondary} label="Toggle Quran Now-Playing" value={forceQuranPlaying} onPress={toggleQuranPlaying} />
            <DebugButton label="Show 'Khatam' Celebration Modal" color={theme.secondary} hint={KHATAM_HINT} onPress={previewKhatamCelebrationModal} />
            <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />
            <DebugButton label="Show 'Quran' JSON" color={theme.gray} onPress={showQuranModal} />
          </DebugSection>

          {/* Islamic Holidays */}
          <DebugSection title="Islamic Holidays">
            <DebugToggle color={theme.gold} label="Toggle Holiday Card" value={forceHoliday} hint={HOLIDAY_CARD_HINT} onPress={toggleHoliday} />
            <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />
            <DebugButton label="Show 'Islamic Holidays' JSON" color={theme.gray} onPress={showHolidaysModal} />
          </DebugSection>

          {/* Update Check: Settings "Check for update" status lines + update on launch */}
          <DebugSection title="Update Check">
            <DebugToggle label="Toggle 'Up to date' line" color={theme.green} value={storeUpdatePreview === "upToDate"} hint={UP_TO_DATE_HINT} onPress={() => togglePreview("upToDate")} />
            <DebugToggle label="Toggle 'Check failed' line" color={theme.green} value={storeUpdatePreview === "error"} hint={CHECK_FAILED_HINT} onPress={() => togglePreview("error")} />
            <DebugToggle label="Toggle 'Update available' On Launch" color={theme.green} value={forceStoreUpdateOnLaunch} hint={STORE_UPDATE_LAUNCH_HINT} onPress={toggleStoreUpdateOnLaunch} />
          </DebugSection>

          {/* Auto modals — a preview each, one JSON for their shared store */}
          <DebugSection title="Auto Modals">
            <DebugButton label="Show 'Store Update' Modal" color={theme.violet} hint={STORE_UPDATE_HINT} onPress={previewStoreUpdateModal} />
            <DebugButton label="Show 'Notif Reminder' Modal" color={theme.violet} hint={NOTIF_REMINDER_HINT} onPress={previewNotifReminderModal} />
            <DebugButton label="Show 'Rate App' Modal" color={theme.violet} hint={RATE_APP_HINT} onPress={previewRateAppModal} />
            <DebugButton label="Show 'Feedback' Modal" color={theme.violet} hint={FEEDBACK_HINT} onPress={previewFeedbackModal} />
            <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />
            <DebugButton label="Show 'Auto Modals' JSON" color={theme.gray} onPress={showAutoModalsJsonModal} />
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
    paddingHorizontal: 10,
    paddingTop: 24,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
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
    gap: 16,
    marginTop: 16,
  },


  divider: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
});
