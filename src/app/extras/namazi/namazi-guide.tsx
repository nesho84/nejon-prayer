import AppCard from "@/components/AppCard";
import AppLayout from "@/components/AppLayout";
import ImageViewer from "@/components/ImageViewer";
import { globalStyles } from "@/constants/styles";
import { NAMAZI_GUIDE_TR, NAMAZI_SURAHS } from "@/constants/translations/namazi-guide.tr";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons } from "@react-native-vector-icons/ionicons/static";
import { FlashList } from "@shopify/flash-list";
import { useCallback, useMemo, useState } from "react";
import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface StepType {
    id: number;
    text: string;
    image?: ImageSourcePropType;
}

export default function NamaziGuideScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);
    const language = useLanguageStore((state) => state.language);
    const namaziTr = NAMAZI_GUIDE_TR[language] ?? NAMAZI_GUIDE_TR.en;

    // Local state
    const [currentStep, setCurrentStep] = useState(1);
    const [expandedSurahs, setExpandedSurahs] = useState<Set<string>>(new Set());
    const [viewerSource, setViewerSource] = useState<ImageSourcePropType | null>(null);

    // Safe area insets
    const insets = useSafeAreaInsets();
    const topInset = 12;
    const bottomInset = insets.bottom + 12;

    // ------------------------------------------------------------
    // Steps data
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
    const handleScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } } }) => {
        const { contentOffset: { y }, contentSize: { height: contentH }, layoutMeasurement: { height: layoutH } } = e.nativeEvent;
        const maxScroll = contentH - layoutH;
        if (maxScroll <= 0) return;
        const step = Math.min(STEPS.length, Math.max(1, Math.ceil((y / maxScroll) * STEPS.length)));
        setCurrentStep(step);
    }, [STEPS.length]);

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
    // Renders a collapsible block for a surah/dua with Arabic and transliteration
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
    // Render item
    // ------------------------------------------------------------
    const renderItem = useCallback(({ item }: { item: StepType }) => (
        <AppCard style={[styles.stepCard, { backgroundColor: theme.card }]}>
            <View style={styles.stepCircleLeft}>
                <View style={[globalStyles.numberCircle, { backgroundColor: theme.islamicGreen }]}>
                    <Text style={[styles.stepNumberText, { color: theme.card }]}>{item.id}</Text>
                </View>
                <Text style={[styles.stepText, { color: theme.text2 }]}>{item.text}</Text>
            </View>

            {item.image && (
                <Pressable
                    style={({ pressed }) => [styles.stepImageContainer, { backgroundColor: theme.bg, opacity: pressed ? 0.85 : 1 }]}
                    android_ripple={{ color: theme.overlayLight, borderless: false }}
                    onPress={() => setViewerSource(item.image!)}
                >
                    <View style={styles.stepImageWrap}>
                        <Image source={item.image} style={styles.stepImage} />
                        <View style={[styles.zoomBadge, { backgroundColor: theme.islamicGreen }]}>
                            <Ionicons name="expand" size={13} color={theme.card} />
                        </View>
                    </View>
                </Pressable>
            )}

            {item.id === 2 && (
                <>
                    {renderSurahBlock(item.id, 'subhaneke')}
                    {renderSurahBlock(item.id, 'taawwudh')}
                    {renderSurahBlock(item.id, 'fatiha')}
                    {renderSurahBlock(item.id, 'kawthar')}
                    {renderSurahBlock(item.id, 'ikhlas')}
                </>
            )}

            {item.id === 8 && (
                <>
                    {renderSurahBlock(item.id, 'fatiha')}
                    {renderSurahBlock(item.id, 'kawthar')}
                    {renderSurahBlock(item.id, 'ikhlas')}
                </>
            )}

            {item.id === 14 && (
                <>
                    {renderSurahBlock(item.id, 'attahiyyatu')}
                    {renderSurahBlock(item.id, 'allahummaSalli')}
                    {renderSurahBlock(item.id, 'allahummaBarik')}
                    {renderSurahBlock(item.id, 'rabbena')}
                </>
            )}
        </AppCard>
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [theme, expandedSurahs, language]);

    // Main Content
    return (
        <AppLayout>

            {/* PROGRESS */}
            <View style={[globalStyles.progressWrapper, { backgroundColor: theme.statusbar, borderBottomColor: theme.divider2 }]}>
                <View style={[globalStyles.progressTrack, { backgroundColor: theme.border }]}>
                    <View style={[globalStyles.progressFill, { backgroundColor: theme.islamicGreen, width: `${(currentStep / STEPS.length) * 100}%` as any }]} />
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
                    <AppCard style={[globalStyles.headerCard, { backgroundColor: theme.card, borderColor: theme.islamicGreen }]}>
                        <Text style={globalStyles.headerIcon}>🕌</Text>
                        <Text style={[globalStyles.headerTitle, { color: theme.text }]}>{namaziTr.headerTitle}</Text>
                        <Text style={[globalStyles.headerSubtitle, { color: theme.placeholder }]}>{namaziTr.headerSubtitle}</Text>
                    </AppCard>
                }
                renderItem={renderItem}
                ListFooterComponent={
                    // FOOTER
                    <AppCard style={[styles.footerCard, { backgroundColor: theme.card, borderLeftColor: theme.placeholder }]}>
                        <Text style={[styles.footerText, { color: theme.placeholder }]}>
                            {namaziTr.footerText}
                        </Text>
                    </AppCard>
                }
                contentContainerStyle={{ paddingTop: topInset, paddingBottom: bottomInset }}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
            />

            <ImageViewer
                visible={viewerSource !== null}
                source={viewerSource}
                onClose={() => setViewerSource(null)}
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
        alignItems: "center",
        justifyContent: "center",
        padding: 10,
        marginVertical: 16,
        borderRadius: 16,
    },
    stepImageWrap: {
        position: "relative",
    },
    stepImage: {
        width: 241,
        height: 241,
        borderRadius: 12,
        resizeMode: "contain",
    },
    zoomBadge: {
        position: "absolute",
        bottom: 8,
        right: 8,
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
    },

    // Surahs blocks
    surahsBlock: {
        paddingTop: 8,
        marginHorizontal: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        gap: 6,
    },
    surahsToggleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 4,
    },
    surahsName: {
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0.8,
        textTransform: "uppercase",
    },
    surahsChevron: {
        fontSize: 10,
        fontWeight: "700",
        marginRight: 3,
    },
    surahsArabic: {
        fontSize: 20,
        lineHeight: 36,
        textAlign: "right",
        writingDirection: "rtl",
    },
    surahsTranslit: {
        fontSize: 14,
        lineHeight: 21,
        fontStyle: "italic",
        textAlign: "justify",
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
