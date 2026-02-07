import { View, StyleSheet, ViewStyle, ViewProps } from 'react-native';
import { useThemeStore } from '@/store/themeStore';

interface Props extends ViewProps {
    children: React.ReactNode;
    style?: ViewStyle | ViewStyle[];
}

export default function AppCard({ children, style, ...otherProps }: Props) {
    // Stores
    const theme = useThemeStore((state) => state.theme);

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
