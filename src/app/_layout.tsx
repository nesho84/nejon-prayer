import AppLoading from "@/components/AppLoading";
import ModalProvider from "@/components/ModalProvider";
import { useDeviceSettingsSync } from "@/hooks/useDeviceSettingsSync";
import { useNotificationsSync } from "@/hooks/useNotificationsSync";
import { useQuranSetup } from "@/hooks/useQuranSetup";
import { useSystemThemeSync } from "@/hooks/useSystemThemeSync";
import { useOnboardingStore } from "@/store/onboardingStore";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";

const RootStack = () => {
  const isReady = useOnboardingStore((state) => state.isReady);
  const onboardingComplete = useOnboardingStore((state) => state.onboardingComplete);

  if (!isReady) return <AppLoading />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Onboarding */}
      <Stack.Protected guard={!onboardingComplete}>
        <Stack.Screen name="(onboarding)" options={{ animation: "fade" }} />
      </Stack.Protected>

      {/* Main app only after onboarding */}
      <Stack.Protected guard={onboardingComplete}>
        <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
        <Stack.Screen name="(extras)" options={{ animation: "slide_from_right" }} />
        {/* Modal Screens */}
        <Stack.Screen
          name="(modals)"
          options={{
            presentation: "transparentModal",
            animation: "slide_from_bottom",
          }}
        />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  // Initialization and global sync hooks
  useSystemThemeSync();
  useDeviceSettingsSync();
  useNotificationsSync();
  useQuranSetup();

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootStack />
        <ModalProvider />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
