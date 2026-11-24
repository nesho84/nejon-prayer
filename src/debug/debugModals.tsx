import { showFeedbackModal } from "@/components/FeedbackModal";
import { showNotifReminderModal } from "@/components/NotifReminderModal";
import { showStoreReviewModal } from "@/components/StoreReviewModal";
import { showStoreUpdateModal } from "@/components/StoreUpdateModal";
import { APPLE_STORE_URL, GOOGLE_PLAY_URL } from "@/constants/links";
import { globalStyles } from "@/constants/styles";
import { PRAYER_CELEBRATIONS_TR } from "@/constants/translations/celebrations.tr";
import { HOLIDAYS_TR } from "@/constants/translations/holidays.tr";
import { NOTIF_REMINDER_MAX_SHOWS, STORE_REVIEW_MAX_SHOWS, useAutoModalsStore } from "@/store/autoModalsStore";
import { useDeviceSettingsStore } from "@/store/deviceSettingsStore";
import { useLanguageStore } from "@/store/languageStore";
import { useModalStore } from "@/store/modalStore";
import { useThemeStore } from "@/store/themeStore";
import { HolidayName } from "@/types/holiday.types";
import { shareText } from "@/utils/system";
import { Ionicons } from "@react-native-vector-icons/ionicons/static";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons/static";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";
import { showJsonViewerModal } from "./debugUi";

// ------------------------------------------------------------
// Modal previews — celebrations and holiday info, the auto modals (one JSON for their shared store, a preview + reset each), then Feedback.
// Auto-modal previews count like a real show and skip the waits; a block gets an alert with Reset
// (for Store Update, which never stops, the 3-day wait is the block).
// ------------------------------------------------------------

// Timestamp → readable date for the JSON viewers
export const formatTime = (time: number | null) => (time ? new Date(time).toLocaleString("en-GB") : null);

// ------------------------------------------------------------
// Debug utility: preview a prayer-complete celebration (random localized)
// (mirrors the modal in src/components/PrayersList.tsx, minus the tracking logic)
// ------------------------------------------------------------
export function previewPrayerCelebrationModal() {
  const theme = useThemeStore.getState().theme;
  const language = useLanguageStore.getState().language;
  const variants = PRAYER_CELEBRATIONS_TR[language] ?? PRAYER_CELEBRATIONS_TR["en"];
  const variant = variants[Math.floor(Math.random() * variants.length)];

  useModalStore.getState().show({
    type: "alert",
    celebrationAnimation: true,
    component: (
      <View style={globalStyles.bannerContainer}>
        <Text style={globalStyles.bannerEmoji}>{variant.emoji}</Text>
        <Text style={[globalStyles.bannerTitle, { color: theme.text }]}>{variant.title}</Text>
        <Text style={[globalStyles.bannerMessage, { color: theme.textMuted }]}>{variant.message}</Text>
      </View>
    ),
    buttons: [{
      label: "OK",
      action: "ok",
      buttonStyle: { backgroundColor: theme.accentLight, borderWidth: 1, borderColor: theme.borderGold },
      labelStyle: { fontSize: 16, fontWeight: "600", color: theme.accent },
    }],
  });
}

// ------------------------------------------------------------
// Debug utility: preview the khatam-complete celebration
// (mirrors the modal in src/app/quran/ayahs.tsx 1:1, minus completeKhatam)
// ------------------------------------------------------------
export function previewKhatamCelebrationModal() {
  const theme = useThemeStore.getState().theme;
  const tr = useLanguageStore.getState().tr;

  useModalStore.getState().show({
    type: "alert",
    component: (
      <View style={globalStyles.bannerContainer}>
        <Text style={globalStyles.bannerEmoji}>📖</Text>
        <Text style={[globalStyles.bannerTitle, { color: theme.text }]}>{tr.labels.khatamCompleteTitle}</Text>
        <Text style={[globalStyles.bannerMessage, { color: theme.textMuted }]}>{tr.labels.khatamCompleteMessage}</Text>
      </View>
    ),
    buttons: [
      {
        label: "OK",
        action: "ok",
        buttonStyle: { backgroundColor: theme.overlay },
        labelStyle: { fontSize: 16, fontWeight: "600", color: theme.text2 },
      },
      {
        label: tr.buttons.share,
        action: "share",
        icon: <Ionicons name="share-social-outline" size={17} color={theme.islamicGreen} />,
        onPress: async () => {
          const storeUrl = Platform.OS === "ios" ? APPLE_STORE_URL : GOOGLE_PLAY_URL;
          await shareText(tr.labels.khatamShareTitle, `${tr.labels.khatamShareMessage}\n\n${tr.labels.khatamShareVia}\n${storeUrl}`);
        },
        buttonStyle: { backgroundColor: `${theme.islamicGreen}20`, borderWidth: 1, borderColor: `${theme.islamicGreen}40` },
        labelStyle: { fontSize: 16, fontWeight: "600", color: theme.islamicGreen },
      }
    ],
    celebrationAnimation: true,
  });
}

