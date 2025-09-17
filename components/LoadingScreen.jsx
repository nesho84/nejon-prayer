import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function LoadingScreen({ message = "Loading...", styling = null }) {
    return (
        <View style={{ ...styles.container, ...styling }}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.text}>
                {message}
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
        color: "#a78d8dff",
        fontSize: 20,
        marginVertical: 12
    }
});