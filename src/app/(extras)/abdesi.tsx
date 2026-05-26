import AppCard from "@/components/AppCard";
import AppScreen from "@/components/AppScreen";
import { ABDESI_TRANSLATIONS } from "@/constants/translations/abdesi.tr";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { useCallback, useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

interface StepType {
    id: number;
    text: string;
    image?: any;
}

export default function AbdesiScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);
    const language = useLanguageStore((state) => state.language);
    const abdesiTr = ABDESI_TRANSLATIONS[language] ?? ABDESI_TRANSLATIONS.en;

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
    const [currentStep, setCurrentStep] = useState(1);
    const handleScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } } }) => {
        const { contentOffset: { y }, contentSize: { height: contentH }, layoutMeasurement: { height: layoutH } } = e.nativeEvent;
        const maxScroll = contentH - layoutH;
        if (maxScroll <= 0) return;
        const step = Math.min(STEPS.length, Math.max(1, Math.ceil((y / maxScroll) * STEPS.length)));
        setCurrentStep(step);
    }, [STEPS.length]);

    return (
        <AppScreen>

            {/* PROGRESS (fixed below native Header) */}
            <View style={[styles.progressWrapper, { backgroundColor: theme.statusbar, borderBottomColor: theme.divider2 }]}>
                <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                    <View style={[styles.progressFill, { backgroundColor: theme.secondary, width: `${(currentStep / STEPS.length) * 100}%` as any }]} />
                </View>
                <Text style={[styles.progressText, { color: theme.placeholder }]}>
                    {tr.labels.stepLabel} {currentStep} / {STEPS.length}
                </Text>
            </View>

            <ScrollView
                style={[styles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >

                {/* HEADER */}
                <AppCard style={[styles.headerCard, { backgroundColor: theme.card, borderColor: theme.secondary }]}>
                    <Text style={[styles.headerIcon]}>✨</Text>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                        {abdesiTr.headerTitle}
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: theme.placeholder }]}>
                        {abdesiTr.headerSubtitle}
                    </Text>
                </AppCard>

                {/* STEPS */}
                {STEPS.map((step) => (
                    <AppCard key={step.id} style={[styles.stepCard, { backgroundColor: theme.card }]}>
                        <View style={styles.stepHeader}>
                            <View style={[styles.stepNumberCircle, { backgroundColor: theme.secondary }]}>
                                <Text style={[styles.stepNumber, { color: theme.card }]}>{step.id}</Text>
                            </View>
                            <Text style={[styles.stepText, { color: theme.text2 }]}>{step.text}</Text>
                        </View>

                        {step.image && (
                            <View style={[styles.imageContainer, { backgroundColor: theme.bg }]}>
                                <Image source={step.image} style={styles.stepImage} />
                            </View>
                        )}
                    </AppCard>
                ))}

            </ScrollView>

        </AppScreen>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingTop: 12,
        paddingBottom: 24,
        paddingHorizontal: 8,
        gap: 10,
    },

    // Progress indicator
    progressWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    progressTrack: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: 6,
        borderRadius: 3,
        opacity: 0.5,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '600',
        minWidth: 62,
        textAlign: 'right',
    },

    // Header card
    headerCard: {
        alignItems: "center",
        paddingVertical: 22,
        paddingHorizontal: 16,
        borderLeftWidth: 2,
        borderRightWidth: 2,
    },
    headerIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 25,
        fontWeight: "700",
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 13,
        fontWeight: "400",
        textAlign: "center",
    },

    // Step cards
    stepCard: {
        padding: 16,
    },
    stepHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    stepNumberCircle: {
        alignSelf: "flex-start",
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 2,
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
        padding: 10,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 16,
        borderRadius: 16,
    },
    stepImage: {
        width: 141,
        height: 141,
        borderRadius: 70.5,
        resizeMode: "cover",
    },
});
