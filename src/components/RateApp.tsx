import CelebrationFx from "@/components/CelebrationFx";
import { globalStyles } from "@/constants/styles";
import { useLanguageStore } from "@/store/languageStore";
import { useModalStore } from "@/store/modalStore";
import { useRateAppStore } from "@/store/rateAppStore";
import { useThemeStore } from "@/store/themeStore";
import { openStoreListing } from "@/utils/system";
import { Ionicons } from "@react-native-vector-icons/ionicons/static";
import Constants from "expo-constants";
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const DAY_MS = 24 * 60 * 60 * 1000;
// Wait after "Later", and after updating to a new version
const REMIND_AFTER_DAYS = 7;

// Star sizes, left to right — the middle one is the biggest
const STAR_SIZES = [26, 34, 44, 34, 26];

// ------------------------------------------------------------
// Open "Rate the App" fullscreen modal (Android only)
// ------------------------------------------------------------
export function openRateAppModal() {
  if (Platform.OS !== "android") {
    return;
  }

  const { rateAppDone, rateAppVersion, rateAppRemindAt, setRateAppVersion, setRateAppRemindAt } = useRateAppStore.getState();
  const version = Constants.expoConfig?.version ?? null;

  // Tapped "Already rated"
  if (rateAppDone) {
    return;
  }
  // Tapped "Later", or still waiting after a new version
  if (rateAppRemindAt && Date.now() < rateAppRemindAt) {
    return;
  }
  // Already went to the store on this version
  if (rateAppVersion === version) {
    return;
  }
  // Went to the store on an older version — wait a week on this one first
  if (rateAppVersion) {
    setRateAppVersion(null);
    setRateAppRemindAt(Date.now() + REMIND_AFTER_DAYS * DAY_MS);
    return;
  }

  showRateAppModal();
}

// ------------------------------------------------------------
// Show the "Rate the App" modal — no checks (the Debug Panel calls this directly)
// ------------------------------------------------------------
export function showRateAppModal() {
  const { setRateAppDone, setRateAppVersion, setRateAppRemindAt } = useRateAppStore.getState();
  const version = Constants.expoConfig?.version ?? null;
  const tr = useLanguageStore.getState().tr;
  const theme = useThemeStore.getState().theme;
  const { hide } = useModalStore.getState();

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
              setRateAppVersion(version);
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
              setRateAppRemindAt(Date.now() + REMIND_AFTER_DAYS * DAY_MS);
              hide("later");
            }}
          >
            <Text style={[styles.buttonText, { color: theme.text2 }]}>{tr.buttons.later}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.6}
            onPress={() => {
              setRateAppDone(true);
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
