import ModalSheet from "@/components/ModalSheet";
import { globalStyles } from "@/constants/styles";
import DebugPanel from "@/debug/DebugPanel";
import { useThemeStore } from "@/store/themeStore";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons/static";
import { ComponentRef, useRef } from "react";
import { NativeScrollEvent, NativeSyntheticEvent, StyleSheet, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

// Last scroll position: the sheet reopens where it was left (until the app restarts)
let lastScrollY = 0;

export default function DebugToolsScreen() {
  // Stores
  const theme = useThemeStore((state) => state.theme);

  // Refs
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const restored = useRef(false);

  // ------------------------------------------------------------
  // Restore the last scroll position once the list has its full height
  // ------------------------------------------------------------
  const restoreScroll = () => {
    if (restored.current) {
      return;
    }
    restored.current = true;
    scrollRef.current?.scrollTo({ y: lastScrollY, animated: false });
  };

  // ------------------------------------------------------------
  // Remember the scroll position
  // ------------------------------------------------------------
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    lastScrollY = e.nativeEvent.contentOffset.y;
  };

  // Main Content
  return (
    <ModalSheet size="xxl" scrolling={false} colors={{ sheetBackgroundColor: theme.bg2, handleColor: theme.handle }}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={100}
        onScroll={handleScroll}
        onContentSizeChange={restoreScroll}
      >
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
      </ScrollView>
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
