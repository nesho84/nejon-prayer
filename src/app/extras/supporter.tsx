import AppLayout from "@/components/AppLayout";
import { globalStyles } from "@/constants/styles";
import { GIFT_IDS, SUPPORTER_UNLOCK_ID } from "@/constants/supporter";
import { SUPPORTER_TR, SupporterTranslations } from "@/constants/translations/supporter.tr";
import { useDebugStore } from "@/debug/debugStore";
import { getSupporterPreview, SupporterView } from "@/debug/debugSupporter";
import { useLanguageStore } from "@/store/languageStore";
import { useSupporterStore } from "@/store/supporterStore";
import { useThemeStore } from "@/store/themeStore";
import { ThemeColors } from "@/types/theme.types";
import { formatDate } from "@/utils/datetime";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons/static";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type RestoreResult = "done" | "nothing" | "failed";
type IconName = React.ComponentProps<typeof MaterialDesignIcons>["name"];

interface StatusLine {
    text: string;
    icon: IconName | null;
    color: string;
}

interface UnlockIcon {
    name: IconName;
    color: string;
    bg: string;
}

// Restore result stays in place for this long
const RESTORE_RESULT_MS = 10000;

const RESTORE_ICONS: Record<RestoreResult, IconName> = {
    done: "check",
    nothing: "information-outline",
    failed: "wifi-off",
};

// ------------------------------------------------------------
// Play can't take money right now (not while a payment is pending, not once bought)
// ------------------------------------------------------------
function isUnlockUnavailable(view: SupporterView): boolean {
    return view.playStatus === "unavailable" && !view.unlockPending && !view.isSupporter;
}

// ------------------------------------------------------------
// Unlock card status line
// ------------------------------------------------------------
function getUnlockStatus(view: SupporterView, supporterTr: SupporterTranslations, theme: ThemeColors, locale: string): StatusLine {
    if (view.isSupporter) {
        if (view.supporterSince) {
            const date = formatDate(view.supporterSince, locale, { month: "long", year: "numeric" });
            return { text: supporterTr.supporterSince.replace("{date}", date), icon: null, color: theme.textSecondary + "CC" };
        }
        return { text: supporterTr.supporterThanks, icon: null, color: theme.textSecondary + "CC" };
    }
    if (view.unlockPending) {
        return { text: supporterTr.unlockPendingStatus, icon: null, color: theme.textSecondary + "CC" };
    }
    if (isUnlockUnavailable(view)) {
        return { text: supporterTr.playUnavailable, icon: null, color: theme.danger };
    }
    return { text: supporterTr.unlockSubtitle, icon: null, color: theme.textSecondary + "CC" };
}

// ------------------------------------------------------------
// Unlock card icon
// ------------------------------------------------------------
function getUnlockIcon(view: SupporterView, theme: ThemeColors): UnlockIcon {
    if (view.unlockPending) {
        return { name: "clock-outline", color: theme.textSecondary, bg: theme.textSecondary + "1A" };
    }
    if (isUnlockUnavailable(view)) {
        return { name: "alert-circle-outline", color: theme.danger, bg: theme.danger + "26" };
    }
    return { name: "star-outline", color: theme.accent, bg: theme.gold + "2B" };
}

// ------------------------------------------------------------
// Gift card status line
// ------------------------------------------------------------
function getGiftStatus(view: SupporterView, supporterTr: SupporterTranslations, theme: ThemeColors, locale: string): StatusLine {
    if (view.giftPending) {
        return { text: supporterTr.giftPending, icon: "clock-outline", color: theme.textSecondary + "CC" };
    }
    if (view.playStatus === "unavailable") {
        return { text: supporterTr.giftLastKnown, icon: null, color: theme.textSecondary + "CC" };
    }
    if (view.lastGiftAt) {
        const date = formatDate(view.lastGiftAt, locale, { day: "numeric", month: "long", year: "numeric" });
        return { text: supporterTr.giftReceived.replace("{date}", date), icon: "check", color: theme.success };
    }
    if (view.isSupporter) {
        return { text: supporterTr.giftAlreadyAdFree, icon: null, color: theme.textSecondary + "CC" };
    }
    return { text: supporterTr.giftSubtitle, icon: null, color: theme.textSecondary + "CC" };
}

