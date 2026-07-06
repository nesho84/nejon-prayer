import { APPLE_STORE_URL, GOOGLE_PLAY_URL } from "@/constants/links";
import { globalStyles } from "@/constants/styles";
import { PRAYER_CELEBRATIONS_TR } from "@/constants/translations/celebrations.tr";
import { useLanguageStore } from "@/store/languageStore";
import { useModalStore } from "@/store/modalStore";
import { useThemeStore } from "@/store/themeStore";
import { shareText } from "@/utils/system";
import { Ionicons } from "@react-native-vector-icons/ionicons/static";
import { router } from "expo-router";
import { Platform, Text, View } from "react-native";

// ------------------------------------------------------------
// Debug utility: preview a prayer-complete celebration (random localized)
// (mirrors the modal in src/app/components/PrayersList.tsx, minus the tracking logic)
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
    type: 'alert',
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
        action: 'share',
        icon: <Ionicons name="share-social-outline" size={17} color={theme.textSecondary} />,
        onPress: async () => {
          const storeUrl = Platform.OS === "ios" ? APPLE_STORE_URL : GOOGLE_PLAY_URL;
          await shareText(tr.labels.khatamShareTitle, `${tr.labels.khatamShareMessage}\n\n${tr.labels.khatamShareVia}\n${storeUrl}`);
          router.back();
        },
        buttonStyle: { backgroundColor: `${theme.green}20`, borderWidth: 1, borderColor: `${theme.green}40` },
        labelStyle: { fontSize: 16, fontWeight: '600', color: theme.textSecondary },
      },
      {
        label: 'OK',
        action: 'ok',
        onPress: () => router.back(),
        buttonStyle: { backgroundColor: theme.accentLight, borderWidth: 1, borderColor: theme.divider2 },
        labelStyle: { fontSize: 16, fontWeight: '600', color: theme.accent },
      }
    ],
    celebrationAnimation: true,
  });
}
