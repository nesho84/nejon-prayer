import AppLayout from "@/components/AppLayout";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { Stack } from "expo-router";
import { Image, Linking, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CONTACT_EMAIL = 'mailto:support@nejon.net';
const HELP_EMAIL = 'mailto:help@nejon.net';

const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.nejon.nejonprayer';
const MORE_APPS_GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/developer?id=Neshat%20Ademi';
// const MORE_APPS_GOOGLE_PLAY_URL = 'https://play.google.com/store/search?q=nejon&c=apps'; // Alternative search URL

// const MORE_APPS_APP_STORE_URL = 'https://apps.apple.com/developer/nejon/'; // TODO: Add correct App Store developer page URL
// const APPLE_STORE_URL = 'https://apps.apple.com/app/nejon-prayer/idXXXXXXXXX'; // TODO: Add Apple App Store URL

export default function AboutScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);

    // Safe area insets
    const insets = useSafeAreaInsets();

    // ------------------------------------------------------------
    // Open external link
    // ------------------------------------------------------------
    const openLink = (url: string) => {
        Linking.canOpenURL(url).then((supported) => {
            if (supported) {
                Linking.openURL(url);
            }
        });
    };

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
        try {
            await Share.share(
                {
                    title: appName,
                    message: `${appName}\n\n${GOOGLE_PLAY_URL}`,
                },
                {
                    dialogTitle: tr.labels.shareApp,
                    subject: appName,
                }
            );
        } catch (err) {
            console.error('Share failed:', err);
        }
    };

    return (
        <AppLayout>

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

            {/* Outer container: fills screen between header and safe area */}
            <View style={[styles.outerContainer, { backgroundColor: theme.bg }]}>

                {/* FIXED TOP — Logo + Title + Version */}
                <View style={styles.heroSection}>
                    <Image style={styles.logo} source={require("../../../assets/icons/icon-bg.png")} />
                    <Text style={[styles.title, { color: theme.text2 }]}>
                        {Constants?.expoConfig?.name}
                    </Text>
                    <Text style={[styles.versionText, { color: theme.placeholder }]}>
                        Version {Constants?.expoConfig?.version}
                    </Text>
                </View>

                {/* SCROLLABLE MIDDLE — Action Cards */}
                <ScrollView
                    style={styles.scrollArea}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.cardGroup, { backgroundColor: theme.secondary + '20' }]}>

                        {/* Support / PayPal */}
                        <TouchableOpacity style={styles.cardRow} onPress={() => Linking.openURL('https://paypal.me/NeshatAdemi?locale.x=de_DE&country.x=AT')} activeOpacity={0.3}>
                            <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                                <MaterialCommunityIcons name="heart-outline" size={22} color={theme.danger} />
                            </View>
                            <View style={styles.cardTextContainer}>
                                <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>{tr.labels.supportDesc}</Text>
                                <Text style={[styles.cardSubtitle, { color: theme.textMuted }]} numberOfLines={1}>via PayPal</Text>
                            </View>
                            <MaterialCommunityIcons name="open-in-new" size={16} color={theme.textMuted} />
                        </TouchableOpacity>

                        <View style={[styles.fullDivider, { backgroundColor: theme.bg }]} />

                        {/* Rate the App */}
                        <TouchableOpacity style={styles.cardRow} onPress={() => openLink(GOOGLE_PLAY_URL)} activeOpacity={0.3}>
                            <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                                <MaterialCommunityIcons name="star-outline" size={22} color={theme.primary} />
                            </View>
                            <View style={styles.cardTextContainer}>
                                <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>{tr.labels.rateApp}</Text>
                                <Text style={[styles.cardSubtitle, { color: theme.textMuted }]} numberOfLines={1}>{tr.labels.rateAppDesc}</Text>
                            </View>
                            <MaterialCommunityIcons name="open-in-new" size={16} color={theme.textMuted} />
                        </TouchableOpacity>

                        <View style={[styles.fullDivider, { backgroundColor: theme.bg }]} />

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

                        <View style={[styles.fullDivider, { backgroundColor: theme.bg }]} />

                        {/* Contact Us */}
                        <TouchableOpacity style={styles.cardRow} onPress={() => Linking.openURL(CONTACT_EMAIL)} activeOpacity={0.3}>
                            <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                                <MaterialCommunityIcons name="email-outline" size={22} color={theme.primary} />
                            </View>
                            <View style={styles.cardTextContainer}>
                                <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>{tr.labels.contactUs}</Text>
                                <Text style={[styles.cardSubtitle, { color: theme.textMuted }]} numberOfLines={1}>{tr.labels.contactUsDesc}</Text>
                            </View>
                            <MaterialCommunityIcons name="open-in-new" size={16} color={theme.textMuted} />
                        </TouchableOpacity>

                        <View style={[styles.fullDivider, { backgroundColor: theme.bg }]} />

                        {/* More Apps by Nejon */}
                        <TouchableOpacity style={styles.cardRow} onPress={() => openLink(MORE_APPS_GOOGLE_PLAY_URL)} activeOpacity={0.3}>
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
                </ScrollView>

                {/* FIXED BOTTOM — Plain text links */}
                <View style={[styles.bottomLinks, { paddingBottom: insets.bottom + 12 }]}>
                    <TouchableOpacity onPress={() => openLink("https://nejon-prayer.nejon.net/privacy.html")} activeOpacity={0.6}>
                        <Text style={[styles.bottomLinkText, { color: theme.textMuted }]}>Privacy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => Linking.openURL(HELP_EMAIL)} activeOpacity={0.6}>
                        <Text style={[styles.bottomLinkText, { color: theme.textMuted }]}>Help</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openLink("https://nejon.net")} activeOpacity={0.6}>
                        <Text style={[styles.bottomLinkText, { color: theme.textMuted }]}>nejon.net</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </AppLayout>
    );
}

const styles = StyleSheet.create({
    // Header
    infoIcon: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },

    // Outer container
    outerContainer: {
        flex: 1,
    },

    // Hero section — fixed top
    heroSection: {
        alignItems: "center",
        paddingTop: 32,
        paddingBottom: 12,
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

    // Cards - Scrollable area
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
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
    fullDivider: {
        height: 3,
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

    // Fixed bottom links
    bottomLinks: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 12,
        marginBottom: 12,
        gap: 28,
    },
    bottomLinkText: {
        fontSize: 14,
        fontWeight: "700",
        opacity: 0.7,
    },
});
