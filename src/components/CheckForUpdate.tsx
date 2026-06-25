import { globalStyles } from "@/constants/styles";
import { UpdatePreview, useDebugStore } from "@/debug/debugStore";
import { useLanguageStore } from "@/store/languageStore";
import { useModalStore } from "@/store/modalStore";
import { useThemeStore } from "@/store/themeStore";
import { Translations } from "@/types/language.types";
import { ThemeColors } from "@/types/theme.types";
import { openExternalUrl } from "@/utils/system";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as ExpoInAppUpdates from "expo-in-app-updates";
import { useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type CheckStatus = "idle" | "checking" | "upToDate" | "error";

// iOS App Store id for the iTunes lookup (filled in during Phase 2)
const APP_STORE_ID = "TODO_REPLACE_WITH_APPSTORE_ID";

// ------------------------------------------------------------
// Get the store URL for the current platform
// ------------------------------------------------------------
function getStoreUrl(): string {
  if (Platform.OS === "ios") {
    return `itms-apps://itunes.apple.com/app/id${APP_STORE_ID}`;
  }
  return `market://details?id=${Constants?.expoConfig?.android?.package}`;
}

// ------------------------------------------------------------
// Color + message to show for the current status
// ------------------------------------------------------------
function getStatusDisplay(shown: UpdatePreview | CheckStatus, theme: ThemeColors, tr: Translations) {
  if (shown === "upToDate") {
    return { color: theme.green, message: tr.labels.upToDateMessage };
  }
  if (shown === "error") {
    return { color: theme.danger, message: tr.labels.updateCheckError };
  }
  return { color: theme.placeholder, message: tr.labels.checkUpdateInfo };
}

// ------------------------------------------------------------
// Open "Update available" modal
// ------------------------------------------------------------
export function openUpdateAvailableModal() {
  const tr = useLanguageStore.getState().tr;
  const theme = useThemeStore.getState().theme;

  useModalStore.getState().show({
    type: "alert",
    component: (
      <View style={globalStyles.bannerContainer}>
        <View style={[styles.modalIconCircle, { backgroundColor: theme.info + "20" }]}>
          <Ionicons name="information" size={32} color={theme.info} />
        </View>
        <Text style={[globalStyles.bannerTitle, { color: theme.text2 }]}>{tr.labels.updateAvailableTitle}</Text>
        <Text style={[globalStyles.bannerMessage, { color: theme.textMuted }]}>{tr.labels.updateAvailableMessage}</Text>
      </View>
    ),
    buttons: [
      {
        label: tr.buttons.later,
        action: "later",
        buttonStyle: { backgroundColor: theme.overlay },
        labelStyle: { color: theme.text2 },
      },
      {
        label: tr.buttons.openStore,
        action: "openStore",
        onPress: () => openExternalUrl(getStoreUrl()),
        buttonStyle: { backgroundColor: theme.islamicGreen + "20", borderWidth: 1, borderColor: theme.islamicGreen + "40" },
        labelStyle: { color: theme.islamicGreen },
      },
    ],
  });
}

// Main component
export default function CheckForUpdate() {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const tr = useLanguageStore((state) => state.tr);
  const preview = useDebugStore((state) => state.updatePreview);

  // Local state
  const [status, setStatus] = useState<CheckStatus>("idle");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  // ------------------------------------------------------------
  // Run the store check
  // ------------------------------------------------------------
  const runCheck = async () => {
    if (status === "checking") return;

    setStatus("checking");
    setErrorDetail(null);
    try {
      const { updateAvailable } = await ExpoInAppUpdates.checkForUpdate();
      if (updateAvailable) {
        openUpdateAvailableModal();
        setStatus("idle");
      } else {
        setStatus("upToDate");
      }
    } catch (err) {
      // Most common cause is ERROR_APP_NOT_OWNED, which is expected on sideloaded/dev builds
      // (the Play In-App Update API only works for apps installed via Play) — not a crash.
      console.warn("⚠️ [CheckForUpdate] checkForUpdate failed:", err);
      setErrorDetail(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  };

  // ------------------------------------------------------------
  // A dev preview overrides the real status when set
  // ------------------------------------------------------------
  const shown: UpdatePreview | CheckStatus = __DEV__ && preview !== "idle" ? preview : status;
  const { color: statusColor, message: statusMessage } = getStatusDisplay(shown, theme, tr);

  return (
    <>
      <Text style={[styles.settingTitle, { color: theme.text2 }]}>
        {tr.labels.checkUpdateRow}
      </Text>

      {/* Divider */}
      <View style={[styles.divider, { borderColor: theme.divider2 }]} />

      <TouchableOpacity
        style={[styles.wideButton, { backgroundColor: theme.primary + "15" }]}
        onPress={runCheck}
        disabled={status === "checking"}
        activeOpacity={0.8}
      >
        {status === "checking" ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          <>
            <MaterialCommunityIcons name="update" size={16} color={theme.primary} />
            <Text style={[styles.wideButtonText, { color: theme.primary }]}>
              {tr.labels.checkUpdateButton}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={[styles.infoText, { textAlign: "center", color: statusColor }]}>
        {statusMessage}
      </Text>

      {/* Dev-only: raw error text, so a failed check is debuggable without digging through logs */}
      {__DEV__ && shown === "error" && errorDetail && (
        <>
          <View style={[styles.divider, { borderWidth: 0.3, borderColor: theme.divider2 }]} />
          <Text style={[styles.devErrorText, { color: theme.placeholder }]}>
            {errorDetail}
          </Text>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  settingTitle: {
    fontSize: 17.5,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginLeft: 1,
  },
  divider: {
    width: "100%",
    borderWidth: 1,
    marginVertical: 8,
  },
  wideButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    marginTop: 5,
    borderRadius: 8,
    gap: 6,
  },
  wideButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  infoText: {
    marginTop: 8,
    marginBottom: 1,
  },
  devErrorText: {
    fontSize: 12,
    textAlign: "center",
  },
});
