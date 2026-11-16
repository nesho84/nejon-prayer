import { showUpdateModal } from "@/components/UpdateModal";
import { UpdatePreview, useDebugStore } from "@/debug/debugStore";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { Translations } from "@/types/language.types";
import { ThemeColors } from "@/types/theme.types";
import NetInfo from "@react-native-community/netinfo";
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

// Main component
export default function CheckForUpdate() {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const tr = useLanguageStore((state) => state.tr);
  const preview = useDebugStore((state) => state.updatePreview);
  const debugModeEnabled = useDebugStore((state) => state.debugModeEnabled);

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
      // Play serves appUpdateInfo from its own cache and resolves fine offline, reporting
      // "no update" — bail out first, or we'd show that as "up to date".
      const { isConnected } = await NetInfo.fetch();
      if (!isConnected) {
        setErrorDetail("No internet connection");
        setStatus("error");
        return;
      }

      const { updateAvailable } = await ExpoInAppUpdates.checkForUpdate();
      if (updateAvailable) {
        showUpdateModal(true);
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
  // A debug preview (only while debug mode is on) overrides the real status when set
  // ------------------------------------------------------------
  const shown: UpdatePreview | CheckStatus = debugModeEnabled && preview !== "idle" ? preview : status;
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
            <MaterialDesignIcons name="update" size={18} color={theme.gray} />
            <Text style={[styles.wideButtonText, { color: theme.gray }]}>
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
