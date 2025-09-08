import { LanguageProvider } from "@/context/LanguageContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <LanguageProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "transparent" },
            animation: "fade",
          }}
        />
      </LanguageProvider>
      <StatusBar style="auto" />
    </>
  );
}
