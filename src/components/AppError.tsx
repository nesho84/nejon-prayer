import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';

interface Props {
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    message?: string;
    buttonText?: string;
    buttonColor?: string;
    onPress?: () => void;
}

export default function ErrorScreen({
    icon = 'alert-circle-outline',
    iconColor = '#FF3B30',
    message = 'Something went wrong.',
    buttonText = 'Try Again',
    buttonColor = '#007AFF',
    onPress = () => { },
}: Props) {
    // Stores
    const theme = useThemeStore((state) => state.theme);

    return (
        <View style={[styles.errorContainer, { backgroundColor: theme.bg }]}>
            <View style={styles.errorBanner}>
                <Ionicons name={icon} size={80} color={iconColor} />
            </View>

            <Text style={[styles.errorText, { color: theme.text2 }]}>
                {message}
            </Text>

            <TouchableOpacity
                style={[styles.errorButton, { backgroundColor: buttonColor }]}
                onPress={onPress}>
                <Text style={[styles.errorButtonText, { color: theme.white }]}>
                    {buttonText}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorBanner: {
        marginBottom: 20,
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    errorButton: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
    },
    errorButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
