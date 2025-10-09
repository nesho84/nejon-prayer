import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useThemeContext } from "@/contexts/ThemeContext";
import useTranslation from "@/hooks/useTranslation";
import AppScreen from "@/components/AppScreen";
import CounterCircle from "@/components/CounterCircle";

export default function QiblaScreen() {
    const { theme } = useThemeContext();
    const { tr } = useTranslation();

    // Preset options
    const presets = [33, 66, 99, 100];

    // Local state
    const [count, setCount] = useState(0);
    const [totalCount, setTotalCount] = useState(33);

    // ------------------------------------------------------------
    //  Handle press
    // ------------------------------------------------------------
    const handlePress = () => {
        if (count < totalCount) {
            setCount(count + 1);
        }
    };

    // ------------------------------------------------------------
    // Auto-restart when reaching total
    // ------------------------------------------------------------
    const handleCountReached = () => {
        setCount(0);
    };

    // ------------------------------------------------------------
    // Reset count to 0
    // ------------------------------------------------------------
    const handleReset = () => {
        setCount(0);
    };

    // ------------------------------------------------------------
    // Increment total count
    // ------------------------------------------------------------
    const incrementTotal = () => {
        setTotalCount(prev => prev + 1);
        setCount(0);
    };

    // ------------------------------------------------------------
    // Decrement total count
    // ------------------------------------------------------------
    const decrementTotal = () => {
        if (totalCount > 1) {
            setTotalCount(prev => prev - 1);
            setCount(0);
        }
    };

    // ------------------------------------------------------------
    // Set preset value
    // ------------------------------------------------------------
    const setPreset = (value) => {
        setTotalCount(value);
        setCount(0);
    };

    return (
        <AppScreen>
            <ScrollView
                style={[styles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {/* Preset Buttons */}
                <View style={styles.presetsContainer}>
                    {presets.map((preset) => (
                        <TouchableOpacity
                            key={preset}
                            style={[
                                styles.presetButton,
                                {
                                    backgroundColor: totalCount === preset ? theme.card : 'transparent',
                                    borderColor: totalCount === preset ? theme.divider : theme.border,
                                }
                            ]}
                            onPress={() => setPreset(preset)}
                        >
                            <Text style={[styles.presetButtonText, { color: totalCount === preset ? theme.text2 : theme.placeholder }]}>
                                {preset}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Custom Counter with +/- */}
                <View style={styles.customCounter}>
                    {/* Button (-) */}
                    <TouchableOpacity style={[styles.counterButton, { borderColor: theme.border }]} onPress={decrementTotal}>
                        <Text style={[styles.counterButtonText, { color: theme.text }]}>−</Text>
                    </TouchableOpacity>

                    {/* Counter number */}
                    <View style={[styles.countDisplay, { borderColor: theme.border }]}>
                        <Text style={[styles.countDisplayText, { color: theme.text2, opacity: 0.8 }]}>
                            {totalCount}
                        </Text>
                    </View>

                    {/* Button (+) */}
                    <TouchableOpacity style={[styles.counterButton, { borderColor: theme.border }]} onPress={incrementTotal}>
                        <Text style={[styles.counterButtonText, { color: theme.text }]}>+</Text>
                    </TouchableOpacity>
                </View>

                {/* Reset Button */}
                <TouchableOpacity style={[styles.resetButton, { borderColor: theme.border }]} onPress={handleReset}>
                    <Text style={[styles.resetButtonText, { color: theme.text2, opacity: 0.8 }]}>RESET</Text>
                </TouchableOpacity>

                {/* Instructions text */}
                <Text style={[styles.instructions, { color: theme.text2, opacity: 0.7 }]}>
                    {tr('tesbih.instructions')}
                </Text>

                {/* COUNTER CIRCLE */}
                <TouchableOpacity
                    style={styles.counterArea}
                    activeOpacity={0.9}
                    onPress={handlePress}
                >
                    <CounterCircle
                        currentCount={count}
                        totalCount={totalCount}
                        onCountReached={handleCountReached}
                        theme={theme}
                        tr={tr}
                        size={280}
                        strokeWidth={12}
                        backgroundColor={theme.border}
                        color={theme.primary}
                        vibrationDuration={500}
                    />
                </TouchableOpacity>

            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40,
        gap: 16,
    },

    // Presets
    presetsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 16,
    },
    presetButton: {
        minWidth: 70,
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 2,
    },
    presetButtonText: {
        fontSize: 18,
        fontWeight: '600',
    },

    // Custom Counter
    customCounter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
        gap: 20,
    },
    counterButton: {
        width: 50,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderRadius: 25,
    },
    counterButtonText: {
        fontSize: 28,
        fontWeight: '300',
    },
    countDisplay: {
        minWidth: 70,
        paddingVertical: 12,
        paddingHorizontal: 18,
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1.5,
    },
    countDisplayText: {
        fontSize: 18,
        fontWeight: '600',
    },

    // Reset Button
    resetButton: {
        height: 50,
        paddingVertical: 10,
        paddingHorizontal: 45,
        borderRadius: 8,
        borderWidth: 1.5,
    },
    resetButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 1,
    },

    // Instructions
    instructions: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
        marginTop: 8,
    },

    // Counter Area
    counterArea: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 320,
    },
});