import { ScrollView, View, Text, Image, StyleSheet } from "react-native";
import { useThemeContext } from "@/context/ThemeContext";
import useTranslation from "@/hooks/useTranslation";
import AppFullScreen from "@/components/AppFullScreen";
import AppCard from "@/components/AppCard";

export default function AbdesiScreen() {
    const { theme } = useThemeContext();
    const { tr } = useTranslation();

    const steps = [
        { id: 1, text: tr("abdesi.step1") },
        { id: 2, text: tr("abdesi.step2"), image: require("../../../assets/images/abdesi/step2.png") },
        { id: 3, text: tr("abdesi.step3"), image: require("../../../assets/images/abdesi/step3.png") },
        { id: 4, text: tr("abdesi.step4"), image: require("../../../assets/images/abdesi/step4.png") },
        { id: 5, text: tr("abdesi.step5"), image: require("../../../assets/images/abdesi/step5.png") },
        { id: 6, text: tr("abdesi.step6"), image: require("../../../assets/images/abdesi/step6.png") },
        { id: 7, text: tr("abdesi.step7"), image: require("../../../assets/images/abdesi/step7.png") },
        { id: 8, text: tr("abdesi.step8"), image: require("../../../assets/images/abdesi/step8.png") },
        { id: 9, text: tr("abdesi.step9"), image: require("../../../assets/images/abdesi/step9.png") },
        { id: 10, text: tr("abdesi.step10") },
    ];

    return (
        <AppFullScreen>
            <ScrollView
                style={[styles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {/* HEADER */}
                <AppCard style={[styles.headerCard, { backgroundColor: theme.card, borderColor: theme.secondary }]}>
                    <Text style={[styles.headerIcon]}>✨</Text>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                        {tr("abdesi.headerTitle")}
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: theme.placeholder }]}>
                        {tr("abdesi.headerSubtitle")}
                    </Text>
                </AppCard>

                {/* STEPS */}
                {steps.map((step) => (
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
        </AppFullScreen>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
        gap: 16,
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
        height: 161,
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