// ------------------------------------------------------------
// Debug utility: preview a holiday info modal (random holiday)
// (mirrors showInfo in src/components/HolidaysCard.tsx)
// ------------------------------------------------------------
export function previewHolidayInfoModal() {
  const theme = useThemeStore.getState().theme;
  const language = useLanguageStore.getState().language;
  const holidaysTr = HOLIDAYS_TR[language] ?? HOLIDAYS_TR.en;
  const names = Object.keys(holidaysTr.holidays) as HolidayName[];
  const holidayTr = holidaysTr.holidays[names[Math.floor(Math.random() * names.length)]];

  useModalStore.getState().show({
    type: "alert",
    component: (
      <View style={globalStyles.bannerContainer}>
        <View style={[styles.modalIconCircle, { backgroundColor: theme.accentLight }]}>
          <MaterialDesignIcons name="information-variant-circle" size={40} color={theme.accent} />
        </View>
        <Text style={[globalStyles.bannerTitle, { color: theme.text }]}>{holidayTr.name}</Text>
        <Text style={[globalStyles.bannerMessage, { color: theme.textMuted }]}>{holidayTr.info}</Text>
      </View>
    ),
    buttons: [{
      label: "OK",
      action: "ok",
      buttonStyle: { backgroundColor: theme.accentLight, borderWidth: 1, borderColor: theme.borderGold },
      labelStyle: { fontSize: 16, fontWeight: "600", color: theme.accent },
    }],
  });
}

// ------------------------------------------------------------
// Auto modals — one JSON for the whole store, in launch order
// ------------------------------------------------------------
export function showAutoModalsJsonModal() {
  const state = useAutoModalsStore.getState();
  showJsonViewerModal("Auto Modals", {
    storeUpdateNextShowAt: formatTime(state.storeUpdateNextShowAt),
    storeUpdateShownAt: formatTime(state.storeUpdateShownAt),
    storeUpdateShownCount: state.storeUpdateShownCount,
    storeUpdateCheckedAt: formatTime(state.storeUpdateCheckedAt),
    storeUpdateCheckResult: state.storeUpdateCheckResult,
    notificationPermission: useDeviceSettingsStore.getState().notificationPermission,
    notifReminderNextShowAt: formatTime(state.notifReminderNextShowAt),
    notifReminderShownAt: formatTime(state.notifReminderShownAt),
    notifReminderShownCount: state.notifReminderShownCount,
    notifReminderDone: state.notifReminderDone,
    storeReviewNextShowAt: formatTime(state.storeReviewNextShowAt),
    storeReviewShownAt: formatTime(state.storeReviewShownAt),
    storeReviewShownCount: state.storeReviewShownCount,
    storeReviewDone: state.storeReviewDone,
  });
}

// ------------------------------------------------------------
// Store Update
// ------------------------------------------------------------
function resetStoreUpdate() {
  useAutoModalsStore.getState().setAutoModals({
    storeUpdateNextShowAt: null,
    storeUpdateShownAt: null,
    storeUpdateShownCount: 0,
    storeUpdateCheckedAt: null,
    storeUpdateCheckResult: null,
  });
}

export function previewStoreUpdateModal() {
  const { storeUpdateNextShowAt, storeUpdateShownCount } = useAutoModalsStore.getState();

  if (storeUpdateNextShowAt && Date.now() < storeUpdateNextShowAt) {
    Alert.alert("Store Update", `Shown ${storeUpdateShownCount} times — the real modal waits until ${formatTime(storeUpdateNextShowAt)}.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", onPress: resetStoreUpdate },
    ]);
    return;
  }
  showStoreUpdateModal();
}

// ------------------------------------------------------------
// Notif Reminder
// ------------------------------------------------------------
function resetNotifReminder() {
  useAutoModalsStore.getState().setAutoModals({
    notifReminderNextShowAt: null,
    notifReminderShownAt: null,
    notifReminderShownCount: 0,
    notifReminderDone: false,
  });
}

export function previewNotifReminderModal() {
  const { notifReminderShownCount, notifReminderDone } = useAutoModalsStore.getState();

  if (notifReminderDone) {
    Alert.alert("Notif Reminder", `Limit reached (${notifReminderShownCount}/${NOTIF_REMINDER_MAX_SHOWS}) — the real reminder won't show again until notifications are granted and turned off again.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", onPress: resetNotifReminder },
    ]);
    return;
  }
  showNotifReminderModal();
}

// ------------------------------------------------------------
// Store Review
// ------------------------------------------------------------
function resetStoreReview() {
  useAutoModalsStore.getState().setAutoModals({ storeReviewNextShowAt: null, storeReviewShownAt: null, storeReviewShownCount: 0, storeReviewDone: false });
}

export function previewStoreReviewModal() {
  const { storeReviewShownCount, storeReviewDone } = useAutoModalsStore.getState();

  if (storeReviewDone) {
    const blockedReason = storeReviewShownCount >= STORE_REVIEW_MAX_SHOWS
      ? `Limit reached (${storeReviewShownCount}/${STORE_REVIEW_MAX_SHOWS}) — the real modal never shows again.`
      : `"Open Store" or "Already rated" was tapped — the real modal never shows again.`;
    Alert.alert("Store Review", blockedReason, [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", onPress: resetStoreReview },
    ]);
    return;
  }
  showStoreReviewModal();
}

// ------------------------------------------------------------
// Feedback — not an auto modal, opens from About
// ------------------------------------------------------------
export function previewFeedbackModal() {
  showFeedbackModal();
}

// Thank-you step only
export function previewFeedbackThanks() {
  showFeedbackModal(true);
}

const styles = StyleSheet.create({
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
