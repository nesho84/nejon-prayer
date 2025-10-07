import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, TouchableOpacity, Vibration, Linking } from 'react-native';
import { Magnetometer, Accelerometer } from 'expo-sensors';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

export default function QiblaCompass({ color = '#4CAF50', backgroundColor = '#fff', textColor = '#333' }) {
    const [compassHeading, setCompassHeading] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [userLocation, setUserLocation] = useState({ lat: null, lng: null });
    const [isFlat, setIsFlat] = useState(true);
    const [magnetometerAccuracy, setMagnetometerAccuracy] = useState('unknown');
    const [showCalibration, setShowCalibration] = useState(false);
    const [distanceToKaaba, setDistanceToKaaba] = useState(0);
    const [isAligned, setIsAligned] = useState(false);

    // For smoothing compass readings
    const accelRef = useRef({ x: 0, y: 0, z: 0 });
    const headingHistory = useRef([]);
    const MAX_HISTORY = 5;

    // Kaaba coordinates
    const KAABA_LAT = 21.4225;
    const KAABA_LNG = 39.8262;

    // Calculate Qibla direction
    const calculateQiblaDirection = (userLat, userLng) => {
        const toRad = (deg) => (deg * Math.PI) / 180;

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

    // Calculate distance to Kaaba (Haversine formula)
    const calculateDistance = (lat1, lng1, lat2, lng2) => {
        const toRad = (deg) => (deg * Math.PI) / 180;
        const R = 6371; // Earth's radius in km

        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const qiblaDirection = userLocation.lat && userLocation.lng ?
        calculateQiblaDirection(userLocation.lat, userLocation.lng) : 0;

    // Smooth heading with low-pass filter
    const smoothHeading = (newHeading) => {
        headingHistory.current.push(newHeading);
        if (headingHistory.current.length > MAX_HISTORY) {
            headingHistory.current.shift();
        }

        // Calculate average
        const sum = headingHistory.current.reduce((a, b) => a + b, 0);
        return sum / headingHistory.current.length;
    };

    // Fetch location
    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError('');

        const fetchLocation = async () => {
            try {
                // Check if location services are enabled
                const servicesEnabled = await Location.hasServicesEnabledAsync();
                if (!servicesEnabled) {
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status !== "granted") {
                        setError('Location services are disabled. Please enable GPS/location services.');
                        setLoading(false);
                        return;
                    }
                }

                // Use the last known location if already enabled
                const lastKnown = await Location.getLastKnownPositionAsync();
                if (lastKnown && mounted) {
                    setUserLocation({
                        lat: lastKnown.coords.latitude,
                        lng: lastKnown.coords.longitude
                    });
                    const dist = calculateDistance(lastKnown.coords.latitude, lastKnown.coords.longitude, KAABA_LAT, KAABA_LNG);
                    setDistanceToKaaba(Math.round(dist));
                    setLoading(false);
                    return;
                }

                // Make sure we always have a location
                const locationPromise = Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Lowest,
                    maximumAge: 10000,
                });
                const timeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), 5000)
                );
                const loc = await Promise.race([locationPromise, timeout]);

                if (mounted) {
                    setUserLocation({
                        lat: loc.coords.latitude,
                        lng: loc.coords.longitude
                    });
                    const dist = calculateDistance(loc.coords.latitude, loc.coords.longitude, KAABA_LAT, KAABA_LNG);
                    setDistanceToKaaba(Math.round(dist));
                }
            } catch (err) {
                setError('Unable to get location. Please check GPS.');

            } finally {
                setLoading(false);
            }
        };

        fetchLocation();

        return () => {
            mounted = false;
        };
    }, []);

    // Monitor device tilt with accelerometer
    useEffect(() => {
        Accelerometer.setUpdateInterval(200);
        const sub = Accelerometer.addListener(({ x, y, z }) => {
            accelRef.current = { x, y, z };
            const isDeviceFlat = Math.abs(z) > 0.8;
            setIsFlat(isDeviceFlat);
        });
        return () => sub && sub.remove();
    }, []);

    // Subscribe to magnetometer
    useEffect(() => {
        let sub;
        const subscribe = async () => {
            const available = await Magnetometer.isAvailableAsync();
            if (!available) {
                setError('Compass not available');
                return;
            }
            Magnetometer.setUpdateInterval(100);

            sub = Magnetometer.addListener((mag) => {
                const { x: mx, y: my, z: mz } = mag;
                const { x: ax, y: ay, z: az } = accelRef.current;

                // normalize gravity
                const g = Math.sqrt(ax * ax + ay * ay + az * az) || 1;
                // pitch and roll from accelerometer
                const pitch = Math.atan2(-ax, Math.sqrt(ay * ay + az * az));
                const roll = Math.atan2(ay, az);
                // Tilt-compensated magnetic components
                const Xh = mx * Math.cos(pitch) + mz * Math.sin(pitch);
                const Yh = mx * Math.sin(roll) * Math.sin(pitch) + my * Math.cos(roll) - mz * Math.sin(roll) * Math.cos(pitch);
                // heading (azimuth) in degrees, normalized 0..360
                let heading = Math.atan2(-Xh, Yh) * (180 / Math.PI);
                if (heading < 0) heading += 360;
                // smooth & set
                const sm = smoothHeading(heading);
                setCompassHeading(sm);

                // (optional) compute magnitude for accuracy gauge
                const magnitude = Math.sqrt(mx * mx + my * my + mz * mz);
                if (magnitude < 20 || magnitude > 100) setMagnetometerAccuracy('low');
                else if (magnitude < 30 || magnitude > 70) setMagnetometerAccuracy('medium');
                else setMagnetometerAccuracy('high');
            });
        };

        subscribe();
        return () => sub && sub.remove();
    }, [magnetometerAccuracy]);

    // Check if aligned with Qibla
    useEffect(() => {
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
    }, [compassHeading, qiblaDirection]);

    // compute relative rotation: Qibla relative to device heading
    const needleRotation = ((compassHeading - qiblaDirection) + 360) % 360;

    // Get compass direction
    const getDirection = (angle) => {
        const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        return dirs[Math.round(angle / 45) % 8];
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor }]}>
                <Ionicons name="compass" size={80} color={color} />
                <Text style={[styles.text, { color: textColor, marginTop: 16 }]}>
                    Getting location...
                </Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, { backgroundColor }]}>
                <Ionicons name="alert-circle" size={60} color="#ff6b6b" />
                <Text style={[styles.text, { color: textColor, marginTop: 16 }]}>
                    {error}
                </Text>
                <TouchableOpacity
                    style={{ marginTop: 16, padding: 10, backgroundColor: color, borderRadius: 8 }}
                    onPress={() => Linking.openSettings()}
                >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Open Settings</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor }]}>
            {/* Warnings */}
            {!isFlat && (
                <View style={[styles.warning, { backgroundColor: '#ff9800' }]}>
                    <Ionicons name="phone-portrait-outline" size={20} color="#fff" />
                    <Text style={styles.warningText}>Hold device flat</Text>
                </View>
            )}

            {magnetometerAccuracy === 'low' && showCalibration && (
                <View style={[styles.warning, { backgroundColor: '#f44336' }]}>
                    <Ionicons name="refresh" size={20} color="#fff" />
                    <Text style={styles.warningText}>
                        Move device in figure-8 motion to calibrate
                    </Text>
                    <TouchableOpacity onPress={() => setShowCalibration(false)}>
                        <Ionicons name="close" size={20} color="#fff" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                </View>
            )}

            {magnetometerAccuracy === 'medium' && (
                <View style={[styles.warning, { backgroundColor: '#ff9800' }]}>
                    <Ionicons name="magnet-outline" size={20} color="#fff" />
                    <Text style={styles.warningText}>Move away from electronics</Text>
                </View>
            )}

            {/* Compass direction */}
            <Text style={[styles.directionText, { color: isAligned ? color : textColor }]}>
                {getDirection(compassHeading)}
            </Text>
            <Text style={[styles.degreeText, { color: textColor }]}>
                {Math.round(compassHeading)}°
            </Text>

            {/* Compass */}
            <View style={styles.compassContainer}>
                {/* Rotating compass circle */}
                <Animated.View
                    style={[
                        styles.compassCircle,
                        {
                            borderColor: isAligned ? color : '#555',
                            transform: [{ rotate: `${-compassHeading}deg` }]
                        }
                    ]}
                >
                    <View style={styles.compassRose}>
                        <Text style={[styles.cardinalN, { color }, { transform: [{ rotate: `${compassHeading}deg` }] }]}>N</Text>
                        <Text style={[styles.cardinalE, { color: textColor }, { transform: [{ rotate: `${compassHeading}deg` }] }]}>E</Text>
                        <Text style={[styles.cardinalS, { color: textColor }, { transform: [{ rotate: `${compassHeading}deg` }] }]}>S</Text>
                        <Text style={[styles.cardinalW, { color: textColor }, { transform: [{ rotate: `${compassHeading}deg` }] }]}>W</Text>
                    </View>

                    {/* Aligned indicator ring */}
                    {isAligned && (
                        <View style={[styles.alignedRing, { borderColor: color }]} />
                    )}

                    {/* Needle INSIDE the rotating ring */}
                    <View
                        style={[
                            styles.needleContainer,
                            { transform: [{ rotate: `${qiblaDirection}deg` }] },
                        ]}
                    >
                        <View style={[styles.needleShaft, { backgroundColor: color }]} />
                        <View style={[styles.arrowTip, { borderBottomColor: color }]} />
                        <View style={[styles.needleBack, { backgroundColor: color }]} />
                    </View>
                </Animated.View>

                {/* Fixed center dot */}
                <View style={styles.centerDot} />
            </View>

            {/* Info */}
            <View style={styles.infoRow}>
                <View style={styles.infoContainer}>
                    <Ionicons name="navigate" size={20} color={color} />
                    <Text style={[styles.infoText, { color: textColor }]}>
                        {Math.round(qiblaDirection)}°
                    </Text>
                </View>

                <View style={styles.infoContainer}>
                    <Ionicons name="map-outline" size={20} color={color} />
                    <Text style={[styles.infoText, { color: textColor }]}>
                        {distanceToKaaba.toLocaleString()} km
                    </Text>
                </View>
            </View>

            {/* Accuracy indicator */}
            <View style={styles.accuracyContainer}>
                <View style={[styles.accuracyDot, {
                    backgroundColor: magnetometerAccuracy === 'high' ? '#4CAF50' :
                        magnetometerAccuracy === 'medium' ? '#ff9800' : '#f44336'
                }]} />
                <Text style={[styles.accuracyText, { color: textColor }]}>
                    Accuracy: {magnetometerAccuracy}
                </Text>
            </View>

            <Text style={[styles.instructionText, { color: textColor }]}>
                {isAligned ? '✓ Aligned with Qibla' : 'Rotate until arrow points upward'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    warning: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        padding: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        zIndex: 100,
    },
    warningText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    text: {
        fontSize: 16,
        fontWeight: '500',
    },
    directionText: {
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    degreeText: {
        fontSize: 20,
        marginBottom: 30,
        opacity: 0.7,
    },
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
        position: 'relative',
    },
    alignedRing: {
        position: 'absolute',
        width: 290,
        height: 290,
        borderRadius: 145,
        borderWidth: 6,
        borderStyle: 'dashed',
    },
    compassRose: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    cardinalN: {
        position: 'absolute',
        top: 15,
        alignSelf: 'center',
        fontSize: 24,
        fontWeight: 'bold',
    },
    cardinalE: {
        position: 'absolute',
        right: 15,
        top: '50%',
        marginTop: -12,
        fontSize: 20,
        fontWeight: '600',
    },
    cardinalS: {
        position: 'absolute',
        bottom: 15,
        alignSelf: 'center',
        fontSize: 20,
        fontWeight: '600',
    },
    cardinalW: {
        position: 'absolute',
        left: 15,
        top: '50%',
        marginTop: -12,
        fontSize: 20,
        fontWeight: '600',
    },
    centerDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#333',
        position: 'absolute',
        zIndex: 10,
    },
    needleContainer: {
        position: 'absolute',
        alignItems: 'center',
        height: 280,
        width: 280,
        zIndex: 5,
    },
    needleShaft: {
        width: 4,
        height: 100,
        borderRadius: 2,
        position: 'absolute',
        top: 40,
    },
    arrowTip: {
        width: 0,
        height: 0,
        borderLeftWidth: 12,
        borderRightWidth: 12,
        borderBottomWidth: 24,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        position: 'absolute',
        top: 16,
    },
    needleBack: {
        width: 4,
        height: 30,
        borderRadius: 2,
        position: 'absolute',
        bottom: 40,
        opacity: 0.4,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 24,
        marginBottom: 12,
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: 16,
        fontWeight: '600',
    },
    accuracyContainer: {
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
});