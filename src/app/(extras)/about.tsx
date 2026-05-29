import AppLayout from "@/components/AppLayout";
import { globalStyles } from "@/constants/styles";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { Stack } from "expo-router";
import { Image, Linking, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.nejon.nejonprayer';
const CONTACT_EMAIL = 'mailto:support@nejon.net';
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
                        <TouchableOpacity onPress={openAppInfo} style={styles.headerIcon} activeOpacity={0.3}>
                            <MaterialCommunityIcons name="information-outline" size={22} color={theme.text} />
                        </TouchableOpacity>
                    ),
                }}
            />

            <ScrollView
                style={[globalStyles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={[
                    globalStyles.scrollContent,
                    { paddingTop: 12, paddingBottom: insets.bottom + 24 }
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero: Logo + Title + Version */}
                <View style={styles.heroSection}>
                    <Image style={styles.logo} source={require("../../../assets/icons/icon-bg.png")} />
                    <Text style={[styles.title, { color: theme.text2 }]}>
                        {Constants?.expoConfig?.name}
                    </Text>
                    <Text style={[styles.versionText, { color: theme.placeholder }]}>
                        Version {Constants?.expoConfig?.version}
                    </Text>
                </View>

                {/* Action Cards */}
                <View style={styles.cardsSection}>

                    {/* Support / PayPal Card */}
                    <TouchableOpacity
                        style={[styles.actionCard, {
                            backgroundColor: theme.primary + '08',
                            borderColor: theme.divider3
                        }]}
                        onPress={() => Linking.openURL('https://paypal.me/NeshatAdemi?locale.x=de_DE&country.x=AT')}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                            <MaterialCommunityIcons name="heart-outline" size={22} color={theme.danger} />
                        </View>
                        <View style={styles.supportTextContainer}>
                            <Text style={[styles.supportTitle, { color: theme.textSecondary }]}>{tr.labels.supportDesc}</Text>
                            <Text style={[styles.supportSubtitle, { color: theme.textMuted }]} numberOfLines={1}>via PayPal</Text>
                        </View>
                        <MaterialCommunityIcons name="open-in-new" size={18} color={theme.linkHover} style={{ opacity: 0.5 }} />
                    </TouchableOpacity>

                    {/* Rate the App */}
                    <TouchableOpacity
                        style={[styles.actionCard, {
                            backgroundColor: theme.primary + '08',
                            borderColor: theme.divider3
                        }]}
                        onPress={() => openLink(GOOGLE_PLAY_URL)}
                        // onPress={() => openLink(APPLE_STORE_URL)} // TODO: Apple App Store
                        activeOpacity={0.8}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                            <MaterialCommunityIcons name="star-outline" size={22} color={theme.primary} />
                        </View>
                        <View style={styles.supportTextContainer}>
                            <Text style={[styles.supportTitle, { color: theme.textSecondary }]}>{tr.labels.rateApp}</Text>
                            <Text style={[styles.supportSubtitle, { color: theme.textMuted }]} numberOfLines={1}>{tr.labels.rateAppDesc}</Text>
                        </View>
                        <MaterialCommunityIcons name="open-in-new" size={18} color={theme.linkHover} style={{ opacity: 0.5 }} />
                    </TouchableOpacity>

                    {/* Share with a Friend */}
                    <TouchableOpacity
                        style={[styles.actionCard, {
                            backgroundColor: theme.primary + '08',
                            borderColor: theme.divider3
                        }]}
                        onPress={handleShare}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                            <MaterialCommunityIcons name="share-outline" size={22} color={theme.primary} />
                        </View>
                        <View style={styles.supportTextContainer}>
                            <Text style={[styles.supportTitle, { color: theme.textSecondary }]}>{tr.labels.shareApp}</Text>
                            <Text style={[styles.supportSubtitle, { color: theme.textMuted }]} numberOfLines={1}>{tr.labels.shareAppDesc}</Text>
                        </View>
                        <MaterialCommunityIcons name="share-variant-outline" size={18} color={theme.linkHover} style={{ opacity: 0.5 }} />
                    </TouchableOpacity>

                    {/* Contact Us */}
                    <TouchableOpacity
                        style={[styles.actionCard, {
                            backgroundColor: theme.primary + '08',
                            borderColor: theme.divider3
                        }]}
                        onPress={() => Linking.openURL(CONTACT_EMAIL)}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                            <MaterialCommunityIcons name="email-outline" size={22} color={theme.primary} />
                        </View>
                        <View style={styles.supportTextContainer}>
                            <Text style={[styles.supportTitle, { color: theme.textSecondary }]}>{tr.labels.contactUs}</Text>
                            <Text style={[styles.supportSubtitle, { color: theme.textMuted }]} numberOfLines={1}>{tr.labels.contactUsDesc}</Text>
                        </View>
                        <MaterialCommunityIcons name="open-in-new" size={18} color={theme.linkHover} style={{ opacity: 0.5 }} />
                    </TouchableOpacity>

                </View>

                {/* Bottom Buttons */}
                <View style={styles.buttonsSection}>
                    <TouchableOpacity
                        style={[styles.pillButton, { backgroundColor: theme.overlayLight, borderColor: theme.divider3 }]}
                        onPress={() => openLink("https://nejon-prayer.nejon.net/privacy.html")}
                        activeOpacity={0.75}
                    >
                        <MaterialCommunityIcons name="shield-lock-outline" size={16} color={theme.textMuted} style={{ marginTop: 1 }} />
                        <Text style={[styles.pillButtonText, { color: theme.text2 }]}>Privacy Policy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.pillButton, { backgroundColor: theme.overlayLight, borderColor: theme.divider3 }]}
                        onPress={() => openLink("https://nejon.net")}
                        activeOpacity={0.75}
                    >
                        <MaterialCommunityIcons name="web" size={16} color={theme.textMuted} style={{ marginTop: 2 }} />
                        <Text style={[styles.pillButtonText, { color: theme.text2 }]}>nejon.net</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </AppLayout>
    );
}

const styles = StyleSheet.create({
    // Header
    headerIcon: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },

    // Hero section
    heroSection: {
        alignItems: 'center',
        paddingTop: 36,
        paddingBottom: 24,
        gap: 10,
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

    // Action cards group
    cardsSection: {
        paddingHorizontal: 14,
        gap: 10,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 16,
        gap: 16,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    supportTextContainer: {
        flex: 1,
        gap: 3,
    },
    supportTitle: {
        fontSize: 16,
        fontWeight: "600",
        letterSpacing: -0.3,
    },
    supportSubtitle: {
        fontSize: 14,
        fontWeight: "400",
        opacity: 0.6,
    },

    // Bottom pill buttons
    buttonsSection: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingTop: 32,
        gap: 10,
    },
    pillButton: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderWidth: 1,
        borderRadius: 50,
    },
    pillButtonText: {
        fontSize: 16,
        fontWeight: "600",
        opacity: 0.5,
    },
});
