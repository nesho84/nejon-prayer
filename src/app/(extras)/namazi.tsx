import AppCard from "@/components/AppCard";
import AppScreen from "@/components/AppScreen";
import { NAMAZI_SURAHS, NAMAZI_TRANSLATIONS } from "@/constants/namazi";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { TabBar, TabView } from 'react-native-tab-view';

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

type SurahCell = { label: string; accent: boolean }[];

export default function NamaziScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);
    const language = useLanguageStore((state) => state.language);
    const namaziTr = NAMAZI_TRANSLATIONS[language] ?? NAMAZI_TRANSLATIONS.en;

    // State for tabs content
    const layout = useWindowDimensions();
    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'steps', title: namaziTr.namaziTab || "NAMAZI" },
        { key: 'table', title: namaziTr.rekatetTab || "TABELA E REKATEVE" },
    ]);

    // Prayer tab data
    const STEPS: StepType[] = useMemo(() => {
        return [
            { id: 1, text: namaziTr.step1, image: require("../../../assets/images/namazi/step1.png") },
            { id: 2, text: namaziTr.step2, image: require("../../../assets/images/namazi/step2.png") },
            { id: 3, text: namaziTr.step3 },
            { id: 4, text: namaziTr.step4, image: require("../../../assets/images/namazi/step4.png") },
            { id: 5, text: namaziTr.step5, image: require("../../../assets/images/namazi/step5.png") },
            { id: 6, text: namaziTr.step6, image: require("../../../assets/images/namazi/step6-8.png") },
            { id: 7, text: namaziTr.step7, image: require("../../../assets/images/namazi/step7.png") },
            { id: 8, text: namaziTr.step8, image: require("../../../assets/images/namazi/step6-8.png") },
            { id: 9, text: namaziTr.step9 },
            { id: 10, text: namaziTr.step10 },
            { id: 11, text: namaziTr.step11, image: require("../../../assets/images/namazi/step11.png") },
            { id: 12, text: namaziTr.step12, image: require("../../../assets/images/namazi/step12.png") },
        ];
    }, [namaziTr]);

    // Surah / dua block renderer
    const renderSurahBlock = (key: string) => {
        const surah = NAMAZI_SURAHS[key];
        return (
            <View key={key} style={[styles.surahBlock, { borderTopColor: theme.border }]}>
                <Text style={[styles.surahName, { color: theme.success }]}>{surah.name}</Text>
                {language === 'ar' ? (
                    <Text style={[styles.surahArabic, { color: theme.text }]}>{surah.arabic}</Text>
                ) : (
                    <Text style={[styles.surahTranslit, { color: theme.placeholder }]}>{surah.transliteration}</Text>
                )}
            </View>
        );
    };

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
                    {namaziTr.headerTitle}
                </Text>
                <Text style={[styles.headerSubtitle, { color: theme.placeholder }]}>
                    {namaziTr.headerSubtitle}
                </Text>
            </AppCard>

            {/* STEPS */}
            {STEPS.map((step) => (
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

                    {step.id === 2 && renderSurahBlock('subhaneke')}

                    {step.id === 3 && (
                        <>
                            {renderSurahBlock('taawwudh')}
                            {renderSurahBlock('fatiha')}
                            {renderSurahBlock('kawthar')}
                            {renderSurahBlock('ikhlas')}
                        </>
                    )}

                    {step.id === 11 && (
                        <>
                            {renderSurahBlock('attahiyyatu')}
                            {renderSurahBlock('allahummaSalli')}
                            {renderSurahBlock('allahummaBarik')}
                            {renderSurahBlock('rabbena')}
                        </>
                    )}
                </AppCard>
            ))}

            {/* FOOTER NOTE */}
            <AppCard style={[styles.footerCard, { backgroundColor: theme.card, borderLeftColor: theme.success }]}>
                <Text style={[styles.footerText, { color: theme.placeholder }]}>
                    {namaziTr.footerText}
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

    // Surahs table data
    const surahsTableData: SurahCell[][] = useMemo(() => {
        const r1: SurahCell = [
            { label: "Subhaneke", accent: false },
            { label: "Eudhubilahi", accent: false },
            { label: "Fatiha", accent: false },
            { label: "(Kewthar)", accent: false },
        ];
        const r2mid: SurahCell = [
            { label: "Fatiha", accent: false },
            { label: "(Ihlas)", accent: false },
            { label: "Et-Tehijatu", accent: true },
        ];
        const r2last: SurahCell = [...r2mid, { label: "SELAMI", accent: true }];
        const rfatiha: SurahCell = [{ label: "Fatiha", accent: false }];
        const rlast: SurahCell = [
            { label: "Fatiha", accent: false },
            { label: "Et-Tehijatu", accent: true },
            { label: "SELAMI", accent: true },
        ];
        return [
            [r1, r1, r1, r1, r1],
            [r2last, r2mid, r2mid, r2mid, r2mid],
            [[], rfatiha, rfatiha, rlast, rfatiha],
            [[], rlast, rlast, [], rlast],
        ];
    }, []);

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
                    {namaziTr.tableTitle}
                </Text>
                <Text style={[styles.headerSubtitle, { color: theme.placeholder }]}>
                    {namaziTr.tableSubtitle}
                </Text>
            </AppCard>

            {/* Prayer Table */}
            <AppCard style={[styles.tableCard, { backgroundColor: theme.card }]}>
                {/* Header Row */}
                <View style={[styles.tableRow, { borderBottomWidth: 2, borderBottomColor: theme.border }]}>
                    <View style={[styles.tableCell, styles.nameColumn, styles.cornerCell]}>
                        <Text style={[styles.cornerTopText, { color: theme.text2 }]}>
                            {namaziTr.tableRekatetLabel}
                        </Text>
                        <Text style={[styles.cornerBottomText, { color: theme.text2 }]}>
                            {namaziTr.tableNameHeader}
                        </Text>
                    </View>
                    <View style={[styles.tableCell, borderLeft]}>
                        <Text style={[styles.tableHeaderText, { color: theme.text2 }]}>
                            {namaziTr.tableSunnetHeader}
                        </Text>
                    </View>
                    <View style={[styles.tableCell, farzColumn]}>
                        <Text style={[styles.tableHeaderTextBold, { color: theme.accent }]}>
                            {namaziTr.tableFarzHeader}
                        </Text>
                    </View>
                    <View style={[styles.tableCell, borderLeft]}>
                        <Text style={[styles.tableHeaderText, { color: theme.text2 }]}>
                            {namaziTr.tableSunnetHeader}
                        </Text>
                    </View>
                    <View style={[styles.tableCell, borderLeft]}>
                        <Text style={[styles.tableHeaderText, { color: theme.text2 }]}>
                            {namaziTr.tableVitriHeader}
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

            {/* Surahs Table Title */}
            <View style={[styles.sectionDivider, { borderColor: theme.divider2 }]} />

            {/* Surahs Table */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <AppCard style={[styles.tableCard, { backgroundColor: theme.card }]}>
                    {/* Header Row */}
                    <View style={[styles.tableRow, { borderBottomWidth: 2, borderBottomColor: theme.border }]}>
                        <View style={[styles.tableCell, styles.cornerCell, { flex: 0, width: 70 }]}>
                            <Text style={[styles.cornerTopText, { color: theme.text2 }]}>
                                {namaziTr.tableNameHeader}
                            </Text>
                            <Text style={[styles.cornerBottomText, { color: theme.text2 }]}>
                                {namaziTr.tableRekatetLabel}
                            </Text>
                        </View>
                        {[tr.prayers.Fajr, tr.prayers.Dhuhr, tr.prayers.Asr, tr.prayers.Maghrib, tr.prayers.Isha].map((name, i) => (
                            <View key={i} style={[styles.tableCell, { flex: 0, width: 90 }, borderLeft]}>
                                <Text style={[styles.tableHeaderText, { color: theme.text2 }]}>{name}</Text>
                            </View>
                        ))}
                    </View>
                    {/* Data Rows */}
                    {surahsTableData.map((row, rIdx) => (
                        <View key={rIdx} style={[styles.tableRow, { borderTopWidth: 1, borderTopColor: theme.border }]}>
                            <View style={[styles.tableCell, { flex: 0, width: 70, backgroundColor: theme.overlay }]}>
                                <Text style={[styles.tableCellTextBold, { color: theme.accent }]}>{rIdx + 1}</Text>
                            </View>
                            {row.map((cell, cIdx) => (
                                <View key={cIdx} style={[styles.tableCell, { flex: 0, width: 90 }, borderLeft]}>
                                    {cell.length === 0
                                        ? <Text style={[styles.tableCellText, { color: theme.placeholder }]}>{'—'}</Text>
                                        : cell.map((item, iIdx) => (
                                            <Text
                                                key={iIdx}
                                                style={[
                                                    item.accent ? styles.surahCellAccent : styles.surahCellText,
                                                    { color: item.accent ? theme.accent : theme.text2 },
                                                ]}
                                            >
                                                {item.label}
                                            </Text>
                                        ))
                                    }
                                </View>
                            ))}
                        </View>
                    ))}
                </AppCard>
            </ScrollView>

            {/* Footer Note */}
            <AppCard style={[styles.footerCard, { backgroundColor: theme.card, borderLeftColor: theme.placeholder }]}>
                <Text style={[styles.footerText, { color: theme.placeholder }]}>
                    {namaziTr.tableFooter}
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
        <AppScreen>
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

    // Surah blocks
    surahBlock: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: StyleSheet.hairlineWidth,
        gap: 6,
    },
    surahName: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    surahArabic: {
        fontSize: 20,
        lineHeight: 36,
        textAlign: 'right',
        writingDirection: 'rtl',
    },
    surahTranslit: {
        fontSize: 14,
        lineHeight: 21,
        fontStyle: 'italic',
    },

    // Surahs table section separator + title
    sectionDivider: {
        marginVertical: 8,
        borderWidth: 1,
    },

    // Surahs table cell styles
    surahsTableCard: {
        padding: 0,
    },
    surahsNameCell: {
        width: 52,
        paddingVertical: 12,
        paddingHorizontal: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    surahsPrayerCell: {
        width: 84,
        paddingVertical: 12,
        paddingHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    surahColHeader: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
    },
    surahCellText: {
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 17,
    },
    surahCellAccent: {
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 17,
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