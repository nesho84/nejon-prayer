import AppLayout from "@/components/AppLayout";
import { globalStyles } from "@/constants/styles";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { openExternalUrl, shareText } from "@/utils/system";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { Stack } from "expo-router";
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CONTACT_EMAIL = 'mailto:support@nejon.net';
const HELP_EMAIL = 'mailto:help@nejon.net';

const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.nejon.nejonprayer';
const MORE_APPS_GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/developer?id=Neshat%20Ademi';
// const MORE_APPS_GOOGLE_PLAY_URL = 'https://play.google.com/store/search?q=nejon&c=apps'; // Alternative search URL

// const APPLE_STORE_URL = 'https://apps.apple.com/app/nejon-prayer/idXXXXXXXXX'; // TODO: Add Apple App Store URL
// const MORE_APPS_APP_STORE_URL = 'https://apps.apple.com/developer/nejon/'; // TODO: Add correct App Store developer page URL

export default function AboutScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);

    // Safe area insets
    const insets = useSafeAreaInsets();
    const topInset = 12;
    const bottomInset = insets.bottom + 12;

    // ------------------------------------------------------------
    // Open app info/settings
    // ------------------------------------------------------------
    const openAppInfo = () => {
        Linking.openSettings();
    };

    // ------------------------------------------------------------
    // Share the App
    // ------------------------------------------------------------
    const handleShare = async () => {
        const appName = Constants?.expoConfig?.name ?? 'Nejon Prayer';
        await shareText(appName, GOOGLE_PLAY_URL, tr.labels.shareApp);
    };

    return (
        <AppLayout>
            <ScrollView
                style={[globalStyles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={[
                    globalStyles.scrollContent,
                    { gap: 16, paddingTop: topInset, paddingBottom: bottomInset }
                ]}
                showsVerticalScrollIndicator={false}
            >

                {/* Top Navigation bar */}
                <Stack.Screen
                    options={{
                        title: tr.labels.about,
                        headerRight: () => (
                            <TouchableOpacity onPress={openAppInfo} style={styles.infoIcon} activeOpacity={0.3}>
                                <MaterialCommunityIcons name="information-outline" size={22} color={theme.text} />
                            </TouchableOpacity>
                        ),
                    }}
                />

                {/* Logo + Title + Version */}
                <View style={styles.logoSection}>
                    <Image style={styles.logo} source={require("../../../assets/icons/icon-bg.png")} />
                    <Text style={[styles.title, { color: theme.text2 }]}>
                        {Constants?.expoConfig?.name}
                    </Text>
                    <Text style={[styles.versionText, { color: theme.placeholder }]}>
                        Version {Constants?.expoConfig?.version}
                    </Text>
                </View>

                {/* Action Cards */}
                <View style={[styles.cardGroup, { backgroundColor: theme.secondary + '20' }]}>
                    {/* Support / PayPal */}
                    <TouchableOpacity style={styles.cardRow} onPress={() => openExternalUrl('https://paypal.me/NeshatAdemi?locale.x=de_DE&country.x=AT')} activeOpacity={0.3}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                            <MaterialCommunityIcons name="heart-outline" size={22} color={theme.danger} />
                        </View>
                        <View style={styles.cardTextContainer}>
                            <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>{tr.labels.supportDesc}</Text>
                            <Text style={[styles.cardSubtitle, { color: theme.textMuted }]} numberOfLines={1}>via PayPal</Text>
                        </View>
                        <MaterialCommunityIcons name="open-in-new" size={16} color={theme.textMuted} />
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={[styles.cardDivider, { backgroundColor: theme.bg }]} />

                    {/* Rate the App */}
                    <TouchableOpacity style={styles.cardRow} onPress={() => openExternalUrl(GOOGLE_PLAY_URL)} activeOpacity={0.3}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                            <MaterialCommunityIcons name="star-outline" size={22} color={theme.primary} />
                        </View>
                        <View style={styles.cardTextContainer}>
                            <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>{tr.labels.rateApp}</Text>
                            <Text style={[styles.cardSubtitle, { color: theme.textMuted }]} numberOfLines={1}>{tr.labels.rateAppDesc}</Text>
                        </View>
                        <MaterialCommunityIcons name="open-in-new" size={16} color={theme.textMuted} />
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={[styles.cardDivider, { backgroundColor: theme.bg }]} />

                    {/* Share with a Friend */}
                    <TouchableOpacity style={styles.cardRow} onPress={handleShare} activeOpacity={0.3}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                            <MaterialCommunityIcons name="share-outline" size={22} color={theme.primary} />
                        </View>
                        <View style={styles.cardTextContainer}>
                            <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>{tr.labels.shareApp}</Text>
                            <Text style={[styles.cardSubtitle, { color: theme.textMuted }]} numberOfLines={1}>{tr.labels.shareAppDesc}</Text>
                        </View>
                        <MaterialCommunityIcons name="share-variant-outline" size={16} color={theme.textMuted} />
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={[styles.cardDivider, { backgroundColor: theme.bg }]} />

                    {/* Contact Us */}
                    <TouchableOpacity style={styles.cardRow} onPress={() => openExternalUrl(CONTACT_EMAIL)} activeOpacity={0.3}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                            <MaterialCommunityIcons name="email-outline" size={22} color={theme.primary} />
                        </View>
                        <View style={styles.cardTextContainer}>
                            <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>{tr.labels.contactUs}</Text>
                            <Text style={[styles.cardSubtitle, { color: theme.textMuted }]} numberOfLines={1}>{tr.labels.contactUsDesc}</Text>
                        </View>
                        <MaterialCommunityIcons name="open-in-new" size={16} color={theme.textMuted} />
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={[styles.cardDivider, { backgroundColor: theme.bg }]} />

                    {/* More Apps */}
                    <TouchableOpacity style={styles.cardRow} onPress={() => openExternalUrl(MORE_APPS_GOOGLE_PLAY_URL)} activeOpacity={0.3}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                            <MaterialCommunityIcons name="view-grid-outline" size={22} color={theme.primary} />
                        </View>
                        <View style={styles.cardTextContainer}>
                            <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>{tr.labels.moreApps}</Text>
                            <Text style={[styles.cardSubtitle, { color: theme.textMuted }]} numberOfLines={1}>{tr.labels.moreAppsDesc}</Text>
                        </View>
                        <MaterialCommunityIcons name="open-in-new" size={16} color={theme.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Bottom links */}
                <View style={styles.bottomLinks}>
                    <TouchableOpacity onPress={() => openExternalUrl("https://nejon-prayer.nejon.net/privacy.html")} activeOpacity={0.6}>
                        <Text style={[styles.bottomLinkText, { color: theme.textMuted }]}>Privacy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openExternalUrl(HELP_EMAIL)} activeOpacity={0.6}>
                        <Text style={[styles.bottomLinkText, { color: theme.textMuted }]}>Help</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openExternalUrl("https://nejon.net")} activeOpacity={0.6}>
                        <Text style={[styles.bottomLinkText, { color: theme.textMuted }]}>nejon.net</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </AppLayout>
    );
}

const styles = StyleSheet.create({
    // Native Header
    infoIcon: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },

    // Hero section — fixed top
    logoSection: {
        alignItems: "center",
        marginTop: 24,
        marginBottom: 16,
        gap: 8,
    },
    logo: {
        width: 96,
        height: 96,
        borderRadius: 22,
        marginBottom: 6,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        textAlign: "center",
        letterSpacing: -0.5,
    },
    versionText: {
        fontSize: 14,
        fontWeight: "400",
    },

    // Action cards
    cardGroup: {
        marginHorizontal: 14,
        borderRadius: 16,
        overflow: "hidden",
    },
    cardRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingLeft: 14,
        paddingRight: 18,
        paddingVertical: 13,
        gap: 12,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    cardTextContainer: {
        flex: 1,
        gap: 3,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "600",
        letterSpacing: -0.3,
    },
    cardSubtitle: {
        fontSize: 14,
        fontWeight: "400",
        opacity: 0.6,
    },
    cardDivider: {
        height: 3,
    },

    // Bottom links
    bottomLinks: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 32,
        marginBottom: 24,
        gap: 28,
    },
    bottomLinkText: {
        fontSize: 14,
        fontWeight: "700",
        opacity: 0.7,
    },
});
