import AppLayout from "@/components/AppLayout";
import { useThemeStore } from "@/store/themeStore";
import { Text, View } from "react-native";

export default function NamaziPlusScreen() {
  const theme = useThemeStore((state) => state.theme);

  return (
    <AppLayout>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: theme.text }}>Namazi Plus — coming soon</Text>
      </View>
    </AppLayout>
  );
}
