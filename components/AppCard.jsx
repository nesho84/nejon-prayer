import { View, StyleSheet } from 'react-native';
import { useThemeContext } from "@/contexts/ThemeContext";

export default function AppCard({ children, style, ...otherProps }) {
    const { theme } = useThemeContext();

    return (
        <View
            style={[
                styles.card,
                { backgroundColor: theme.card },
                style
            ]}
            {...otherProps}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
});
