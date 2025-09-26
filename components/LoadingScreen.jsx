import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function LoadingScreen({ message = "Loading...", style }) {
    return (
        <View style={[styles.container, style]}>
            <ActivityIndicator size="large" color="#0284c7" />
            <Text style={styles.text}>
                {message || "Loading..."}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    text: {
        color: "#9ca3af",
        fontSize: 20,
        marginVertical: 12
    }
});