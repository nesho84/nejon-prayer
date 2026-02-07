import { ScrollView, View, Text, Image, StyleSheet, useWindowDimensions } from "react-native";
import { TabView, TabBar } from 'react-native-tab-view';
import AppFullScreen from "@/components/AppFullScreen";
import AppCard from "@/components/AppCard";
import { useMemo, useState } from "react";
import { useThemeStore } from "@/store/themeStore";
import { useLanguageStore } from "@/store/languageStore";

interface StepType {
    id: number;
    text: string;
    image?: any;
}

interface tableType {
    name: string;
    sunnet: string;
    farz: string;
    sunnet2: string;
    vitri: string;
}

export default function NamaziScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);

    // State for tabs content
    const layout = useWindowDimensions();
    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'steps', title: tr.namazi.namaziTab || "NAMAZI" },
        { key: 'table', title: tr.namazi.rekatetTab || "TABELA E REKATEVE" },
    ]);

    // Prayer tab data
    const steps: StepType[] = useMemo(() => {
        return [
            { id: 1, text: tr.namazi.step1, image: require("../../../assets/images/namazi/step1.png") },
            { id: 2, text: tr.namazi.step2, image: require("../../../assets/images/namazi/step2.png") },
            { id: 3, text: tr.namazi.step3 },
            { id: 4, text: tr.namazi.step4, image: require("../../../assets/images/namazi/step4.png") },
            { id: 5, text: tr.namazi.step5, image: require("../../../assets/images/namazi/step5.png") },
            { id: 6, text: tr.namazi.step6, image: require("../../../assets/images/namazi/step6-8.png") },
            { id: 7, text: tr.namazi.step7, image: require("../../../assets/images/namazi/step7.png") },
            { id: 8, text: tr.namazi.step8, image: require("../../../assets/images/namazi/step6-8.png") },
            { id: 9, text: tr.namazi.step9 },
            { id: 10, text: tr.namazi.step10 },
            { id: 11, text: tr.namazi.step11, image: require("../../../assets/images/namazi/step11.png") },
            { id: 12, text: tr.namazi.step12, image: require("../../../assets/images/namazi/step12.png") },
        ];
    }, [tr]);

    // ------------------------------------------------------------
    // NAMAZI Tab Content
    // ------------------------------------------------------------
    const renderNamaziScene = () => (
        <ScrollView
            style={[styles.scrollContainer, { backgroundColor: theme.bg }]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* HEADER */}
            <AppCard style={[styles.headerCard, { backgroundColor: theme.card, borderColor: theme.success }]}>
                <Text style={[styles.headerIcon]}>🕌</Text>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                    {tr.namazi.headerTitle}
                </Text>
                <Text style={[styles.headerSubtitle, { color: theme.placeholder }]}>
                    {tr.namazi.headerSubtitle}
                </Text>
            </AppCard>

            {/* STEPS */}
            {steps.map((step) => (
                <AppCard key={step.id} style={[styles.stepCard, { backgroundColor: theme.card }]}>
                    <View style={styles.stepHeader}>
                        <View style={[styles.stepNumberCircle, { backgroundColor: theme.success }]}>
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

            {/* FOOTER NOTE */}
            <AppCard style={[styles.footerCard, { backgroundColor: theme.card, borderLeftColor: theme.success }]}>
                <Text style={[styles.footerText, { color: theme.placeholder }]}>
                    {tr.namazi.footerText}
                </Text>
            </AppCard>
        </ScrollView>
    );

    // Prayer table tab data
    const prayerTableData: tableType[] = useMemo(() => {
        return [
            { name: tr.prayers.Fajr, sunnet: "2", farz: "2", sunnet2: "", vitri: "" },
            { name: tr.prayers.Dhuhr, sunnet: "4", farz: "4", sunnet2: "2", vitri: "" },
            { name: tr.prayers.Asr, sunnet: "(4)", farz: "4", sunnet2: "", vitri: "" },
            { name: tr.prayers.Maghrib, sunnet: "", farz: "3", sunnet2: "2", vitri: "" },
            { name: tr.prayers.Isha, sunnet: "(4)", farz: "4", sunnet2: "2", vitri: "3" },
        ];
    }, [tr]);

    // Reusable styles
    const borderLeft = { borderLeftWidth: 1, borderLeftColor: theme.border };
    const farzColumn = { ...borderLeft, backgroundColor: theme.overlay };

    // ------------------------------------------------------------
    // PRAYER TABLE Tab Content
    // ------------------------------------------------------------
    const renderRekatetScene = () => (
        <ScrollView
            style={[styles.scrollContainer, { backgroundColor: theme.bg }]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* HEADER */}
            <AppCard style={[styles.headerCard, { backgroundColor: theme.card, borderColor: theme.placeholder }]}>
                <Text style={[styles.headerIcon]}>📝</Text>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                    {tr.namazi.tableTitle}
                </Text>
                <Text style={[styles.headerSubtitle, { color: theme.placeholder }]}>
                    {tr.namazi.tableSubtitle}
                </Text>
            </AppCard>

            {/* Prayer Table */}
            <AppCard style={[styles.tableCard, { backgroundColor: theme.card }]}>
                {/* Header Row */}
                <View style={[styles.tableRow, { borderBottomWidth: 2, borderBottomColor: theme.border }]}>
                    <View style={[styles.tableCell, styles.nameColumn, styles.cornerCell]}>
                        <Text style={[styles.cornerTopText, { color: theme.text2 }]}>
                            {tr.namazi.tableRekatetLabel}
                        </Text>
                        <Text style={[styles.cornerBottomText, { color: theme.text2 }]}>
                            {tr.namazi.tableNameHeader}
                        </Text>
                    </View>
                    <View style={[styles.tableCell, borderLeft]}>
                        <Text style={[styles.tableHeaderText, { color: theme.text2 }]}>
                            {tr.namazi.tableSunnetHeader}
                        </Text>
                    </View>
                    <View style={[styles.tableCell, farzColumn]}>
                        <Text style={[styles.tableHeaderTextBold, { color: theme.accent }]}>
                            {tr.namazi.tableFarzHeader}
                        </Text>
                    </View>
                    <View style={[styles.tableCell, borderLeft]}>
                        <Text style={[styles.tableHeaderText, { color: theme.text2 }]}>
                            {tr.namazi.tableSunnetHeader}
                        </Text>
                    </View>
                    <View style={[styles.tableCell, borderLeft]}>
                        <Text style={[styles.tableHeaderText, { color: theme.text2 }]}>
                            {tr.namazi.tableVitriHeader}
                        </Text>
                    </View>
                </View>

                {/* Data Rows */}
                {prayerTableData.map((prayer, idx) => (
                    <View key={idx} style={[styles.tableRow, { borderTopWidth: 1, borderTopColor: theme.border }]}>
                        <View style={[styles.tableCell, styles.nameColumn, { backgroundColor: theme.overlay }]}>
                            <Text style={[styles.tableCellText, { color: theme.text2, fontStyle: 'italic' }]}>
                                {prayer.name}
                            </Text>
                        </View>
                        <View style={[styles.tableCell, borderLeft]}>
                            <Text style={[styles.tableCellText, { color: theme.text2 }]}>
                                {prayer.sunnet}
                            </Text>
                        </View>
                        <View style={[styles.tableCell, farzColumn]}>
                            <Text style={[styles.tableCellTextBold, { color: theme.accent }]}>
                                {prayer.farz}
                            </Text>
                        </View>
                        <View style={[styles.tableCell, borderLeft]}>
                            <Text style={[styles.tableCellText, { color: theme.text2 }]}>
                                {prayer.sunnet2}
                            </Text>
                        </View>
                        <View style={[styles.tableCell, borderLeft]}>
                            <Text style={[styles.tableCellText, { color: theme.text2 }]}>
                                {prayer.vitri}
                            </Text>
                        </View>
                    </View>
                ))}
            </AppCard>

            {/* Footer Note */}
            <AppCard style={[styles.footerCard, { backgroundColor: theme.card, borderLeftColor: theme.placeholder }]}>
                <Text style={[styles.footerText, { color: theme.placeholder }]}>
                    {tr.namazi.tableFooter}
                </Text>
            </AppCard>
        </ScrollView>
    );

    // ------------------------------------------------------------
    // Tab View Scene Renderer
    // ------------------------------------------------------------
    const renderScene = ({ route }: { route: { key: string } }) => {
        switch (route.key) {
            case 'steps':
                return renderNamaziScene();
            case 'table':
                return renderRekatetScene();
            default:
                return null;
        }
    };

    return (
        <AppFullScreen>
            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                initialLayout={{ width: layout.width }}
                renderTabBar={(props) => (
                    <TabBar
                        {...props}
                        indicatorStyle={{ backgroundColor: theme.success, height: 3 }}
                        style={{
                            backgroundColor: theme.card,
                            elevation: 2,
                            shadowColor: theme.text,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 3,
                        }}
                        activeColor={theme.success}
                        inactiveColor={theme.placeholder}
                        pressColor={theme.bg2}
                        pressOpacity={0.8}
                    />
                )}
            />
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
        padding: 10,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 16,
        borderRadius: 16,
    },
    stepImage: {
        width: 241,
        height: 241,
        borderRadius: 12,
        resizeMode: "contain",
    },

    // Table styles
    tableCard: {
        padding: 0,
        overflow: 'hidden',
    },
    tableRow: {
        flexDirection: 'row',
    },
    tableCell: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nameColumn: {
        flex: 1.3,
    },
    cornerCell: {
        position: 'relative',
    },
    cornerTopText: {
        position: 'absolute',
        top: 5,
        right: 8,
        fontSize: 12,
        fontWeight: '500',
    },
    cornerBottomText: {
        position: 'absolute',
        bottom: 5,
        left: 8,
        fontSize: 12,
        fontWeight: '500',
    },
    tableHeaderText: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    tableHeaderTextBold: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },
    tableCellText: {
        fontSize: 15,
        fontWeight: '400',
        textAlign: 'center',
    },
    tableCellTextBold: {
        fontSize: 17,
        fontWeight: '700',
        textAlign: 'center',
    },

    // Footer card
    footerCard: {
        padding: 22,
        borderLeftWidth: 4,
    },
    footerText: {
        fontSize: 14,
        lineHeight: 22,
        fontWeight: "400",
        fontStyle: "italic",
        textAlign: "justify",
    },
});