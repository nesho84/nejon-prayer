import { showFeedbackModal } from "@/components/FeedbackModal";
import { showNotifReminderModal } from "@/components/NotifReminderModal";
import { showRateAppModal } from "@/components/RateAppModal";
import { showUpdateModal } from "@/components/UpdateModal";
import { APPLE_STORE_URL, GOOGLE_PLAY_URL } from "@/constants/links";
import { globalStyles } from "@/constants/styles";
import { PRAYER_CELEBRATIONS_TR } from "@/constants/translations/celebrations.tr";
import { FEEDBACK_MAX_SHOWS, NOTIF_REMINDER_MAX_SHOWS, RATE_APP_MAX_SHOWS, useAutoModalsStore } from "@/store/autoModalsStore";
import { useDeviceSettingsStore } from "@/store/deviceSettingsStore";
import { useLanguageStore } from "@/store/languageStore";
import { useModalStore } from "@/store/modalStore";
import { useThemeStore } from "@/store/themeStore";
import { shareText } from "@/utils/system";
import { Ionicons } from "@react-native-vector-icons/ionicons/static";
import { Alert, Platform, Text, View } from "react-native";
import { showJsonViewerModal } from "./debugUi";

// ------------------------------------------------------------
// Modal previews — celebrations, then the auto modals (the same three parts each: JSON, preview, reset).
// Auto-modal previews count like a real show and skip the waits; a block gets an alert with Reset
// (for Update, which never stops, the 3-day wait is the block).
// ------------------------------------------------------------

// Timestamp → readable date for the JSON viewers
const formatTime = (time: number | null) => (time ? new Date(time).toLocaleString("en-GB") : null);

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
        <Text style={[globalStyles.bannerTitle, { color: theme.text2 }]}>{variant.title}</Text>
        <Text style={[globalStyles.bannerMessage, { color: theme.textMuted }]}>{variant.message}</Text>
      </View>
    ),
    buttons: [{
      label: "OK",
      action: "ok",
      buttonStyle: { backgroundColor: theme.accentLight, borderWidth: 1, borderColor: theme.divider2 },
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
        <Text style={[globalStyles.bannerTitle, { color: theme.text2 }]}>{tr.labels.khatamCompleteTitle}</Text>
        <Text style={[globalStyles.bannerMessage, { color: theme.textMuted }]}>{tr.labels.khatamCompleteMessage}</Text>
      </View>
    ),
    buttons: [
      {
        label: tr.buttons.share,
        action: "share",
        icon: <Ionicons name="share-social-outline" size={17} color={theme.textSecondary} />,
        onPress: async () => {
          const storeUrl = Platform.OS === "ios" ? APPLE_STORE_URL : GOOGLE_PLAY_URL;
          await shareText(tr.labels.khatamShareTitle, `${tr.labels.khatamShareMessage}\n\n${tr.labels.khatamShareVia}\n${storeUrl}`);
        },
        buttonStyle: { backgroundColor: `${theme.green}20`, borderWidth: 1, borderColor: `${theme.green}40` },
        labelStyle: { fontSize: 16, fontWeight: "600", color: theme.textSecondary },
      },
      {
        label: "OK",
        action: "ok",
        buttonStyle: { backgroundColor: theme.accentLight, borderWidth: 1, borderColor: theme.divider2 },
        labelStyle: { fontSize: 16, fontWeight: "600", color: theme.accent },
      }
    ],
    celebrationAnimation: true,
  });
}

// ------------------------------------------------------------
// Update
// ------------------------------------------------------------
export function showUpdateJsonModal() {
  const { updateNextShowAt, updateShownAt, updateShownCount, updateCheckedAt, updateCheckResult } = useAutoModalsStore.getState();
  showJsonViewerModal("Update", {
    updateNextShowAt: formatTime(updateNextShowAt),
    updateShownAt: formatTime(updateShownAt),
    updateShownCount,
    updateCheckedAt: formatTime(updateCheckedAt),
    updateCheckResult,
  });
}

function resetUpdate() {
  useAutoModalsStore.getState().setAutoModals({
    updateNextShowAt: null,
    updateShownAt: null,
    updateShownCount: 0,
    updateCheckedAt: null,
    updateCheckResult: null,
  });
}

export function previewUpdateModal() {
  const { updateNextShowAt, updateShownCount } = useAutoModalsStore.getState();

  if (updateNextShowAt && Date.now() < updateNextShowAt) {
    Alert.alert("Update", `Shown ${updateShownCount} times — the real modal waits until ${formatTime(updateNextShowAt)}.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", onPress: resetUpdate },
    ]);
    return;
  }
  showUpdateModal();
}

// ------------------------------------------------------------
// Notif Reminder
// ------------------------------------------------------------
export function showNotifReminderJsonModal() {
  const { notifReminderNextShowAt, notifReminderShownAt, notifReminderShownCount, notifReminderDone } = useAutoModalsStore.getState();
  showJsonViewerModal("Notif Reminder", {
    notificationPermission: useDeviceSettingsStore.getState().notificationPermission,
    notifReminderNextShowAt: formatTime(notifReminderNextShowAt),
    notifReminderShownAt: formatTime(notifReminderShownAt),
    notifReminderShownCount,
    notifReminderDone,
  });
}

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
// Rate App
// ------------------------------------------------------------
export function showRateAppJsonModal() {
  const { rateAppNextShowAt, rateAppShownAt, rateAppShownCount, rateAppDone } = useAutoModalsStore.getState();
  showJsonViewerModal("Rate App", {
    rateAppNextShowAt: formatTime(rateAppNextShowAt),
    rateAppShownAt: formatTime(rateAppShownAt),
    rateAppShownCount,
    rateAppDone,
  });
}

function resetRateApp() {
  useAutoModalsStore.getState().setAutoModals({ rateAppNextShowAt: null, rateAppShownAt: null, rateAppShownCount: 0, rateAppDone: false });
}

export function previewRateAppModal() {
  const { rateAppShownCount, rateAppDone } = useAutoModalsStore.getState();

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
}

// ------------------------------------------------------------
// Feedback
// ------------------------------------------------------------
export function showFeedbackJsonModal() {
  const { feedbackNextShowAt, feedbackShownAt, feedbackShownCount, feedbackDone } = useAutoModalsStore.getState();
  showJsonViewerModal("Feedback", {
    feedbackNextShowAt: formatTime(feedbackNextShowAt),
    feedbackShownAt: formatTime(feedbackShownAt),
    feedbackShownCount,
    feedbackDone,
  });
}

function resetFeedback() {
  useAutoModalsStore.getState().setAutoModals({
    feedbackNextShowAt: null,
    feedbackShownAt: null,
    feedbackShownCount: 0,
    feedbackDone: false,
  });
}

export function previewFeedbackModal() {
  const { feedbackShownCount, feedbackDone } = useAutoModalsStore.getState();

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
}
