import { globalStyles } from "@/constants/styles";
import { UpdatePreview, useDebugStore } from "@/debug/debugStore";
import { useLanguageStore } from "@/store/languageStore";
import { useModalStore } from "@/store/modalStore";
import { useThemeStore } from "@/store/themeStore";
import { Translations } from "@/types/language.types";
import { ThemeColors } from "@/types/theme.types";
import { openStoreListing } from "@/utils/system";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons/static";
import Constants from "expo-constants";
import * as ExpoInAppUpdates from "expo-in-app-updates";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type CheckStatus = "idle" | "checking" | "upToDate" | "error";

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
        <View style={[styles.modalIconCircle, { backgroundColor: theme.islamicGreen + "20" }]}>
          <MaterialDesignIcons name="information-variant-circle" size={32} color={theme.islamicGreen} />
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
        onPress: openStoreListing,
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
      {/* Check for Update Button */}
      <TouchableOpacity
        style={[styles.wideButton, { backgroundColor: theme.primary + "20" }]}
        onPress={runCheck}
        disabled={status === "checking"}
        activeOpacity={0.8}
      >
        {status === "checking" ? (
          <ActivityIndicator size="small" color={theme.textSecondary} />
        ) : (
          <>
            <MaterialDesignIcons name="update" size={16} color={theme.textSecondary} />
            <Text style={[styles.wideButtonText, { color: theme.textSecondary }]}>
              {tr.labels.checkUpdateButton}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Version */}
      <Text style={[styles.versionText, { color: theme.placeholder, opacity: 0.8 }]}>
        Version {Constants?.expoConfig?.version}
      </Text>

      {/* Idle/checking hint */}
      {(shown === "idle" || shown === "checking") && (
        <Text style={[styles.infoText, { textAlign: "center", color: statusColor }]}>
          {statusMessage}
        </Text>
      )}

      {/* Check result badge */}
      {(shown === "upToDate" || shown === "error") && (
        <View style={[styles.statusBadge, { borderColor: statusColor }]}>
          <MaterialDesignIcons
            name={shown === "upToDate" ? "check-circle-outline" : "close-circle-outline"}
            size={14}
            color={statusColor}
          />
          <Text style={[styles.statusBadgeText, { color: shown === "upToDate" ? theme.green : theme.danger }]}>
            {statusMessage}
          </Text>
        </View>
      )}

      {/* Dev-only: raw error text, so a failed check is debuggable without digging through logs */}
      {__DEV__ && shown === "error" && errorDetail && (
        <>
          <View style={[styles.divider, { marginTop: 12, borderWidth: 0.3, borderColor: theme.divider2 }]} />
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
    width: 54,
    height: 54,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
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
    includeFontPadding: false,
  },
  versionText: {
    fontSize: 12,
    textAlign: "center",
    marginVertical: 6,
  },
  infoText: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    borderWidth: 1,
    borderRadius: 20,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  statusBadgeText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "500",
    includeFontPadding: false,
  },
  devErrorText: {
    fontSize: 12,
    textAlign: "center",
  },
});
