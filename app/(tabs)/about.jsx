import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function About() {
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 12 }}>About This App</Text>
                <Text style={{ textAlign: 'center' }}>This is a prayer times and Islamic events app.</Text>
                <Text>Powered by Nejon.</Text>
            </View>
        </SafeAreaView>
    );
}
