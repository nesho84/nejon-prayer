import { globalStyles } from "@/constants/styles";
import { PRAYER_CELEBRATIONS_TR } from "@/constants/translations/celebrations.tr";
import { useLanguageStore } from "@/store/languageStore";
import { useModalStore } from "@/store/modalStore";
import { useThemeStore } from "@/store/themeStore";
import { Text, View } from "react-native";

interface DebugCParams {
  emoji: string;
  title: string;
  message: string;
}

// ------------------------------------------------------------
// Fires a celebration modal (shared by the prayer & khatam previews)
// ------------------------------------------------------------
function showCelebrationModal({ emoji, title, message }: DebugCParams) {
  const theme = useThemeStore.getState().theme;

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
}

// ------------------------------------------------------------
// Debug utility: preview a prayer-complete celebration (random localized)
// ------------------------------------------------------------
export function previewPrayerCelebrationModal() {
  const language = useLanguageStore.getState().language;
  const variants = PRAYER_CELEBRATIONS_TR[language] ?? PRAYER_CELEBRATIONS_TR["en"];
  const variant = variants[Math.floor(Math.random() * variants.length)];
  showCelebrationModal({ emoji: variant.emoji, title: variant.title, message: variant.message });
}

// ------------------------------------------------------------
// Debug utility: preview the khatam-complete celebration
// ------------------------------------------------------------
export function previewKhatamCelebrationModal() {
  const tr = useLanguageStore.getState().tr;
  showCelebrationModal({ emoji: "📖", title: tr.labels.khatamCompleteTitle, message: tr.labels.khatamCompleteMessage });
}
