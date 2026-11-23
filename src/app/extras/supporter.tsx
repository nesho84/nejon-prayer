import AppCard from "@/components/AppCard";
import AppLayout from "@/components/AppLayout";
import { globalStyles } from "@/constants/styles";
import { GIFT_IDS, SUPPORTER_UNLOCK_ID } from "@/constants/supporter";
import { SUPPORTER_TR } from "@/constants/translations/supporter.tr";
import { useLanguageStore } from "@/store/languageStore";
import { useSupporterStore } from "@/store/supporterStore";
import { useThemeStore } from "@/store/themeStore";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons/static";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type RestoreResult = "done" | "nothing" | "failed";

// The Restore result swaps in place for this long, like HolidaysCard's share check
const RESTORE_RESULT_MS = 10000;

export default function SupporterScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
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

    const supporterTr = SUPPORTER_TR[language] ?? SUPPORTER_TR.en;

    // Safe area insets
    const insets = useSafeAreaInsets();
    const topInset = 12;
    const bottomInset = insets.bottom + 12;

    // Local state
    const [restoring, setRestoring] = useState(false);
    const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);

    // Fresh product details on every visit — a purchase never starts from the stored prices
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

    // ------------------------------------------------------------
    // Restore purchases — the same Play sync that runs on launch, with in-place feedback
    // ------------------------------------------------------------
    const handleRestore = async () => {
        setRestoring(true);
        const synced = await useSupporterStore.getState().syncPurchases();
        setRestoring(false);
        setRestoreResult(!synced ? "failed" : useSupporterStore.getState().isSupporter ? "done" : "nothing");
    };

    const formatDate = (time: number, options: Intl.DateTimeFormatOptions) =>
        new Date(time).toLocaleDateString(tr.labels.localeDate, options);

    const unavailable = playStatus === "unavailable";
    const unlockPrice = lastKnownPrices[SUPPORTER_UNLOCK_ID];
    const canBuy = productsFresh && purchasingId === null;

    // One status line per card — the text changes in place, the layout doesn't
    const unlockStatus = isSupporter
        ? supporterTr.supporterThanks
        : unlockPending
            ? supporterTr.unlockPendingStatus
            : unavailable
                ? supporterTr.playUnavailable
                : supporterTr.unlockSubtitle;

    const giftStatus = giftPending
        ? supporterTr.giftPending
        : unavailable
            ? supporterTr.giftLastKnown
            : lastGiftAt
                ? supporterTr.giftReceived.replace("{date}", formatDate(lastGiftAt, { day: "numeric", month: "long", year: "numeric" }))
                : isSupporter
                    ? supporterTr.giftAlreadyAdFree
                    : supporterTr.giftSubtitle;

    const restoreLabel = restoreResult === "done"
        ? supporterTr.restoreDone
        : restoreResult === "nothing"
            ? supporterTr.restoreNothing
            : restoreResult === "failed"
                ? supporterTr.restoreFailed
                : supporterTr.restore;

    // ------------------------------------------------------------
    // Unlock action slot — fixed height, content swaps with state
    // ------------------------------------------------------------
    const renderUnlockAction = () => {
        if (isSupporter) {
            return (
                <View style={[styles.actionSlot, styles.actionRow]}>
                    <MaterialDesignIcons name="check-decagram" size={20} color={theme.success} />
                    <Text style={[styles.actionText, { color: theme.text2 }]} numberOfLines={1}>
                        {supporterSince
                            ? supporterTr.supporterSince.replace("{date}", formatDate(supporterSince, { month: "long", year: "numeric" }))
                            : supporterTr.supporterThanks}
                    </Text>
                </View>
            );
        }
        if (unlockPending) {
            return (
                <View style={[styles.actionSlot, styles.actionRow, styles.actionButton, { backgroundColor: theme.secondary + '15' }]}>
                    <MaterialDesignIcons name="clock-outline" size={18} color={theme.textSecondary} />
                    <Text style={[styles.actionText, { color: theme.textSecondary }]}>{supporterTr.paymentPending}</Text>
                </View>
            );
        }
        if (purchasingId === SUPPORTER_UNLOCK_ID || playStatus === "loading") {
            return (
                <View style={[styles.actionSlot, styles.actionButton, { backgroundColor: theme.primary + '20' }]}>
                    <ActivityIndicator size="small" color={theme.primary} />
                </View>
            );
        }
        if (unavailable || !unlockPrice) {
            return (
                <TouchableOpacity
                    style={[styles.actionSlot, styles.actionRow, styles.actionButton, { backgroundColor: theme.secondary + '20' }]}
                    onPress={() => useSupporterStore.getState().loadProducts()}
                    activeOpacity={0.6}
                >
                    <MaterialDesignIcons name="refresh" size={18} color={theme.secondary} />
                    <Text style={[styles.actionText, { color: theme.text }]}>{supporterTr.tryAgain}</Text>
                </TouchableOpacity>
            );
        }
        return (
            <TouchableOpacity
                style={[styles.actionSlot, styles.actionRow, styles.actionButton, { backgroundColor: theme.primary + '20' }]}
                onPress={() => useSupporterStore.getState().buy(SUPPORTER_UNLOCK_ID)}
                disabled={!canBuy}
                activeOpacity={0.6}
            >
                <MaterialDesignIcons name="heart" size={18} color={theme.pink} />
                <Text style={[styles.actionText, { color: theme.text }]}>{`${supporterTr.unlockButton} · ${unlockPrice}`}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <AppLayout>
            <ScrollView
                style={[globalStyles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={[
                    globalStyles.scrollContent,
                    { gap: 12, paddingTop: topInset, paddingBottom: bottomInset }
                ]}
                showsVerticalScrollIndicator={false}
            >

                {/* Why support — quiet info box */}
                <View style={[styles.infoBox, { backgroundColor: theme.secondary + '15' }]}>
                    <View style={styles.titleRow}>
                        <MaterialDesignIcons name="information-outline" size={20} color={theme.secondary} />
                        <Text style={[styles.infoTitle, { color: theme.text2 }]}>{supporterTr.whyTitle}</Text>
                    </View>
                    <Text style={[styles.infoBody, { color: theme.textSecondary }]}>{supporterTr.whyBody}</Text>
                </View>

                {/* Forever supporter */}
                <AppCard style={styles.card}>
                    <View style={styles.titleRow}>
                        <MaterialDesignIcons name={isSupporter ? "heart" : "heart-outline"} size={22} color={theme.pink} />
                        <Text style={[styles.cardTitle, { color: theme.text }]}>{supporterTr.unlockTitle}</Text>
                    </View>
                    <Text style={[styles.statusText, { color: theme.textSecondary }]} numberOfLines={2}>{unlockStatus}</Text>
                    <View style={[styles.divider, { borderColor: theme.divider2 }]} />

                    <View style={styles.benefits}>
                        {supporterTr.benefits.map((benefit) => (
                            <View key={benefit} style={styles.benefitRow}>
                                <MaterialDesignIcons
                                    name="check-circle-outline"
                                    size={18}
                                    color={isSupporter ? theme.success : theme.textSecondary}
                                />
                                <Text style={[styles.benefitText, { color: theme.text2 }]}>{benefit}</Text>
                            </View>
                        ))}
                    </View>

                    {renderUnlockAction()}
                </AppCard>

                {/* or just give something */}
                <View style={styles.orRow}>
                    <View style={[styles.orLine, { backgroundColor: theme.divider2 }]} />
                    <Text style={[styles.orText, { color: theme.textSecondary }]}>{supporterTr.giftDivider}</Text>
                    <View style={[styles.orLine, { backgroundColor: theme.divider2 }]} />
                </View>

                {/* One-time gifts */}
                <AppCard style={styles.card}>
                    <View style={styles.titleRow}>
                        <MaterialDesignIcons name="gift-outline" size={22} color={theme.secondary} />
                        <Text style={[styles.cardTitle, { color: theme.text }]}>{supporterTr.giftTitle}</Text>
                    </View>
                    <Text style={[styles.statusText, { color: theme.textSecondary }]} numberOfLines={2}>{giftStatus}</Text>
                    <View style={[styles.divider, { borderColor: theme.divider2 }]} />

                    <View style={styles.giftList}>
                        {GIFT_IDS.map((id) => {
                            const price = lastKnownPrices[id];
                            const disabled = !canBuy || giftPending || !price;
                            return (
                                <TouchableOpacity
                                    key={id}
                                    style={[styles.giftRow, { backgroundColor: theme.secondary + '15', opacity: disabled ? 0.7 : 1 }]}
                                    onPress={() => useSupporterStore.getState().buy(id)}
                                    disabled={disabled}
                                    activeOpacity={0.3}
                                >
                                    <Text style={[styles.giftLabel, { color: theme.text2 }]}>{supporterTr.gifts[id]}</Text>
                                    <View style={styles.giftPrice}>
                                        {purchasingId === id ? (
                                            <ActivityIndicator size="small" color={theme.secondary} />
                                        ) : (
                                            <Text style={[styles.giftPriceText, { color: theme.text }]}>{price ?? "—"}</Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </AppCard>

                {/* Restore purchases — result confirms in place */}
                <TouchableOpacity
                    style={[styles.actionSlot, styles.actionRow, styles.actionButton, { backgroundColor: theme.secondary + '20' }]}
                    onPress={handleRestore}
                    disabled={restoring}
                    activeOpacity={0.6}
                >
                    {restoring ? (
                        <ActivityIndicator size="small" color={theme.secondary} />
                    ) : (
                        <>
                            <MaterialDesignIcons
                                name={restoreResult === "done" ? "check" : restoreResult === "failed" ? "wifi-off" : "restore"}
                                size={18}
                                color={restoreResult === "done" ? theme.success : theme.secondary}
                            />
                            <Text style={[styles.actionText, { color: theme.text }]}>{restoreLabel}</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Fine print */}
                <Text style={[styles.finePrint, { color: theme.textSecondary }]}>{supporterTr.finePrint}</Text>

            </ScrollView>
        </AppLayout>
    );
}

const styles = StyleSheet.create({
    // Info box
    infoBox: {
        borderRadius: 16,
        padding: 14,
        gap: 6,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: "600",
    },
    infoBody: {
        fontSize: 14,
        lineHeight: 20,
    },

    // Cards
    card: {
        padding: 14,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    cardTitle: {
        fontSize: 17.5,
        fontWeight: "600",
        letterSpacing: 0.5,
    },
    // Reserves two lines so a longer status never pushes the card down
    statusText: {
        fontSize: 14,
        lineHeight: 19,
        minHeight: 38,
        marginTop: 6,
    },
    divider: {
        width: "100%",
        borderWidth: 1,
        marginVertical: 8,
    },

    // Benefits
    benefits: {
        gap: 8,
        marginBottom: 12,
    },
    benefitRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    benefitText: {
        flex: 1,
        fontSize: 14,
    },

    // Action slot — fixed 48dp so every state has the same height
    actionSlot: {
        height: 48,
        justifyContent: "center",
    },
    actionRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    actionButton: {
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    actionText: {
        fontSize: 16,
        fontWeight: "600",
        includeFontPadding: false,
    },

    // "or just give something"
    orRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 6,
        marginVertical: 4,
    },
    orLine: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
    },
    orText: {
        fontSize: 13,
    },

    // Gifts
    giftList: {
        gap: 6,
    },
    giftRow: {
        minHeight: 48,
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 12,
        paddingHorizontal: 14,
    },
    giftLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: "500",
    },
    giftPrice: {
        minWidth: 72,
        alignItems: "flex-end",
    },
    giftPriceText: {
        fontSize: 16,
        fontWeight: "600",
        letterSpacing: 0.5,
    },

    // Fine print
    finePrint: {
        fontSize: 12,
        lineHeight: 17,
        textAlign: "center",
        paddingHorizontal: 12,
    },
});
