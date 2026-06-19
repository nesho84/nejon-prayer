import { Ionicons } from "@expo/vector-icons";
import { Image, ImageSourcePropType, Modal, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
    visible: boolean;
    source: ImageSourcePropType | null;
    onClose: () => void;
}

// Zoom limits
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

export default function ImageViewer({ visible, source, onClose }: Props) {
    // Safe area insets
    const insets = useSafeAreaInsets();
    const topInset = insets.top + 12;
    const bottomInset = insets.bottom + 12;

    // Layout
    const { width, height } = useWindowDimensions();

    // Shared transform values (UI thread)
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    // ------------------------------------------------------------
    // Reset every transform back to the default 1x, centered view
    // ------------------------------------------------------------
    const resetTransform = () => {
        scale.value = 1;
        savedScale.value = 1;
        translateX.value = 0;
        savedTranslateX.value = 0;
        translateY.value = 0;
        savedTranslateY.value = 0;
    };

    // ------------------------------------------------------------
    // Close the viewer, clearing the transform for the next image
    // ------------------------------------------------------------
    const handleClose = () => {
        resetTransform();
        onClose();
    };

    // ------------------------------------------------------------
    // Pinch to zoom, clamped between 1x and MAX_SCALE
    // ------------------------------------------------------------
    const pinch = Gesture.Pinch()
        .onUpdate((e) => {
            scale.value = Math.max(1, Math.min(savedScale.value * e.scale, MAX_SCALE));
        })
        .onEnd(() => {
            savedScale.value = scale.value;
            // Snap back to center once fully zoomed out
            if (scale.value <= 1) {
                scale.value = withTiming(1);
                translateX.value = withTiming(0);
                translateY.value = withTiming(0);
                savedTranslateX.value = 0;
                savedTranslateY.value = 0;
            } else {
                // Keep the (now smaller) image within bounds after zooming out
                const maxX = (width * (scale.value - 1)) / 2;
                const maxY = (height * (scale.value - 1)) / 2;
                translateX.value = Math.min(maxX, Math.max(-maxX, translateX.value));
                translateY.value = Math.min(maxY, Math.max(-maxY, translateY.value));
                savedTranslateX.value = translateX.value;
                savedTranslateY.value = translateY.value;
            }
        });

    // ------------------------------------------------------------
    // Pan to move the image around, clamped to its edges so it can't
    // be dragged off screen (no movement at all while not zoomed in)
    // ------------------------------------------------------------
    const pan = Gesture.Pan()
        .onUpdate((e) => {
            const maxX = (width * (scale.value - 1)) / 2;
            const maxY = (height * (scale.value - 1)) / 2;
            translateX.value = Math.min(maxX, Math.max(-maxX, savedTranslateX.value + e.translationX));
            translateY.value = Math.min(maxY, Math.max(-maxY, savedTranslateY.value + e.translationY));
        })
        .onEnd(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        });

    // ------------------------------------------------------------
    // Double tap toggles between zoomed in and the default view
    // ------------------------------------------------------------
    const doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
            if (scale.value > 1) {
                scale.value = withTiming(1);
                savedScale.value = 1;
                translateX.value = withTiming(0);
                translateY.value = withTiming(0);
                savedTranslateX.value = 0;
                savedTranslateY.value = 0;
            } else {
                scale.value = withTiming(DOUBLE_TAP_SCALE);
                savedScale.value = DOUBLE_TAP_SCALE;
            }
        });

    // Pinch + pan + double tap all run together; dismissal is via the
    // close button or the Android back gesture, not a single tap
    const gesture = Gesture.Simultaneous(pinch, pan, doubleTap);

    // ------------------------------------------------------------
    // Apply the live transform to the image
    // ------------------------------------------------------------
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    if (!source) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={handleClose}>
            <GestureHandlerRootView style={styles.root}>
                <View style={styles.backdrop}>

                    {/* Zoomable image */}
                    <GestureDetector gesture={gesture}>
                        <Animated.View style={[styles.imageWrapper, { width, height }, animatedStyle]}>
                            <Image source={source} style={{ width, height }} resizeMode="contain" />
                        </Animated.View>
                    </GestureDetector>

                    {/* Close button */}
                    <Pressable
                        testID="image-viewer-close"
                        style={[styles.closeButton, { top: topInset, bottom: bottomInset }]}
                        hitSlop={12}
                        onPress={handleClose}
                    >
                        <Ionicons name="close" size={28} color="#fff" />
                    </Pressable>

                </View>
            </GestureHandlerRootView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    // Layout
    root: {
        flex: 1,
    },
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.92)",
        alignItems: "center",
        justifyContent: "center",
    },
    imageWrapper: {
        alignItems: "center",
        justifyContent: "center",
    },

    // Close button
    closeButton: {
        position: "absolute",
        right: 16,
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
    },
});
