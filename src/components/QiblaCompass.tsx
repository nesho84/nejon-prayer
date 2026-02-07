import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { StyleSheet, View, Text, Animated, TouchableOpacity, Vibration } from 'react-native';
import { router } from "expo-router";
import { Magnetometer, Accelerometer } from 'expo-sensors';
import { Ionicons } from '@expo/vector-icons';
import { useLanguageStore } from "@/store/languageStore";

interface Props {
    loading: boolean;
    latitude: number | null;
    longitude: number | null;
    timeZone: string | null;
    bgColor?: string;
    color?: string;
    textColor?: string;
}

// Kaaba coordinates (Mecca)
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;
const MAX_HISTORY = 5;

export default function QiblaCompass({
    loading,
    latitude,
    longitude,
    timeZone,
    bgColor = '#eee',
    color = '#2563eb',
    textColor = '#333'
}: Props) {
    // Stores
    const tr = useLanguageStore((state) => state.tr);

    // Local state
    const isFocused = useIsFocused();
    const [compassHeading, setCompassHeading] = useState(0);
    const [magnetometerAccuracy, setMagnetometerAccuracy] = useState('unknown');
    const [showCalibration, setShowCalibration] = useState(false);
    const [distanceToKaaba, setDistanceToKaaba] = useState(0);
    const [isFlat, setIsFlat] = useState(true);
    const [isAligned, setIsAligned] = useState(false);

    // Refs
    const accelRef = useRef({ x: 0, y: 0, z: 0 });
    const headingHistoryRef = useRef<number[]>([]);

    // ------------------------------------------------------------
    // Calculate distance using Haversine formula
    // ------------------------------------------------------------
    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const R = 6371; // Earth's radius in km

        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // ------------------------------------------------------------
    // Calculate Qibla direction (bearing from user to Kaaba)
    // ------------------------------------------------------------
    const calculateQiblaDirection = (userLat: number, userLng: number) => {
        const toRad = (deg: number) => (deg * Math.PI) / 180;

        const lat1 = toRad(userLat);
        const lng1 = toRad(userLng);
        const lat2 = toRad(KAABA_LAT);
        const lng2 = toRad(KAABA_LNG);

        const dLng = lng2 - lng1;
        const y = Math.sin(dLng) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

        let bearing = Math.atan2(y, x) * (180 / Math.PI);
        return (bearing + 360) % 360;
    };

    // ------------------------------------------------------------
    // Memoize Qibla direction - only recalculate when location changes
    // ------------------------------------------------------------
    const qiblaDirection = useMemo(() => {
        if (!latitude || !longitude) return 0;
        return calculateQiblaDirection(latitude, longitude);
    }, [latitude, longitude]);

    // ------------------------------------------------------------
    // Get compass direction label (N, NE, E, etc.)
    // ------------------------------------------------------------
    const getCompassDirection = (angle: number) => {
        const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        return dirs[Math.round(angle / 45) % 8];
    };

    // ------------------------------------------------------------
    // Smooth heading with moving average filter
    // ------------------------------------------------------------
    const smoothHeading = (newHeading: number) => {
        headingHistoryRef.current.push(newHeading);
        if (headingHistoryRef.current.length > MAX_HISTORY) {
            headingHistoryRef.current.shift();
        }
        const sum = headingHistoryRef.current.reduce((a, b) => a + b, 0);
        return sum / headingHistoryRef.current.length;
    };

    // ------------------------------------------------------------
    // Calculate distance when location changes
    // ------------------------------------------------------------
    useEffect(() => {
        if (latitude && longitude) {
            const dist = calculateDistance(latitude, longitude, KAABA_LAT, KAABA_LNG);
            setDistanceToKaaba(Math.round(dist));
        }
    }, [latitude, longitude]);

    // ------------------------------------------------------------
    // Monitor device tilt with accelerometer
    // ------------------------------------------------------------
    useEffect(() => {
        if (!isFocused) return;

        Accelerometer.setUpdateInterval(200);
        const sub = Accelerometer.addListener(({ x, y, z }) => {
            accelRef.current = { x, y, z };
            setIsFlat(Math.abs(z) > 0.8);
        });

        return () => sub?.remove();
    }, [isFocused]);

    // ------------------------------------------------------------
    // Monitor compass heading with magnetometer
    // ------------------------------------------------------------
    useEffect(() => {
        if (!isFocused) return;

        let sub: any;
        const subscribe = async () => {
            const available = await Magnetometer.isAvailableAsync();
            if (!available) return;

            Magnetometer.setUpdateInterval(100);
            sub = Magnetometer.addListener((mag) => {
                const { x: mx, y: my, z: mz } = mag;
                const { x: ax, y: ay, z: az } = accelRef.current;

                // Tilt-compensated compass heading
                const pitch = Math.atan2(-ax, Math.sqrt(ay * ay + az * az));
                const roll = Math.atan2(ay, az);
                const Xh = mx * Math.cos(pitch) + mz * Math.sin(pitch);
                const Yh = mx * Math.sin(roll) * Math.sin(pitch) + my * Math.cos(roll) - mz * Math.sin(roll) * Math.cos(pitch);

                // heading (azimuth) in degrees, normalized 0..360
                let heading = Math.atan2(-Xh, Yh) * (180 / Math.PI);
                if (heading < 0) heading += 360;

                // smooth & set
                setCompassHeading(smoothHeading(heading));

                // Check magnetic field strength for accuracy
                const magnitude = Math.sqrt(mx * mx + my * my + mz * mz);
                if (magnitude < 20 || magnitude > 100) setMagnetometerAccuracy('low');
                else if (magnitude < 30 || magnitude > 70) setMagnetometerAccuracy('medium');
                else setMagnetometerAccuracy('high');
            });
        };

        subscribe();

        return () => sub?.remove();
    }, [isFocused]);

    // ------------------------------------------------------------
    // Check if aligned with Qibla (within 5 degrees)
    // ------------------------------------------------------------
    useEffect(() => {
        if (!isFocused) return;

        // Calculate difference between where we're facing (up = 0°) and Qibla direction
        let diff = Math.abs(qiblaDirection - compassHeading);
        // Normalize to 0-180 range
        if (diff > 180) diff = 360 - diff;

        const aligned = diff < 5; // Within 5 degrees

        if (aligned && !isAligned) {
            Vibration.vibrate(100); // Haptic feedback
            setIsAligned(true);
        } else if (!aligned && isAligned) {
            setIsAligned(false);
        }
    }, [compassHeading, qiblaDirection, isAligned, isFocused]);

    // ------------------------------------------------------------
    // Show calibration hint after 3 seconds of low accuracy
    // ------------------------------------------------------------
    useEffect(() => {
        if (magnetometerAccuracy === 'low' && isFocused) {
            const timer = setTimeout(() => setShowCalibration(true), 3000);
            return () => clearTimeout(timer);
        }
    }, [magnetometerAccuracy, isFocused]);

    // Loading state
    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: bgColor }]}>
                <Ionicons name="compass" size={80} color={color} />
                <Text style={[styles.msgText, { color: textColor, marginTop: 16 }]}>
                    {tr.labels.loadingSettings}
                </Text>
            </View>
        );
    }

    // No location set
    if (!latitude || !longitude) {
        return (
            <View style={[styles.container, { backgroundColor: bgColor }]}>
                <Ionicons name="location-outline" size={80} color="#ff6b6b" />
                <Text style={[styles.errorSubText, { color: textColor, marginTop: 8 }]}>
                    {tr.labels.locationOff}
                </Text>
                <TouchableOpacity
                    style={[styles.errorButton, { backgroundColor: color }]}
                    onPress={() => router.navigate("/(tabs)/settings")}>
                    <Text style={styles.errorButtonText}>{tr.labels.goToSettings}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            {/* Warning Banners */}
            {!isFlat && (
                <View style={[styles.warning, { backgroundColor: '#ff9800' }]}>
                    <Ionicons name="phone-portrait-outline" size={20} color="#fff" />
                    <Text style={styles.warningText}>{tr.labels.compassWarning1}</Text>
                </View>
            )}

            {magnetometerAccuracy === 'low' && showCalibration && (
                <View style={[styles.warning, { backgroundColor: '#f44336' }]}>
                    <Ionicons name="refresh" size={20} color="#fff" />
                    <Text style={styles.warningText}>{tr.labels.compassWarning2}</Text>
                    <TouchableOpacity onPress={() => setShowCalibration(false)}>
                        <Ionicons name="close" size={20} color="#fff" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                </View>
            )}

            {magnetometerAccuracy === 'medium' && (
                <View style={[styles.warning, { backgroundColor: '#ff9800' }]}>
                    <Ionicons name="magnet-outline" size={20} color="#fff" />
                    <Text style={styles.warningText}>{tr.labels.compassWarning3}</Text>
                </View>
            )}

            {/* Direction & Location Display */}
            <Text style={[styles.degreeText, { color: isAligned ? color : textColor }]}>
                {Math.round(compassHeading)}°
            </Text>
            <Text style={[styles.locationText, { color: textColor }]}>
                {timeZone || "Location"}
            </Text>

            {/* Compass */}
            <View style={styles.compassContainer}>
                {/* Rotating background circle */}
                <Animated.View style={[styles.compassCircle, {
                    borderColor: isAligned ? color : '#555',
                    transform: [{ rotate: `${-compassHeading}deg` }]
                }]}>
                    {/* Aligned indicator ring */}
                    {isAligned && <View style={[styles.alignedRing, { borderColor: color }]} />}

                    {/* Inner circle */}
                    <View style={styles.innerCircle} />

                    {/* Cardinal directions */}
                    <View style={styles.cardinals}>
                        <Text style={[styles.cardinal, styles.cardinalN, { color }, { transform: [{ rotate: `${compassHeading}deg` }] }]}>N</Text>
                        <Text style={[styles.cardinal, styles.cardinalE, { color: textColor }, { transform: [{ rotate: `${compassHeading}deg` }] }]}>E</Text>
                        <Text style={[styles.cardinal, styles.cardinalS, { color: textColor }, { transform: [{ rotate: `${compassHeading}deg` }] }]}>S</Text>
                        <Text style={[styles.cardinal, styles.cardinalW, { color: textColor }, { transform: [{ rotate: `${compassHeading}deg` }] }]}>W</Text>
                    </View>

                    {/* Needle INSIDE the rotating ring */}
                    <View style={[styles.needleContainer, { transform: [{ rotate: `${qiblaDirection}deg` }] }]}>
                        <View style={[styles.needleShaft, { backgroundColor: color }]} />
                        <View style={[styles.needleArrow, { borderBottomColor: color }]} />
                        <View style={[styles.needleBackLine, { backgroundColor: color }]} />
                    </View>
                </Animated.View>

                {/* Fixed center dot */}
                <View style={[styles.needleDot, { backgroundColor: "#333" }]} />
            </View>

            {/* Info Row */}
            <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                    <Ionicons name="navigate" size={20} color={color} />
                    <Text style={[styles.infoText, { color: textColor }]}>
                        {Math.round(qiblaDirection)}°
                    </Text>
                </View>
                <View style={styles.infoItem}>
                    <Ionicons name="map-outline" size={20} color={color} />
                    <Text style={[styles.infoText, { color: textColor }]}>
                        {distanceToKaaba.toLocaleString()} km
                    </Text>
                </View>
            </View>

            {/* Accuracy Indicator */}
            <View style={styles.accuracyRow}>
                <View style={[styles.accuracyDot, {
                    backgroundColor: magnetometerAccuracy === 'high' ? '#4CAF50' :
                        magnetometerAccuracy === 'medium' ? '#ff9800' : '#f44336'
                }]} />
                <Text style={[styles.accuracyText, { color: textColor }]}>
                    {tr.labels.accuracy}: {magnetometerAccuracy}
                </Text>
            </View>

            {/* Instruction for alignment */}
            <View style={styles.alignBadgeContainer}>
                {isAligned ? (
                    <View style={[styles.alignBadge, { backgroundColor: color + '22', borderColor: color }]}>
                        <Ionicons name="checkmark-circle" size={18} color={color} />
                        <Text style={[styles.alignBadgeText, { color }]}>
                            {tr.labels.compasAligned}
                        </Text>
                    </View>
                ) : (
                    <View style={[styles.alignBadge, { borderColor: "#2e2b2bff" }]}>
                        <Ionicons name="arrow-forward" size={18} color="#f44336" />
                        <Text style={[styles.instructionText, { color: textColor }]}>
                            {tr.labels.compasNotAligned}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 12,
        paddingHorizontal: 24,
    },

    // Info top
    degreeText: {
        fontSize: 36,
        fontWeight: 'bold',
        marginTop: 48,
        marginBottom: 4,
    },
    locationText: {
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 30,
        opacity: 0.6,
    },

    // Compass
    compassContainer: {
        width: 280,
        height: 280,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
        position: 'relative',
    },
    compassCircle: {
        width: 280,
        height: 280,
        borderRadius: 140,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
        position: 'absolute',
    },
    innerCircle: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 2,
        borderColor: '#666', // light gray
        opacity: 0.6,
    },
    alignedRing: {
        position: 'absolute',
        width: 290,
        height: 290,
        borderRadius: 145,
        borderWidth: 6,
        borderStyle: 'dashed',
        top: -8,
        left: -8,
    },
    cardinals: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardinal: {
        position: 'absolute',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    cardinalS: { bottom: 5, fontSize: 20 },
    cardinalN: { top: 6, fontSize: 20 },
    cardinalW: { left: 10, top: '50%', marginTop: -13, fontSize: 20 },
    cardinalE: { right: 14, top: '50%', marginTop: -13, fontSize: 20 },

    // Needle
    needleContainer: {
        position: 'absolute',
        alignItems: 'center',
        height: 280,
        width: 280,
    },
    needleDot: {
        position: 'absolute',
        width: 16,
        height: 16,
        borderRadius: 8,
    },
    needleShaft: {
        width: 4,
        height: 95,
        borderRadius: 2,
        position: 'absolute',
        top: 77,
    },
    needleArrow: {
        width: 0,
        height: 0,
        borderLeftWidth: 12,
        borderRightWidth: 12,
        borderBottomWidth: 24,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        position: 'absolute',
        top: 55,
    },
    needleBackLine: {
        width: 4,
        height: 25,
        borderRadius: 2,
        position: 'absolute',
        bottom: 55,
        opacity: 0.5,
    },

    // Info row
    infoRow: {
        flexDirection: 'row',
        gap: 24,
        marginBottom: 12,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: 16,
        fontWeight: '600',
    },
    accuracyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    accuracyDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    accuracyText: {
        fontSize: 12,
        opacity: 0.7,
    },
    instructionText: {
        fontSize: 14,
        textAlign: 'center',
        opacity: 0.7,
        maxWidth: 280,
    },
    alignBadgeContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    alignBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    alignBadgeText: {
        fontSize: 14,
        fontWeight: '600',
    },

    // Error / Text
    warning: {
        position: 'absolute',
        top: 10,
        left: 20,
        right: 20,
        padding: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    warningText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        flex: 1,
    },
    msgText: {
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
    },
    errorButton: {
        marginTop: 16,
        padding: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    errorButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    errorSubText: {
        fontSize: 14,
        opacity: 0.7,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});