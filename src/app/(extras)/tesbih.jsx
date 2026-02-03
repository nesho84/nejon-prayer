import { useState, useEffect, useCallback } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, AppState, Vibration } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import { storage } from "@/store/storage";
import { Ionicons, MaterialCommunityIcons as McIcons } from "@expo/vector-icons";
import { useThemeContext } from "@/context/ThemeContext";
import useTranslation from "@/hooks/useTranslation";
import AppFullScreen from "@/components/AppFullScreen";
import CounterCircle from "@/components/CounterCircle";

export default function QiblaScreen() {
    // MMKV storage key
    const TESBIH_KEY = '@tesbih_key';

    const { theme } = useThemeContext();
    const { tr } = useTranslation();

    // Local state
    const [count, setCount] = useState(0);
    const [totalCount, setTotalCount] = useState(10);
    const [laps, setLaps] = useState(0);

    // ------------------------------------------------------------
    // Load state on mount
    // ------------------------------------------------------------
    useEffect(() => {
        loadState();
    }, []);

    // ------------------------------------------------------------
    // Save state when screen loses focus
    // ------------------------------------------------------------
    useFocusEffect(
        useCallback(() => {
            return () => saveState();
        }, [count, totalCount, laps])
    );

    // ------------------------------------------------------------
    // Save state when app goes to background
    // ------------------------------------------------------------
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'background' || nextAppState === 'inactive') {
                saveState();
            }
        });

        return () => subscription.remove();
    }, [count, totalCount, laps]);

    // ------------------------------------------------------------
    // Load state from MMKV storage
    // ------------------------------------------------------------
    const loadState = () => {
        try {
            const saved = storage.getString(TESBIH_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                setCount(data.count || 0);
                setTotalCount(data.totalCount || 10);
                setLaps(data.laps || 0);
            }
        } catch (err) {
            console.warn("⚠️ Failed to load tesbih state", err);
        }
    };

    // ------------------------------------------------------------
    //  Save state to MMKV storage
    // ------------------------------------------------------------
    const saveState = () => {
        try {
            const data = {
                count: count,
                totalCount: totalCount,
                laps: laps
            };
            storage.set(TESBIH_KEY, JSON.stringify(data));
        } catch (err) {
            console.warn("⚠️ Failed to save tesbih state", err);
        }
    };

    // ------------------------------------------------------------
    // Handle press
    // ------------------------------------------------------------
    const handleCount = () => {
        setCount(count + 1);
    };

    // ------------------------------------------------------------
    // Auto-restart when reaching total
    // ------------------------------------------------------------
    const setCountReached = () => {
        setLaps(prev => prev + 1)
        setCount(0);
    };

    // ------------------------------------------------------------
    // Reset count to 0
    // ------------------------------------------------------------
    const handleReset = () => {
        setCount(0);
        setLaps(0);
        Vibration.vibrate(100);
    };

    // ------------------------------------------------------------
    // Increment total count
    // ------------------------------------------------------------
    const incrementTotal = () => {
        setTotalCount(prev => prev + 1);
        setCount(0);
        setLaps(0);
    };

    // ------------------------------------------------------------
    // Decrement total count
    // ------------------------------------------------------------
    const decrementTotal = () => {
        if (totalCount > 1) {
            setTotalCount(prev => prev - 1);
            setCount(0);
            setLaps(0);
        }
    };

    // ------------------------------------------------------------
    // Set preset value
    // ------------------------------------------------------------
    const setPreset = (value) => {
        setTotalCount(value);
        setCount(0);
        setLaps(0);
    };

    return (
        <AppFullScreen>
            <ScrollView
                style={[styles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={[styles.scrollContent]}
                showsVerticalScrollIndicator={false}
            >

                {/* Instruction at top */}
                <View style={[styles.instruction, { borderColor: theme.border }]}>
                    <Ionicons name="information-circle" size={18} color={theme.divider} />
                    <Text style={[styles.instructionText, { color: theme.text }]}>
                        {tr('labels.tInstruction')}
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
                    <CounterCircle
                        currentCount={count}
                        totalCount={totalCount}
                        onCountReached={setCountReached}
                        size={260}
                        strokeWidth={10}
                        strokeColor={theme.divider}
                        color={theme.primary}
                        textColor={theme.text}
                        vibrationDuration={500}
                    />
                </TouchableOpacity>

                {/* Bottom Info Cards - Current and Limit */}
                <View style={styles.infoCard}>
                    <View style={[styles.infoCardItem, { backgroundColor: theme.card }]}>
                        <Text style={[styles.infoCardLabel, { color: theme.text2 }]}>
                            {tr('labels.tLap')}
                        </Text>
                        <Text style={[styles.infoCardValue, { color: theme.text }]}>
                            {laps}
                        </Text>
                    </View>

                    <View style={[styles.infoCardItem, { backgroundColor: theme.card }]}>
                        <Text style={[styles.infoCardLabel, { color: theme.text2 }]}>
                            {tr('labels.tLimit')}
                        </Text>
                        <Text style={[styles.infoCardValue, { color: theme.text }]}>
                            {totalCount}
                        </Text>
                    </View>
                </View>

                {/* Bottom Controls - Inside pill container */}
                <View style={[styles.controls, { backgroundColor: theme.card }]}>
                    <TouchableOpacity style={styles.controlBtn} onPress={decrementTotal}>
                        <McIcons name="minus" size={24} color={theme.text2} />
                    </TouchableOpacity>

                    <Text style={[styles.controlValue, { color: theme.text2 }]}>
                        {totalCount}
                    </Text>

                    <TouchableOpacity style={styles.controlBtn} onPress={incrementTotal}>
                        <McIcons name="plus" size={24} color={theme.text2} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.controlBtn} onPress={handleReset}>
                        <McIcons name="reload" size={26} color={theme.primary} />
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </AppFullScreen>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 24,
        gap: 16,
    },

    // Instruction
    instruction: {
        alignSelf: "center",
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginVertical: 16,
        borderWidth: 1,
        borderRadius: 20,
        gap: 6,
    },
    instructionText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        opacity: 0.6,
    },

    // Presets
    presets: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
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
        fontWeight: '500',
        opacity: 0.6,
    },

    // Counter Circle
    circleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Bottom Info Bar (LAP + LIMIT)
    infoCard: {
        width: '100%',
        flexDirection: "row",
        justifyContent: 'center',
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
        fontWeight: '600',
        opacity: 0.6,
    },

    // Bottom Controls (Pill)
    controls: {
        width: '95%',
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        borderRadius: 40,
        paddingVertical: 14,
    },
    controlBtn: {
        width: 52,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    controlValue: {
        fontSize: 20,
        fontWeight: '600',
        marginHorizontal: 6,
        opacity: 0.6,
    },
});