import CelebrationFx from "@/components/CelebrationFx";
import { globalStyles } from "@/constants/styles";
import { DAY_MS, STORE_REVIEW_MAX_SHOWS, STORE_REVIEW_WAIT_DAYS, useAutoModalsStore } from "@/store/autoModalsStore";
import { useLanguageStore } from "@/store/languageStore";
import { useModalStore } from "@/store/modalStore";
import { useThemeStore } from "@/store/themeStore";
import { openStoreListing } from "@/utils/system";
import { Ionicons } from "@react-native-vector-icons/ionicons/static";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Star sizes, left to right — the middle one is the biggest
const STAR_SIZES = [26, 34, 44, 34, 26];

// ------------------------------------------------------------
// Show the "Rate the App" modal — no checks (canShowStoreReview runs at the triggers).
// From About the open and "Later" aren't recorded; "Open Store" and "Already rated" always are.
// ------------------------------------------------------------
export function showStoreReviewModal(fromAbout = false) {
  const { storeReviewShownCount, setAutoModals } = useAutoModalsStore.getState();
  const tr = useLanguageStore.getState().tr;
  const theme = useThemeStore.getState().theme;
  const { hide } = useModalStore.getState();

  // ShownAt keeps the feedback modal from showing soon after this one
  if (!fromAbout) {
    setAutoModals({
      storeReviewShownAt: Date.now(),
      storeReviewShownCount: storeReviewShownCount + 1,
      // Every open counts — the limit marks it done
      storeReviewDone: storeReviewShownCount + 1 >= STORE_REVIEW_MAX_SHOWS,
    });
  }

  useModalStore.getState().show({
    type: "fullscreen",
    animationType: "fade",
    // Only the buttons close it — so every close records a choice
    dismissable: false,
    component: (
      <View style={styles.container}>
        <CelebrationFx variant="sparkle" />

        {/* Stars + app icon + text */}
        <View style={styles.content}>
          <View style={styles.starsRow}>
            {STAR_SIZES.map((size, i) => (
              <Ionicons key={i} name="star" size={size} color={theme.gold} style={i === 2 ? styles.middleStar : undefined} />
            ))}
          </View>
          <Image style={styles.appIcon} source={require("../../assets/icons/icon-bg.png")} />
          <Text style={[globalStyles.bannerTitle, styles.title, { color: theme.text }]}>{tr.labels.rateAppTitle}</Text>
          <Text style={[globalStyles.bannerMessage, { color: theme.textMuted }]}>{tr.labels.rateAppMessage}</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.gold + "20", borderWidth: 1, borderColor: theme.gold + "40" }]}
            activeOpacity={0.8}
            onPress={() => {
              setAutoModals({ storeReviewDone: true });
              hide("openStore");
              openStoreListing();
            }}
          >
            <Ionicons name="star" size={18} color={theme.gold} />
            <Text style={[styles.buttonText, { color: theme.gold }]}>{tr.buttons.openStore}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.overlay }]}
            activeOpacity={0.8}
            onPress={() => {
              if (!fromAbout) {
                setAutoModals({ storeReviewNextShowAt: Date.now() + STORE_REVIEW_WAIT_DAYS * DAY_MS });
              }
              hide("later");
            }}
          >
            <Text style={[styles.buttonText, { color: theme.text2 }]}>{tr.buttons.later}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.6}
            onPress={() => {
              setAutoModals({ storeReviewDone: true });
              hide("alreadyRated");
            }}
          >
            <Text style={[styles.buttonText, { color: theme.textMuted }]}>{tr.buttons.alreadyRated}</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    gap: 6,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    marginBottom: 16,
  },
  middleStar: {
    marginBottom: 12,
  },
  appIcon: {
    width: 96,
    height: 96,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
  },
  buttons: {
    gap: 10,
    marginBottom: 8,
  },
  button: {
    height: 50,
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
