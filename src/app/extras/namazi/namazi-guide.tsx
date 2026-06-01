import AppCard from "@/components/AppCard";
import AppLayout from "@/components/AppLayout";
import { globalStyles } from "@/constants/styles";
import { NAMAZI_GUIDE_TR, NAMAZI_SURAHS } from "@/constants/translations/namazi-guide.tr";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { useCallback, useMemo, useRef, useState } from "react";
import { Image, ImageSourcePropType, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TabBar, TabView } from 'react-native-tab-view';

interface StepType {
    id: number;
    text: string;
    image?: ImageSourcePropType;
}

interface tableType {
    name: string;
    sunnet: string;
    farz: string;
    sunnet2: string;
    vitri: string;
}

export default function NamaziGuideScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);
    const language = useLanguageStore((state) => state.language);
    const namaziTr = NAMAZI_GUIDE_TR[language] ?? NAMAZI_GUIDE_TR.en;

    // Local state - for tabs content
    const layout = useWindowDimensions();
    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'steps', title: namaziTr.namaziTab || "NAMAZI" },
        { key: 'table', title: namaziTr.rekatetTab || "TABELA E REKATEVE" },
    ]);
    const [expandedSurahs, setExpandedSurahs] = useState<Set<string>>(new Set());

    // Safe area insets
    const insets = useSafeAreaInsets();

    // ------------------------------------------------------------
    // Steps data - Namazi Tab
    // ------------------------------------------------------------
    const STEPS: StepType[] = useMemo(() => {
        return [
            { id: 1, text: namaziTr.step1, image: require("../../../../assets/images/namazi/step1.png") },
            { id: 2, text: namaziTr.step2, image: require("../../../../assets/images/namazi/step2.png") },
            { id: 3, text: namaziTr.step3, image: require("../../../../assets/images/namazi/step3.png") },
            { id: 4, text: namaziTr.step4, image: require("../../../../assets/images/namazi/step4.png") },
            { id: 5, text: namaziTr.step5, image: require("../../../../assets/images/namazi/step5.png") },
            { id: 6, text: namaziTr.step6, image: require("../../../../assets/images/namazi/step6.png") },
            { id: 7, text: namaziTr.step7, image: require("../../../../assets/images/namazi/step5.png") },
            { id: 8, text: namaziTr.step8, image: require("../../../../assets/images/namazi/step2.png") },
            { id: 9, text: namaziTr.step9, image: require("../../../../assets/images/namazi/step3.png") },
            { id: 10, text: namaziTr.step10, image: require("../../../../assets/images/namazi/step4.png") },
            { id: 11, text: namaziTr.step11, image: require("../../../../assets/images/namazi/step5.png") },
            { id: 12, text: namaziTr.step12, image: require("../../../../assets/images/namazi/step6.png") },
            { id: 13, text: namaziTr.step13, image: require("../../../../assets/images/namazi/step5.png") },
            { id: 14, text: namaziTr.step14, image: require("../../../../assets/images/namazi/step14.png") },
            { id: 15, text: namaziTr.step15, image: require("../../../../assets/images/namazi/step15.png") },
        ];
    }, [namaziTr]);

    // ------------------------------------------------------------
    // Progress tracking
    // ------------------------------------------------------------
    const stepLayouts = useRef<{ [id: number]: number }>({});
    const [currentStep, setCurrentStep] = useState(1);
    const handleScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
        const y = e.nativeEvent.contentOffset.y;
        let active = 1;
        for (const step of STEPS) {
            const stepY = stepLayouts.current[step.id];
            if (stepY !== undefined && stepY <= y + 200) {
                active = step.id;
            }
        }
        setCurrentStep(active);
    }, [STEPS]);

    // ------------------------------------------------------------
    // Surah / dua block renderer (collapsible)
    // ------------------------------------------------------------
    const toggleSurah = (stepId: number, key: string) => {
        const uid = `${stepId}-${key}`;
        setExpandedSurahs(prev => {
            const next = new Set(prev);
            if (next.has(uid)) next.delete(uid);
            else next.add(uid);
            return next;
        });
    };

    // ------------------------------------------------------------
    // Renders a collapsible block for a surah/dua with Arabic and transliteration (Namazi Tab)
    // ------------------------------------------------------------
    const renderSurahBlock = (stepId: number, key: string) => {
        const surah = NAMAZI_SURAHS[key];
        const uid = `${stepId}-${key}`;
        const expanded = expandedSurahs.has(uid);
        return (
            <View key={uid} style={[styles.surahsBlock, { borderTopColor: theme.border }]}>
                <Pressable
                    style={({ pressed }) => [styles.surahsToggleRow, { opacity: pressed ? 0.4 : 1 }]}
                    onPress={() => toggleSurah(stepId, key)}
                    hitSlop={8}
                >
                    <Text style={[styles.surahsName, { color: theme.islamicGreen }]}>{surah.name}</Text>
                    <Text style={[styles.surahsChevron, { color: theme.islamicGreen }]}>
                        {expanded ? '▲' : '▼'}
                    </Text>
                </Pressable>
                {expanded && (
                    language === 'ar' ? (
                        <Text style={[styles.surahsArabic, { color: theme.text }]}>{surah.arabic}</Text>
                    ) : (
                        <Text style={[styles.surahsTranslit, { color: theme.placeholder }]}>{surah.transliteration}</Text>
                    )
                )}
            </View>
        );
    };

    // ------------------------------------------------------------
    // NAMAZI Tab Content
    // ------------------------------------------------------------
    const renderNamazTab = () => (
        <View style={styles.namaziTab}>

            {/* PROGRESS (fixed below tabs) */}
            <View style={[globalStyles.progressWrapper, { backgroundColor: theme.statusbar, borderBottomColor: theme.divider2 }]}>
                <View style={[globalStyles.progressTrack, { backgroundColor: theme.border }]}>
                    <View style={[globalStyles.progressFill, { backgroundColor: theme.secondary, width: `${(currentStep / STEPS.length) * 100}%` as any }]} />
                </View>
                <Text style={[styles.progressText, { color: theme.placeholder }]}>
                    {tr.labels.stepLabel} {currentStep} / {STEPS.length}
                </Text>
            </View>

            <ScrollView
                style={[globalStyles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={[
                    globalStyles.scrollContent,
                    { paddingTop: 12, paddingBottom: insets.bottom + 24 }
                ]}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                {/* HEADER */}
                <AppCard style={[styles.headerCard, { backgroundColor: theme.card, borderColor: theme.islamicGreen }]}>
                    <Text style={globalStyles.headerIcon}>🕌</Text>
                    <Text style={[globalStyles.headerTitle, { color: theme.text }]}>
                        {namaziTr.headerTitle}
                    </Text>
                    <Text style={[globalStyles.headerSubtitle, { color: theme.placeholder }]}>
                        {namaziTr.headerSubtitle}
                    </Text>
                </AppCard>

                {/* STEPS */}
                {STEPS.map((step) => (
                    <AppCard
                        key={step.id}
                        style={[styles.stepCard, { backgroundColor: theme.card }]}
                        onLayout={(e) => { stepLayouts.current[step.id] = e.nativeEvent.layout.y; }}
                    >
                        <View style={styles.stepCircleLeft}>
                            <View style={[globalStyles.numberCircle, { backgroundColor: theme.islamicGreen }]}>
                                <Text style={[styles.stepNumberText, { color: theme.card }]}>{step.id}</Text>
                            </View>
                            <Text style={[styles.stepText, { color: theme.text2 }]}>{step.text}</Text>
                        </View>

                        {step.image && (
                            <View style={[styles.stepImageContainer, { backgroundColor: theme.bg }]}>
                                <Image source={step.image} style={styles.stepImage} />
                            </View>
                        )}

                        {step.id === 2 && (
                            <>
                                {renderSurahBlock(step.id, 'subhaneke')}
                                {renderSurahBlock(step.id, 'taawwudh')}
                                {renderSurahBlock(step.id, 'fatiha')}
                                {renderSurahBlock(step.id, 'kawthar')}
                                {renderSurahBlock(step.id, 'ikhlas')}
                            </>
                        )}

                        {step.id === 8 && (
                            <>
                                {renderSurahBlock(step.id, 'fatiha')}
                                {renderSurahBlock(step.id, 'kawthar')}
                                {renderSurahBlock(step.id, 'ikhlas')}
                            </>
                        )}

                        {step.id === 14 && (
                            <>
                                {renderSurahBlock(step.id, 'attahiyyatu')}
                                {renderSurahBlock(step.id, 'allahummaSalli')}
                                {renderSurahBlock(step.id, 'allahummaBarik')}
                                {renderSurahBlock(step.id, 'rabbena')}
                            </>
                        )}
                    </AppCard>
                ))}

                 {/* Footer Note */}
                <AppCard style={[styles.footerCard, { backgroundColor: theme.card, borderLeftColor: theme.placeholder }]}>
                    <Text style={[styles.footerText, { color: theme.placeholder }]}>
                        {namaziTr.footerText}
                    </Text>
                </AppCard>
            </ScrollView>
        </View>
    );

    // ------------------------------------------------------------
    // Prayer table tab data
    // ------------------------------------------------------------
    const prayerTableData: tableType[] = useMemo(() => {
        return [
            { name: tr.prayers.Fajr, sunnet: "2", farz: "2", sunnet2: "", vitri: "" },
            { name: tr.prayers.Dhuhr, sunnet: "4", farz: "4", sunnet2: "2", vitri: "" },
            { name: tr.prayers.Asr, sunnet: "(4)", farz: "4", sunnet2: "", vitri: "" },
            { name: tr.prayers.Maghrib, sunnet: "", farz: "3", sunnet2: "2", vitri: "" },
            { name: tr.prayers.Isha, sunnet: "(4)", farz: "4", sunnet2: "2", vitri: "3" },
        ];
    }, [tr]);

    // ------------------------------------------------------------
    // Detailed surah breakdown per rak'ah for each prayer
    // ------------------------------------------------------------
    const prayerSurahsData = useMemo(() => {
        // UI labels from translations (column headers + selam label)
        const { tableSunnetHeader: sun, tableFarzHeader: farz, tableVitriHeader: vitr, tableRekatetLabel: rek, selamiLabel: sel } = namaziTr;
        // Surah display names from the surah data constant
        const { subhaneke: { name: subhaneke }, taawwudh: { name: taawwudh }, fatiha: { name: fatiha }, kawthar: { name: kawthar }, ikhlas: { name: ikhlas }, attahiyyatu: { name: attahiyyatu } } = NAMAZI_SURAHS;

        // 1st rak'at of any prayer: opening duas → fatiha → short surah
        const rakatOpening = `${subhaneke} » ${taawwudh} » ${fatiha} » ${kawthar}`;
        // Middle rak'ats (sunnah 2nd / farz 2nd): fatiha → short surah → tashahhud
        const rakatMiddle = `${fatiha} » ${ikhlas} » ${attahiyyatu}`;
        // Last rak'at of 2-rak'at prayers: same as middle but ends with selam
        const rakatClosing = `${fatiha} » ${ikhlas} » ${attahiyyatu} + ${sel}`;
        // Sunnah 3rd/4th rak'at: fatiha → alternating short surah (Kawthar or Ikhlas)
        const rakatSunnahMid = `${fatiha} » ${kawthar} / ${ikhlas}`;
        // Farz 3rd rak'at: fatiha only, no extra surah recited
        const rakatFarzThird = fatiha;
        // Farz last rak'at (4th, or Maghrib 3rd): fatiha → tashahhud + selam
        const rakatFarzClosing = `${fatiha} » ${attahiyyatu} + ${sel}`;
        return [
            {
                // Fajr: 2 sunnah + 2 farz (shortest prayer, no middle rak'ats)
                name: tr.prayers.Fajr, summary: `2 ${sun} + 2 ${farz}`, sections: [
                    { label: `${sun} (2 ${rek}):`, isFarz: false, rows: [rakatOpening, rakatClosing] },
                    { label: `${farz} (2 ${rek}):`, isFarz: true, rows: [rakatOpening, rakatClosing] },
                ]
            },
            {
                // Dhuhr: 4 sunnah + 4 farz + 2 sunnah
                name: tr.prayers.Dhuhr, summary: `4 ${sun} + 4 ${farz} + 2 ${sun}`, sections: [
                    { label: `${sun} (4 ${rek}):`, isFarz: false, rows: [rakatOpening, rakatMiddle, rakatSunnahMid, rakatClosing] },
                    { label: `${farz} (4 ${rek}):`, isFarz: true, rows: [rakatOpening, rakatMiddle, rakatFarzThird, rakatFarzClosing] },
                    { label: `${sun} (2 ${rek}):`, isFarz: false, rows: [rakatOpening, rakatClosing] },
                ]
            },
            {
                // Asr: 4 sunnah (optional) + 4 farz
                name: tr.prayers.Asr, summary: `(4 ${sun}) + 4 ${farz}`, sections: [
                    { label: `(4 ${sun}):`, isFarz: false, rows: [rakatOpening, rakatMiddle, rakatSunnahMid, rakatClosing] },
                    { label: `${farz} (4 ${rek}):`, isFarz: true, rows: [rakatOpening, rakatMiddle, rakatFarzThird, rakatFarzClosing] },
                ]
            },
            {
                // Maghrib: 3 farz + 2 sunnah (only 3-rak'at farz, no 4th rak'at)
                name: tr.prayers.Maghrib, summary: `3 ${farz} + 2 ${sun}`, sections: [
                    { label: `${farz} (3 ${rek}):`, isFarz: true, rows: [rakatOpening, rakatMiddle, rakatFarzClosing] },
                    { label: `${sun} (2 ${rek}):`, isFarz: false, rows: [rakatOpening, rakatClosing] },
                ]
            },
            {
                // Isha: 4 sunnah (optional) + 4 farz + 2 sunnah + 3 witr
                name: tr.prayers.Isha, summary: `(4 ${sun}) + 4 ${farz} + 2 ${sun} + 3 ${vitr}`, sections: [
                    { label: `(4 ${sun}):`, isFarz: false, rows: [rakatOpening, rakatMiddle, rakatSunnahMid, rakatClosing] },
                    { label: `${farz} (4 ${rek}):`, isFarz: true, rows: [rakatOpening, rakatMiddle, rakatFarzThird, rakatFarzClosing] },
                    { label: `${sun} (2 ${rek}):`, isFarz: false, rows: [rakatOpening, rakatClosing] },
                    // Witr 3rd rak'at adds Kunut dua before the final tashahhud
                    { label: `${vitr} (3 ${rek}):`, isFarz: false, rows: [rakatOpening, rakatMiddle, `${fatiha} » ${ikhlas} » Kunut » ${attahiyyatu} + ${sel}`] },
                ]
            },
        ];
    }, [namaziTr, tr]);

    // Reusable styles
    const borderLeft = { borderLeftWidth: 1, borderLeftColor: theme.border };
    const farzColumn = { ...borderLeft, backgroundColor: theme.overlay };

    // ------------------------------------------------------------
    // REKATE TABLE Tab Content
    // ------------------------------------------------------------
    const renderRekatTab = () => (
        <ScrollView
            style={[globalStyles.scrollContainer, { backgroundColor: theme.bg }]}
            contentContainerStyle={[
                globalStyles.scrollContent,
                { paddingTop: 12, paddingBottom: insets.bottom + 24 }
            ]}
            showsVerticalScrollIndicator={false}
        >
            {/* HEADER */}
            <AppCard style={[styles.headerCard, { backgroundColor: theme.card, borderColor: theme.placeholder }]}>
                <Text style={globalStyles.headerIcon}>📝</Text>
                <Text style={[globalStyles.headerTitle, { color: theme.text }]}>
                    {namaziTr.tableTitle}
                </Text>
                <Text style={[globalStyles.headerSubtitle, { color: theme.placeholder }]}>
                    {namaziTr.tableSubtitle}
                </Text>
            </AppCard>

            {/* --- Rekate Table --- */}
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

            {/* --- Surahs Per Rak'ah --- */}
            <AppCard style={[styles.prayerSurahCard, { backgroundColor: theme.card }]}>
                {prayerSurahsData.map((prayer, pIdx) => (
                    <View key={pIdx} style={pIdx > 0 ? [styles.prayerDivider, { borderTopColor: theme.borderCard }] : undefined}>
                        <View style={styles.prayerHeader}>
                            <Text style={[styles.prayerSurahTitle, { color: theme.text2 }]}>{prayer.name}</Text>
                            <Text style={[styles.prayerSummary, { color: theme.text2 }]}> — {prayer.summary}</Text>
                        </View>
                        {prayer.sections.map((section, sIdx) => (
                            <View key={sIdx} style={styles.sectionBlock}>
                                <Text style={[styles.sectionLabel, { color: theme.accent2 }]}>
                                    {section.label}
                                </Text>
                                {section.rows.map((row, rIdx) => (
                                    <Text key={rIdx} style={[styles.rakatRowText, { color: theme.text2 }]}>
                                        <Text style={[styles.rakatNum, { color: theme.textMuted }]}>{'• '}{namaziTr.rakatLabel} {rIdx + 1}:{'  '}</Text>{row}
                                    </Text>
                                ))}
                            </View>
                        ))}
                    </View>
                ))}
            </AppCard>

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
                return renderNamazTab();
            case 'table':
                return renderRekatTab();
            default:
                return null;
        }
    };

    // Main Content
    return (
        <AppLayout>
            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                initialLayout={{ width: layout.width }}
                renderTabBar={(props) => (
                    <TabBar
                        {...props}
                        style={{
                            backgroundColor: theme.card,
                            elevation: 2,
                            shadowColor: theme.text,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 3,
                        }}
                        indicatorStyle={{ backgroundColor: theme.islamicGreen, height: 3 }}
                        activeColor={theme.islamicGreen}
                        inactiveColor={theme.placeholder}
                        pressColor={theme.bg2}
                        pressOpacity={0.8}
                    />
                )}
            />
        </AppLayout>
    );
}

