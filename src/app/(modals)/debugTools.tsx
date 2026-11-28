import ModalSheet from "@/components/ModalSheet";
import { globalStyles } from "@/constants/styles";
import DebugPanel from "@/debug/DebugPanel";
import { useThemeStore } from "@/store/themeStore";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons/static";
import { StyleSheet, Text, View } from "react-native";

// Debug sheet — opened by DebugTab; the list lives in src/debug
export default function DebugToolsScreen() {
  const theme = useThemeStore((state) => state.theme);

  return (
    <ModalSheet size="xxl" colors={{ sheetBackgroundColor: theme.bg2, handleColor: theme.handle }}>
      <View style={globalStyles.modalContainer}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTitleRow}>
            <MaterialDesignIcons name="wrench" size={22} color={theme.danger} />
            <Text style={[styles.headerTitle, { color: theme.danger }]}>Debug tools</Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>Previews and test switches, debug mode only</Text>
        </View>

        <DebugPanel />
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  // Same header as the other sheets (prayerTimings, quranSettings)
  headerContainer: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 15,
    textAlign: "center",
  },
});
