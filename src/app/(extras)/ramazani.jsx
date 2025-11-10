import { ScrollView, View, Text, Image, StyleSheet } from "react-native";
import { useThemeContext } from "@/context/ThemeContext";
import useTranslation from "@/hooks/useTranslation";
import AppFullScreen from "@/components/AppFullScreen";

// --- Placeholder step definitions ---
const steps = [
    { id: 1, text: "Step 1 description...", image: null },
    { id: 2, text: "Step 2 description...", image: null },
    { id: 3, text: "Step 3 description...", image: null },
    { id: 4, text: "Step 4 description...", image: null },
    { id: 5, text: "Step 5 description...", image: null },
    { id: 6, text: "Step 6 description...", image: null },
    { id: 7, text: "Step 7 description...", image: null },
    { id: 8, text: "Step 8 description...", image: null },
];

export default function RamazaniScreen() {
    const { theme } = useThemeContext();
    const { tr } = useTranslation();

    return (
        <AppFullScreen>
            <ScrollView
                style={[styles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {/* Title */}
                <Text style={[styles.title, { color: theme.text }]}>Ramadan Guide</Text>
                <Text style={[styles.subtitle, { color: theme.placeholder }]}>Step-by-step guide for everyone</Text>

                {/* Steps */}
                {steps.map((step) => (
                    <View key={step.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <View style={styles.stepHeader}>
                            <View style={[styles.stepNumberCircle, { backgroundColor: theme.primary }]}>
                                <Text style={[styles.stepNumber, { color: "#fff" }]}>{step.id}</Text>
                            </View>
                            <Text style={[styles.stepText, { color: theme.text }]}>{step.text}</Text>
                        </View>
                        {step.image === null && (
                            <View style={[styles.placeholderImage, { backgroundColor: theme.placeholder }]}>
                                <Text style={{ color: "#fff" }}>Image Placeholder</Text>
                            </View>
                        )}
                    </View>
                ))}

                {/* Conclusion */}
                <View style={[styles.conclusionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.conclusionText, { color: theme.text }]}>Ramadan is complete! Remember to maintain peace.</Text>
                </View>

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
        paddingTop: 24,
        paddingBottom: 24,
        gap: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: "400",
        textAlign: "center",
        marginBottom: 20,
    },
    card: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    stepHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    stepNumberCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    stepNumber: {
        fontSize: 16,
        fontWeight: "700",
    },
    stepText: {
        flex: 1,
        fontSize: 16,
        fontWeight: "400",
        lineHeight: 22,
    },
    placeholderImage: {
        width: "100%",
        height: 160,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 8,
    },
    conclusionCard: {
        padding: 16,
        borderRadius: 12,
        marginTop: 16,
        borderWidth: 1,
    },
    conclusionText: {
        fontSize: 16,
        fontWeight: "400",
        textAlign: "center",
    },
});