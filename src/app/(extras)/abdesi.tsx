import AppCard from "@/components/AppCard";
import AppScreen from "@/components/AppScreen";
import { ABDESI_TRANSLATIONS } from "@/constants/abdesi";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { useMemo } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

interface StepType {
    id: number;
    text: string;
    image?: any;
}

export default function AbdesiScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
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

    return (
        <AppScreen>
            <ScrollView
                style={[styles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
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