// ------------------------------------------------------------
// Restore result label
// ------------------------------------------------------------
function getRestoreLabel(result: RestoreResult | null, supporterTr: SupporterTranslations): string {
    if (result === "done") {
        return supporterTr.restoreDone;
    }
    if (result === "nothing") {
        return supporterTr.restoreNothing;
    }
    if (result === "failed") {
        return supporterTr.restoreFailed;
    }
    return supporterTr.restore;
}

// Main component
export default function SupporterScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
    const tr = useLanguageStore((state) => state.tr);
    const language = useLanguageStore((state) => state.language);
    const isSupporter = useSupporterStore((state) => state.isSupporter);
    const supporterSince = useSupporterStore((state) => state.supporterSince);
    const unlockPending = useSupporterStore((state) => state.unlockPending);
    const giftPending = useSupporterStore((state) => state.giftPending);
    const lastGiftAt = useSupporterStore((state) => state.lastGiftAt);
    const lastKnownPrices = useSupporterStore((state) => state.lastKnownPrices);
    const playStatus = useSupporterStore((state) => state.playStatus);
    const productsFresh = useSupporterStore((state) => state.productsFresh);
    const purchasingId = useSupporterStore((state) => state.purchasingId);
    const debugModeEnabled = useDebugStore((state) => state.debugModeEnabled);
    const supporterPreview = useDebugStore((state) => state.supporterPreview);
    const forceSupporterGift = useDebugStore((state) => state.forceSupporterGift);

    const supporterTr = SUPPORTER_TR[language] ?? SUPPORTER_TR.en;

    // Safe area insets
    const insets = useSafeAreaInsets();
    const topInset = 12;
    const bottomInset = insets.bottom + 12;

    // Local state
    const [restoring, setRestoring] = useState(false);
    const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);

    // Fresh product details on every visit
    useEffect(() => {
        useSupporterStore.getState().loadProducts();
    }, []);

    useEffect(() => {
        if (!restoreResult) {
            return;
        }
        const timer = setTimeout(() => setRestoreResult(null), RESTORE_RESULT_MS);
        return () => clearTimeout(timer);
    }, [restoreResult]);

    // A debug preview (only while debug mode is on) overrides the real values when set
    const view = getSupporterPreview(
        { isSupporter, supporterSince, unlockPending, giftPending, lastGiftAt, lastKnownPrices, playStatus, productsFresh, purchasingId },
        debugModeEnabled ? supporterPreview : "idle",
        debugModeEnabled && forceSupporterGift,
    );

    const cardColors = {
        backgroundColor: resolvedTheme === "dark" ? theme.bg2 : theme.white,
        borderColor: theme.gold + "73",
    };
    const unlockPrice = view.lastKnownPrices[SUPPORTER_UNLOCK_ID];
    const canBuy = view.productsFresh && view.purchasingId === null;
    const unlockIcon = getUnlockIcon(view, theme);

    // ------------------------------------------------------------
    // Restore purchases
    // ------------------------------------------------------------
    const handleRestore = async () => {
        setRestoring(true);
        const synced = await useSupporterStore.getState().syncPurchases();
        setRestoring(false);
        if (!synced) {
            setRestoreResult("failed");
            return;
        }
        setRestoreResult(useSupporterStore.getState().isSupporter ? "done" : "nothing");
    };

    // ------------------------------------------------------------
    // Unlock button
    // ------------------------------------------------------------
    const renderUnlockButton = () => {
        if (view.unlockPending) {
            return (
                <View style={[styles.unlockButton, { backgroundColor: theme.textSecondary + "1A" }]}>
                    <MaterialDesignIcons name="clock-outline" size={18} color={theme.textSecondary} />
                    <Text style={[styles.unlockButtonText, { color: theme.textSecondary }]}>{supporterTr.paymentPending}</Text>
                </View>
            );
        }
        if (view.purchasingId === SUPPORTER_UNLOCK_ID || view.playStatus === "loading") {
            return (
                <View style={[styles.unlockButton, { backgroundColor: theme.accentLight }]}>
                    <ActivityIndicator size="small" color={theme.accent} />
                </View>
            );
        }
        if (isUnlockUnavailable(view) || !unlockPrice) {
            return (
                <TouchableOpacity
                    style={[styles.unlockButton, { backgroundColor: theme.danger + "26" }]}
                    onPress={() => useSupporterStore.getState().loadProducts()}
                    activeOpacity={0.6}
                >
                    <MaterialDesignIcons name="refresh" size={18} color={theme.danger} />
                    <Text style={[styles.unlockButtonText, { color: theme.danger }]}>{supporterTr.tryAgain}</Text>
                </TouchableOpacity>
            );
        }
        return (
            <TouchableOpacity
                style={[styles.unlockButton, { backgroundColor: theme.accentLight }]}
                onPress={() => useSupporterStore.getState().buy(SUPPORTER_UNLOCK_ID)}
                disabled={!canBuy}
                activeOpacity={0.6}
            >
                <Text style={[styles.unlockButtonText, { color: theme.accent }]}>{`${supporterTr.unlockButton} · ${unlockPrice}`}</Text>
            </TouchableOpacity>
        );
    };

    // ------------------------------------------------------------
    // Status line (unlock and gift cards)
    // ------------------------------------------------------------
    const renderStatus = (status: StatusLine) => (
        <View style={styles.statusRow}>
            {status.icon && <MaterialDesignIcons name={status.icon} size={16} color={status.color} />}
            <Text style={[styles.statusText, { color: status.color }]} numberOfLines={2}>{status.text}</Text>
        </View>
    );

    return (
        <AppLayout>
            <ScrollView
                style={[globalStyles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={[
                    globalStyles.scrollContent,
                    { gap: 14, paddingHorizontal: 12, paddingTop: topInset, paddingBottom: bottomInset }
                ]}
                showsVerticalScrollIndicator={false}
            >

                {/* Why support */}
                <View style={[styles.card, styles.whyCard, cardColors]}>
                    <Text style={[styles.whyTitle, { color: theme.textSecondary }]}>{supporterTr.whyTitle}</Text>
                    <Text style={[styles.whyText, { color: theme.placeholder }]}>{supporterTr.whyBody}</Text>
                </View>

                {/* Forever supporter */}
                <View style={[styles.card, cardColors]}>
                    <View style={styles.unlockHeader}>
                        <View style={[styles.iconSquare, { backgroundColor: unlockIcon.bg }]}>
                            <MaterialDesignIcons name={unlockIcon.name} size={24} color={unlockIcon.color} />
                        </View>
                        <View style={styles.unlockHeaderText}>
                            <Text style={[styles.cardTitle, { color: view.isSupporter ? theme.success : theme.text }]}>
                                {view.isSupporter ? supporterTr.thankYouTitle : supporterTr.unlockTitle}
                            </Text>
                            {renderStatus(getUnlockStatus(view, supporterTr, theme, tr.labels.localeDate))}
                        </View>
                        {view.isSupporter && <MaterialDesignIcons name="check-decagram" size={36} color={theme.success} />}
                    </View>

                    <View style={[styles.unlockDivider, { backgroundColor: resolvedTheme === "dark" ? theme.bg3 : theme.bg4 }]} />

                    <View style={styles.benefits}>
                        {supporterTr.benefits.map((benefit) => (
                            <View key={benefit} style={styles.benefitRow}>
                                <View style={styles.benefitIcon}>
                                    <MaterialDesignIcons name="check-circle-outline" size={20} color={view.isSupporter ? theme.success : theme.accent} />
                                </View>
                                <Text style={[styles.benefitText, { color: theme.text2 }]}>{benefit}</Text>
                            </View>
                        ))}
                    </View>

                    {!view.isSupporter && renderUnlockButton()}
                </View>

                {/* Or support with a gift */}
                <View style={styles.orRow}>
                    <View style={[styles.divider, styles.orLine, { backgroundColor: theme.divider2 }]} />
                    <Text style={[styles.orText, { color: theme.textMuted }]}>{supporterTr.giftDivider}</Text>
                    <View style={[styles.divider, styles.orLine, { backgroundColor: theme.divider2 }]} />
                </View>

                {/* One-time gifts */}
                <View style={[styles.card, cardColors]}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>{supporterTr.giftTitle}</Text>
                    {renderStatus(getGiftStatus(view, supporterTr, theme, tr.labels.localeDate))}

                    <View style={styles.giftList}>
                        {GIFT_IDS.map((id) => {
                            const price = view.lastKnownPrices[id];
                            const disabled = !canBuy || view.giftPending || view.unlockPending || !price;
                            return (
                                <TouchableOpacity
                                    key={id}
                                    style={[styles.giftRow, { backgroundColor: theme.bg3, borderColor: theme.borderCard, opacity: disabled ? 0.4 : 1 }]}
                                    onPress={() => useSupporterStore.getState().buy(id)}
                                    disabled={disabled}
                                    activeOpacity={0.3}
                                >
                                    <View style={[styles.giftIcon, { backgroundColor: resolvedTheme === "dark" ? theme.white + "0D" : theme.black + "0A" }]}>
                                        <MaterialDesignIcons name="gift-outline" size={19} color={theme.textSecondary} />
                                    </View>
                                    <Text style={[styles.giftLabel, { color: theme.accent }]}>{supporterTr.gifts[id]}</Text>
                                    <View style={styles.giftPrice}>
                                        {view.purchasingId === id ? (
                                            <ActivityIndicator size="small" color={theme.accent} />
                                        ) : (
                                            <Text style={[styles.giftPriceText, { color: theme.text }]}>{price ?? "—"}</Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Restore purchases */}
                <TouchableOpacity style={styles.restoreLink} onPress={handleRestore} disabled={restoring} activeOpacity={0.6}>
                    {restoring ? (
                        <ActivityIndicator size="small" color={theme.link} />
                    ) : (
                        <>
                            <MaterialDesignIcons
                                name={restoreResult ? RESTORE_ICONS[restoreResult] : "restore"}
                                size={18}
                                color={restoreResult === "done" ? theme.success : theme.link}
                            />
                            <Text style={[styles.restoreText, { color: theme.link }]}>{getRestoreLabel(restoreResult, supporterTr)}</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Fine print */}
                <Text style={[styles.finePrint, { color: theme.textMuted }]}>{supporterTr.finePrint}</Text>

            </ScrollView>
        </AppLayout>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 18,
        borderWidth: 1.5,
        borderRadius: 16,
    },
    cardTitle: {
        fontSize: 19,
        fontWeight: "700",
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 4,
    },
    statusText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 19,
    },

    // Dividers
    divider: {
        height: 1,
        marginVertical: -6,
        marginHorizontal: 4,
    },
    orRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        minHeight: 18,
        marginVertical: -4,
        marginHorizontal: 4,
    },
    orLine: {
        flex: 1,
        marginVertical: 0,
        marginHorizontal: 0,
    },
    orText: {
        fontSize: 13.5,
        includeFontPadding: false,
    },

    // Why support
    whyCard: {
        gap: 4,
        paddingVertical: 12,
    },
    whyTitle: {
        fontSize: 15,
        fontWeight: "600",
        marginBottom: 2,
    },
    whyText: {
        fontSize: 14,
        lineHeight: 22,
        textAlign: "justify",
        fontStyle: "italic",
    },

    // Unlock card
    unlockHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    iconSquare: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    unlockHeaderText: {
        flex: 1,
    },
    unlockDivider: {
        height: 1,
        marginVertical: 16,
    },
    benefits: {
        gap: 9,
    },
    benefitRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    // Same width as iconSquare, so the ticks sit under the icon
    benefitIcon: {
        width: 44,
        alignItems: "center",
    },
    benefitText: {
        flex: 1,
        fontSize: 15,
    },
    unlockButton: {
        height: 52,
        marginTop: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        gap: 8,
    },
    unlockButtonText: {
        fontSize: 17,
        fontWeight: "700",
        includeFontPadding: false,
    },

    // Gifts
    giftList: {
        gap: 8,
        marginTop: 14,
    },
    giftRow: {
        minHeight: 60,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        gap: 14,
    },
    giftIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    giftLabel: {
        flex: 1,
        fontSize: 16.5,
        fontWeight: "700",
    },
    giftPrice: {
        minWidth: 72,
        alignItems: "flex-end",
    },
    giftPriceText: {
        fontSize: 17,
        fontWeight: "700",
        letterSpacing: 0.3,
    },

    // Restore + fine print
    restoreLink: {
        minHeight: 48,
        marginVertical: -2,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    restoreText: {
        fontSize: 15,
        fontWeight: "500",
    },
    finePrint: {
        fontSize: 12.5,
        lineHeight: 18,
        textAlign: "center",
        paddingHorizontal: 16,
        marginTop: -8,
        marginBottom: 10,
    },
});
