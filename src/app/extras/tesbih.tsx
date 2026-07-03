import AppLayout from "@/components/AppLayout";
import AppLoading from "@/components/AppLoading";
import { globalStyles } from "@/constants/styles";
import { useLanguageStore } from "@/store/languageStore";
import { useTesbihStore } from "@/store/tesbihStore";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons } from "@react-native-vector-icons/ionicons/static";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons/static";
import { ScrollView, StyleSheet, Text, TouchableOpacity, Vibration, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

export default function TesbihScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);
    const isReady = useTesbihStore((state) => state.isReady);
    const count = useTesbihStore((state) => state.count);
    const totalCount = useTesbihStore((state) => state.totalCount);
    const laps = useTesbihStore((state) => state.laps);

    // Safe area insets
    const insets = useSafeAreaInsets();
    const topInset = 12;
    const bottomInset = insets.bottom + 12;

    // Calculate circle parameters
    const size = 315;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Progress goes from 0 → 1 as count increases
    const progress = count / totalCount;
    const strokeDashoffset = circumference * (1 - progress);

    // ------------------------------------------------------------
    // Handle press
    // ------------------------------------------------------------
    const handleCount = () => {
        const countReachedTotal = useTesbihStore.getState().setCount();
        if (countReachedTotal) {
            Vibration.vibrate(300);
        }
    };

    // ------------------------------------------------------------
    // Reset count to 0
    // ------------------------------------------------------------
    const handleReset = () => {
        Vibration.vibrate(100);
        useTesbihStore.getState().reset();
    };

    // ------------------------------------------------------------
    // Increment total count
    // ------------------------------------------------------------
    const incrementTotal = () => {
        useTesbihStore.getState().incrementTotal();
    };

    // ------------------------------------------------------------
    // Decrement total count
    // ------------------------------------------------------------
    const decrementTotal = () => {
        useTesbihStore.getState().decrementTotal();
    };

    // ------------------------------------------------------------
    // Set preset value
    // ------------------------------------------------------------
    const setPreset = (value: number) => {
        useTesbihStore.getState().setPreset(value);
    };

    // Loading state
    if (!isReady) {
        return <AppLoading text={tr.labels.loading} />;
    }

    // Main Content
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

                {/* Instruction at top */}
                <View style={[styles.instruction, { borderColor: theme.border }]}>
                    <Ionicons name="information-circle" size={18} color={theme.divider} />
                    <Text style={[styles.instructionText, { color: theme.text }]}>
                        {tr.labels.tInstruction}
                    </Text>
                </View>

                {/* Preset chips - subtle and compact */}
                <View style={styles.presets}>
                    {[10, 25, 33, 66, 99, 100].map((preset) => (
                        <TouchableOpacity
                            key={preset}
                            style={[
                                styles.presetBtn,
                                {
                                    backgroundColor: totalCount === preset ? theme.primary + '20' : theme.card,
                                    borderColor: totalCount === preset ? theme.primary : 'transparent',
                                }
                            ]}
                            onPress={() => setPreset(preset)}
                        >
                            <Text style={[
                                styles.presetText,
                                { color: totalCount === preset ? theme.primary : theme.text2 }
                            ]}>
                                {preset}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Counter Circle - Tappable */}
                <TouchableOpacity
                    style={[styles.circleContainer]}
                    activeOpacity={0.6}
                    onPress={handleCount}
                >
                    <View style={[styles.circleInnerContainer, { width: size, height: size }]}>
                        <Svg width={size} height={size}>
                            {/* Background Circle */}
                            <Circle
                                stroke={theme.divider}
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                strokeWidth={strokeWidth}
                                fill="transparent"
                            />
                            {/* Progress Circle */}
                            <Circle
                                stroke={theme.primary}
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                strokeWidth={strokeWidth}
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                                fill="transparent"
                            />
                        </Svg>

                        {/* Counter Text */}
                        <View style={styles.circleInnerSection}>
                            <Text style={[styles.counterText, { color: theme.text }]}>
                                <Text style={[styles.currentCount, { color: theme.primary }]}>
                                    {count}
                                </Text>
                                /{totalCount}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Bottom Info Cards - Current and Limit */}
                <View style={styles.infoCard}>
                    <View style={[styles.infoCardItem, { backgroundColor: theme.card }]}>
                        <Text style={[styles.infoCardLabel, { color: theme.text2 }]}>
                            {tr.labels.tLap}
                        </Text>
                        <Text style={[styles.infoCardValue, { color: theme.text }]}>
                            {laps}
                        </Text>
                    </View>

                    <View style={[styles.infoCardItem, { backgroundColor: theme.card }]}>
                        <Text style={[styles.infoCardLabel, { color: theme.text2 }]}>
                            {tr.labels.tLimit}
                        </Text>
                        <Text style={[styles.infoCardValue, { color: theme.text }]}>
                            {totalCount}
                        </Text>
                    </View>
                </View>

                {/* Bottom Controls - Inside pill container */}
                <View style={[styles.controls, { backgroundColor: theme.card }]}>
                    <TouchableOpacity style={styles.controlBtn} onPress={decrementTotal}>
                        <MaterialDesignIcons name="minus" size={24} color={theme.text2} />
                    </TouchableOpacity>

                    <Text style={[styles.controlValue, { color: theme.text2 }]}>
                        {totalCount}
                    </Text>

                    <TouchableOpacity style={styles.controlBtn} onPress={incrementTotal}>
                        <MaterialDesignIcons name="plus" size={24} color={theme.text2} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.controlBtn} onPress={handleReset}>
                        <MaterialDesignIcons name="reload" size={26} color={theme.primary} />
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </AppLayout>
    );
}

const styles = StyleSheet.create({
    // Instruction
    instruction: {
        alignSelf: "center",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginVertical: 16,
        borderWidth: 1,
        borderRadius: 20,
        gap: 6,
    },
    instructionText: {
        fontSize: 14,
        textAlign: "center",
        lineHeight: 20,
        opacity: 0.6,
    },

    // Presets
    presets: {
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 8,
    },
    presetBtn: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
    },
    presetText: {
        fontSize: 17,
        fontWeight: "500",
        opacity: 0.6,
    },

    // Counter Circle
    circleContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
    },
    circleInnerContainer: {
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 130,
    },
    circleInnerSection: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
    },
    counterText: {
        fontSize: 48,
        fontWeight: "300",
    },
    currentCount: {
        fontWeight: "400",
    },

    // Bottom Info Bar (LAP + LIMIT)
    infoCard: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "center",
        gap: 16,
    },
    infoCardItem: {
        minWidth: 110,
        alignItems: "center",
        paddingVertical: 6,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    infoCardLabel: {
        fontSize: 12,
        letterSpacing: 0.5,
        opacity: 0.6,
        marginBottom: 2,
    },
    infoCardValue: {
        fontSize: 18,
        fontWeight: "600",
        opacity: 0.6,
    },

    // Bottom Controls (Pill)
    controls: {
        width: "95%",
        alignSelf: "center",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-evenly",
        borderRadius: 40,
        paddingVertical: 14,
    },
    controlBtn: {
        width: 52,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    controlValue: {
        fontSize: 20,
        fontWeight: "600",
        marginHorizontal: 6,
        opacity: 0.6,
    },
});