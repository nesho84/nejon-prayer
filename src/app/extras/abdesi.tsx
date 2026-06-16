import AppCard from "@/components/AppCard";
import AppLayout from "@/components/AppLayout";
import { globalStyles } from "@/constants/styles";
import { ABDESI_TR } from "@/constants/translations/abdesi.tr";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { FlashList } from "@shopify/flash-list";
import { useCallback, useMemo, useState } from "react";
import { Image, ImageSourcePropType, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface StepType {
    id: number;
    text: string;
    image?: ImageSourcePropType;
}

export default function AbdesiScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);
    const language = useLanguageStore((state) => state.language);
    const abdesiTr = ABDESI_TR[language] ?? ABDESI_TR.en;

    // Local state
    const [currentStep, setCurrentStep] = useState(1);

    // Safe area insets
    const insets = useSafeAreaInsets();
    const topInset = 12;
    const bottomInset = insets.bottom + 12;

    // ------------------------------------------------------------
    // Steps data
    // ------------------------------------------------------------
    const STEPS: StepType[] = useMemo(() => {
        return [
            { id: 1, text: abdesiTr.step1 },
            { id: 2, text: abdesiTr.step2, image: require("../../../assets/images/abdesi/step2.png") },
            { id: 3, text: abdesiTr.step3, image: require("../../../assets/images/abdesi/step3.png") },
            { id: 4, text: abdesiTr.step4, image: require("../../../assets/images/abdesi/step4.png") },
            { id: 5, text: abdesiTr.step5, image: require("../../../assets/images/abdesi/step5.png") },
            { id: 6, text: abdesiTr.step6, image: require("../../../assets/images/abdesi/step6.png") },
            { id: 7, text: abdesiTr.step7, image: require("../../../assets/images/abdesi/step7.png") },
            { id: 8, text: abdesiTr.step8, image: require("../../../assets/images/abdesi/step8.png") },
            { id: 9, text: abdesiTr.step9, image: require("../../../assets/images/abdesi/step9.png") },
            { id: 10, text: abdesiTr.step10 },
        ];
    }, [abdesiTr]);

    // ------------------------------------------------------------
    // Progress tracking
    // ------------------------------------------------------------
    const handleScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } } }) => {
        const { contentOffset: { y }, contentSize: { height: contentH }, layoutMeasurement: { height: layoutH } } = e.nativeEvent;
        const maxScroll = contentH - layoutH;
        if (maxScroll <= 0) return;
        const step = Math.min(STEPS.length, Math.max(1, Math.ceil((y / maxScroll) * STEPS.length)));
        setCurrentStep(step);
    }, [STEPS.length]);

    // ------------------------------------------------------------
    // Render item
    // ------------------------------------------------------------
    const renderItem = useCallback(({ item }: { item: StepType }) => (
        <AppCard style={[styles.stepCard, { backgroundColor: theme.card }]}>
            <View style={styles.stepHeader}>
                <View style={[globalStyles.numberCircle, { backgroundColor: theme.secondary }]}>
                    <Text style={[styles.stepNumber, { color: theme.card }]}>{item.id}</Text>
                </View>
                <Text style={[styles.stepText, { color: theme.text2 }]}>{item.text}</Text>
            </View>

            {item.image && (
                <View style={[styles.imageContainer, { backgroundColor: theme.bg }]}>
                    <Image source={item.image} style={styles.stepImage} />
                </View>
            )}
        </AppCard>
    ), [theme]);

    // Main Content
    return (
        <AppLayout>

            {/* PROGRESS */}
            <View style={[globalStyles.progressWrapper, { backgroundColor: theme.statusbar, borderBottomColor: theme.divider2 }]}>
                <View style={[globalStyles.progressTrack, { backgroundColor: theme.border }]}>
                    <View style={[globalStyles.progressFill, { backgroundColor: theme.secondary, width: `${(currentStep / STEPS.length) * 100}%` as any }]} />
                </View>
                <Text style={[styles.progressText, { color: theme.placeholder }]}>
                    {tr.labels.stepLabel} {currentStep} / {STEPS.length}
                </Text>
            </View>

            {/* STEPS List */}
            <FlashList
                data={STEPS}
                keyExtractor={(item) => String(item.id)}
                ListHeaderComponent={
                    // HEADER
                    <AppCard style={[globalStyles.headerCard, { backgroundColor: theme.card, borderColor: theme.secondary }]}>
                        <Text style={globalStyles.headerIcon}>✨</Text>
                        <Text style={[globalStyles.headerTitle, { color: theme.text }]}>{abdesiTr.headerTitle}</Text>
                        <Text style={[globalStyles.headerSubtitle, { color: theme.placeholder }]}>{abdesiTr.headerSubtitle}</Text>
                    </AppCard>
                }
                renderItem={renderItem}
                ListFooterComponent={
                    // FOOTER
                    <AppCard style={[styles.footerCard, { backgroundColor: theme.card, borderLeftColor: theme.placeholder }]}>
                        <Text style={[styles.footerText, { color: theme.placeholder }]}>
                            {abdesiTr.footerText}
                        </Text>
                    </AppCard>
                }
                contentContainerStyle={{ paddingTop: topInset, paddingBottom: bottomInset }}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
            />

        </AppLayout>
    );
}

const styles = StyleSheet.create({
    // Progress indicator
    progressText: {
        fontSize: 12,
        fontWeight: "600",
        minWidth: 62,
        textAlign: "right",
    },

    // Step cards
    stepCard: {
        padding: 16,
        marginHorizontal: 8,
        marginBottom: 10,
        gap: 10,
    },
    stepHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    stepNumber: {
        fontSize: 15,
        fontWeight: "700",
    },
    stepText: {
        flex: 1,
        fontSize: 16,
        textAlign: "justify",
        lineHeight: 22,
        fontWeight: "400",
    },
    imageContainer: {
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        padding: 10,
        marginTop: 16,
        borderRadius: 16,
    },
    stepImage: {
        width: 141,
        height: 141,
        borderRadius: 70.5,
        resizeMode: "cover",
    },

    // Footer card
    footerCard: {
        padding: 22,
        borderLeftWidth: 4,
        marginHorizontal: 8,
        marginBottom: 10,
    },
    footerText: {
        fontSize: 14,
        lineHeight: 22,
        fontWeight: "400",
        fontStyle: "italic",
        textAlign: "justify",
    },
});
