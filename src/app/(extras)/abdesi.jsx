import { ScrollView, View, Text, StyleSheet } from "react-native";
import { useThemeContext } from "@/context/ThemeContext";
import useTranslation from "@/hooks/useTranslation";
import AppFullScreen from "@/components/AppFullScreen";
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AppCard from "@/components/AppCard";


export default function AbdesiScreen() {
    const { theme } = useThemeContext();
    const { tr } = useTranslation();

    const steps = [
        { id: 1, text: tr("abdesi.step1") },
        { id: 2, text: tr("abdesi.step2"), image: null },
        { id: 3, text: tr("abdesi.step3"), image: null },
        { id: 4, text: tr("abdesi.step4"), image: null },
        { id: 5, text: tr("abdesi.step5"), image: null },
        { id: 6, text: tr("abdesi.step6"), image: null },
        { id: 7, text: tr("abdesi.step7"), image: null },
        { id: 8, text: tr("abdesi.step8"), image: null },
        { id: 9, text: tr("abdesi.step9"), image: null },
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
                {/* <View style={styles.header}>
                    <Text style={[styles.headerText, { color: theme.text2 }]}>
                        {tr("abdesi.header")}
                    </Text>
                </View> */}

                {/* STEPS */}
                {steps.map((step) => (
                    <AppCard key={step.id} style={[styles.stepCard, { backgroundColor: theme.card }]}>
                        <View style={styles.stepHeader}>
                            <View style={[styles.stepNumberCircle, { backgroundColor: theme.danger }]}>
                                <Text style={[styles.stepNumber, { color: theme.white }]}>{step.id}</Text>
                            </View>
                            <Text style={[styles.stepText, { color: theme.text2 }]}>{step.text}</Text>
                        </View>

                        {step.image === null && (
                            <View style={[styles.placeholderImage, { backgroundColor: theme.placeholder }]}>
                                <Ionicons name="image-outline" size={36} color={theme.text2} />
                                <Text style={{ color: theme.text2, marginTop: 4 }}>Image Placeholder</Text>
                            </View>
                        )}
                    </AppCard>
                ))}

                {/* FOOTER */}
                <View style={[styles.footer, { borderTopColor: theme.border }]}>
                    <MaterialCommunityIcons name="shield-check" size={32} color={theme.success} />
                    <Text style={[styles.footerText, { color: theme.text2 }]}>
                        {tr("abdesi.footer")}
                    </Text>
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
        paddingTop: 12,
        paddingBottom: 24,
        gap: 16,
    },

    // Header
    header: {
        alignItems: "center",
        paddingHorizontal: 4,
        marginVertical: 16,
    },
    headerText: {
        fontSize: 16,
        textAlign: "center",
        lineHeight: 22,
        opacity: 0.6,
    },

    // Step cards
    stepCard: {
        padding: 16,
    },
    stepHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    stepNumberCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    stepNumber: {
        fontSize: 15,
        fontWeight: "700",
    },
    stepText: {
        flex: 1,
        fontSize: 16,
        lineHeight: 22,
        fontWeight: "400",
    },
    placeholderImage: {
        width: "100%",
        height: 160,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 16,
    },

    // Footer
    footer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        marginVertical: 16,
        gap: 16,
    },
    footerText: {
        flex: 1,
        fontSize: 16,
        lineHeight: 22,
        opacity: 0.6,
    },
});
