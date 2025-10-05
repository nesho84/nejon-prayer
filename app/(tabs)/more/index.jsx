import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "@/contexts/ThemeContext";

export default function MoreScreen() {
    const { theme } = useThemeContext();

    return (
        <View style={[styles.content, { backgroundColor: theme.bg }]}>

            <Ionicons name="apps-sharp" size={100} color={theme.placeholder} style={{ marginBottom: 24 }} />

            <Text style={[styles.title, { color: theme.text }]}>More Options</Text>

            <Link href="/(tabs)/more/namazi" asChild>
                <Pressable style={styles.button}>
                    <Text style={styles.buttonText}>Namazi</Text>
                </Pressable>
            </Link>

            <Link href="/(tabs)/more/abdesi" asChild>
                <Pressable style={styles.button}>
                    <Text style={styles.buttonText}>Abdesi</Text>
                </Pressable>
            </Link>

            <Link href="/(tabs)/more/tesbih" asChild>
                <Pressable style={styles.button}>
                    <Text style={styles.buttonText}>Tesbih</Text>
                </Pressable>
            </Link>
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    button: { width: "100%", padding: 15, backgroundColor: '#007AFF', borderRadius: 8, marginBottom: 10 },
    buttonText: { color: 'white', fontSize: 16, textAlign: 'center' },
});