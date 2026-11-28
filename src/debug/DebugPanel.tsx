import { StoreUpdatePreview, SupporterPreview, useDebugStore } from "@/debug/debugStore";
import { useHolidaysStore } from "@/store/holidaysStore";
import { useLanguageStore } from "@/store/languageStore";
import { useLocationStore } from "@/store/locationStore";
import { useNotificationsStore } from "@/store/notificationsStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { usePrayersStore } from "@/store/prayersStore";
import { usePrayersTrackingStore } from "@/store/prayersTrackingStore";
import { useQuranStore } from "@/store/quranStore";
import { useSupporterStore } from "@/store/supporterStore";
import { useThemeStore } from "@/store/themeStore";
import { StyleSheet, View } from "react-native";
import {
  formatTime,
  previewFeedbackModal,
  previewFeedbackThanks,
  previewHolidayInfoModal,
  previewKhatamCelebrationModal,
  previewNotifReminderModal,
  previewPrayerCelebrationModal,
  previewStoreReviewModal,
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
  HOLIDAY_INFO_HINT,
  KHATAM_HINT,
  LOCATION_CHANGED_HINT,
  NO_PRAYER_TIMES_HINT,
  NOTIF_REMINDER_HINT,
  OUTDATED_HINT,
  PRAYER_CELEBRATION_HINT,
  STORE_REVIEW_HINT,
  FEEDBACK_THANKS_HINT,
  SUPPORTER_BANNER_HINT,
  SUPPORTER_GIFT_HINT,
  SUPPORTER_PREVIEW_HINT,
  showJsonViewerModal,
  UP_TO_DATE_HINT,
  STORE_UPDATE_HINT,
  STORE_UPDATE_LAUNCH_HINT,
} from "./debugUi";

// Debug tools list — shown in the debug sheet ((modals)/debugTools), opened by DebugTab from any screen
export default function DebugPanel() {
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
  const supporterPreview = useDebugStore((state) => state.supporterPreview);
  const setSupporterPreview = useDebugStore((state) => state.setSupporterPreview);
  const forceSupporterGift = useDebugStore((state) => state.forceSupporterGift);
  const toggleSupporterGift = useDebugStore((state) => state.toggleSupporterGift);
  const forceSupporterBanner = useDebugStore((state) => state.forceSupporterBanner);
  const toggleSupporterBanner = useDebugStore((state) => state.toggleSupporterBanner);

  // Shared params and handlers
  const notifSeconds = 10; // seconds until the test notification fires
  const notifParams = { options: { language, location, hasAlarm: true }, notifSettings, notifSeconds };
  const notifSecondsBadge = <Badge label={`${notifSeconds}s`} color={theme.placeholder} bg={theme.overlay} />;
  const togglePreview = (value: StoreUpdatePreview) => setStoreUpdatePreview(storeUpdatePreview === value ? "idle" : value);
  const toggleSupporterPreview = (value: SupporterPreview) => setSupporterPreview(supporterPreview === value ? "idle" : value);
  const showSupporterModal = () => {
    const { isSupporter, supporterSince, unlockPending, giftPending, lastGiftAt, lastKnownPrices, playStatus } =
      useSupporterStore.getState();
    showJsonViewerModal("Supporter", {
      isSupporter,
      supporterSince: formatTime(supporterSince),
      unlockPending,
      giftPending,
      lastGiftAt: formatTime(lastGiftAt),
      lastKnownPrices,
      playStatus,
    });
  };
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
        <DebugButton label="Show 'Holiday' Info Modal" color={theme.gold} hint={HOLIDAY_INFO_HINT} onPress={previewHolidayInfoModal} />
        <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />
        <DebugButton label="Show 'Islamic Holidays' JSON" color={theme.gray} onPress={showHolidaysModal} />
      </DebugSection>

      {/* Store Update: Settings "Check for update" status lines + update on launch */}
      <DebugSection title="Store Update">
        <DebugToggle label="Toggle 'Up to date' line" color={theme.green} value={storeUpdatePreview === "upToDate"} hint={UP_TO_DATE_HINT} onPress={() => togglePreview("upToDate")} />
        <DebugToggle label="Toggle 'Check failed' line" color={theme.green} value={storeUpdatePreview === "error"} hint={CHECK_FAILED_HINT} onPress={() => togglePreview("error")} />
        <DebugToggle label="Toggle 'Update available' On Launch" color={theme.green} value={forceStoreUpdateOnLaunch} hint={STORE_UPDATE_LAUNCH_HINT} onPress={toggleStoreUpdateOnLaunch} />
      </DebugSection>

      {/* Feedback: opens from About, not an auto modal */}
      <DebugSection title="Feedback">
        <DebugButton label="Show 'Feedback' Modal" color={theme.primary} hint={FEEDBACK_HINT} onPress={previewFeedbackModal} />
        <DebugButton label="Show 'Feedback' Modal Thank-you Step" color={theme.primary} hint={FEEDBACK_THANKS_HINT} onPress={previewFeedbackThanks} />
      </DebugSection>

      {/* Supporter: fake values for the support screens only */}
      <DebugSection title="Supporter (Play Billing)">
        <DebugToggle label="Toggle 'Can buy' state" color={theme.pink} value={supporterPreview === "canBuy"} hint={SUPPORTER_PREVIEW_HINT} onPress={() => toggleSupporterPreview("canBuy")} />
        <DebugToggle label="Toggle 'Payment pending' state" color={theme.pink} value={supporterPreview === "pending"} hint={SUPPORTER_PREVIEW_HINT} onPress={() => toggleSupporterPreview("pending")} />
        <DebugToggle label="Toggle 'Play unreachable' state" color={theme.pink} value={supporterPreview === "unreachable"} hint={SUPPORTER_PREVIEW_HINT} onPress={() => toggleSupporterPreview("unreachable")} />
        <DebugToggle label="Toggle 'Gift pending' state" color={theme.pink} value={supporterPreview === "giftPending"} hint={SUPPORTER_PREVIEW_HINT} onPress={() => toggleSupporterPreview("giftPending")} />
        <DebugToggle label="Toggle 'Supporter' state" color={theme.pink} value={supporterPreview === "supporter"} hint={SUPPORTER_PREVIEW_HINT} onPress={() => toggleSupporterPreview("supporter")} />
        <DebugToggle label="Toggle 'Gift received' line" color={theme.pink} value={forceSupporterGift} hint={SUPPORTER_GIFT_HINT} onPress={toggleSupporterGift} />
        <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />
        <DebugToggle label="Toggle Supporter Banner" color={theme.pink} value={forceSupporterBanner} hint={SUPPORTER_BANNER_HINT} onPress={toggleSupporterBanner} />
        <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />
        <DebugButton label="Show 'Supporter' JSON" color={theme.gray} onPress={showSupporterModal} />
      </DebugSection>

      {/* Auto modals — a preview each, one JSON for their shared store */}
      <DebugSection title="Auto Modals">
        <DebugButton label="Show 'Store Update' Modal" color={theme.violet} hint={STORE_UPDATE_HINT} onPress={previewStoreUpdateModal} />
        <DebugButton label="Show 'Notif Reminder' Modal" color={theme.violet} hint={NOTIF_REMINDER_HINT} onPress={previewNotifReminderModal} />
        <DebugButton label="Show 'Store Review' Modal" color={theme.violet} hint={STORE_REVIEW_HINT} onPress={previewStoreReviewModal} />
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
  );
}

const styles = StyleSheet.create({
  body: {
    gap: 16,
    paddingHorizontal: 6,
  },
  divider: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
});