const styles = StyleSheet.create({
    // Progress indicator
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
    // Namazi steps tab
    namaziTab: {
        flex: 1,
    },
    stepCard: {
        padding: 16,
    },
    stepCircleLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    stepNumberText: {
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
    stepImageContainer: {
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

    // Surahs blocks
    surahsBlock: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: StyleSheet.hairlineWidth,
        gap: 6,
    },
    surahsToggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    surahsName: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    surahsChevron: {
        fontSize: 10,
        fontWeight: '700',
    },
    surahsArabic: {
        fontSize: 20,
        lineHeight: 36,
        textAlign: 'right',
        writingDirection: 'rtl',
    },
    surahsTranslit: {
        fontSize: 14,
        lineHeight: 21,
        fontStyle: 'italic',
        textAlign: 'justify',
    },

    // Prayer surahs card
    prayerSurahCard: {
        padding: 16,
    },
    prayerDivider: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
    },
    prayerHeader: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    prayerSurahTitle: {
        fontSize: 17,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    prayerSummary: {
        fontSize: 15,
        fontWeight: '300',
    },
    sectionBlock: {
        marginTop: 10,
        gap: 4,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '600',
        fontStyle: 'italic',
        letterSpacing: 0.3,
        marginBottom: 3,
    },
    rakatRowText: {
        fontSize: 13,
        lineHeight: 21,
        paddingLeft: 4,
    },
    rakatNum: {
        fontSize: 12,
        fontWeight: '700',
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