import ModalSheet from "@/components/ModalSheet";
import { globalStyles } from "@/constants/styles";
import DebugPanel from "@/debug/DebugPanel";
import { useThemeStore } from "@/store/themeStore";
import { View } from "react-native";

// Debug sheet — opened by DebugTab; the content lives in src/debug
export default function DebugToolsScreen() {
  const theme = useThemeStore((state) => state.theme);

  return (
    <ModalSheet size="xxlf" colors={{ sheetBackgroundColor: theme.bg2, handleColor: theme.handle }}>
      <View style={globalStyles.modalContainer}>
        <DebugPanel />
      </View>
    </ModalSheet>
  );
}
