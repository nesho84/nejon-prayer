import { useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useThemeContext } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

export default function OptionModal({ mode = "prayers", header, onSelect, button }) {
    const { theme } = useThemeContext();

    const [visible, setVisible] = useState(false);
    const [selected, setSelected] = useState(null);

    const handleSelect = (value) => {
        setSelected(value);
        setVisible(false);
        onSelect(value);
    };

    const options = () => {
        switch (mode) {
            case "prayers":
                return [
                    { label: "Off", value: false, icon: "close-circle-outline" },
                    { label: "On time", value: true, icon: "time-outline" },
                    { label: "5 min before", value: -5, icon: "alarm-outline" },
                    { label: "10 min before", value: -10, icon: "alarm-outline" },
                    { label: "15 min before", value: -15, icon: "alarm-outline" },
                    { label: "30 min before", value: -30, icon: "alarm-outline" },
                    { label: "1 hour before", value: -60, icon: "alarm-outline" },
                ];
            default:
                return [];
        }
    };

    return (
        <>
            {/* Automatically open the modal when component is pressed */}
            <TouchableOpacity onPress={() => setVisible(true)}>{button}</TouchableOpacity>

            <Modal
                visible={visible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >

                {/* Modal Content */}
                <View style={styles.overlay}>
                    <View style={[styles.modalBox, { backgroundColor: theme.bg }]}>

                        {/* Header */}
                        <Text style={[styles.headerText, { color: theme.text }]}>{header}</Text>
                        <View style={[styles.divider, { backgroundColor: theme.divider }]} />

                        {/* Options */}
                        <View style={styles.optionList}>
                            {options().map((option, index) => {
                                const isSelected = selected === option.value;
                                const iconName = option.icon || "options-outline";

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.optionRow,
                                            isSelected && { backgroundColor: theme.accentLight },
                                        ]}
                                        onPress={() => handleSelect(option.value)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.optionLabel}>
                                            {/* Icon */}
                                            <Ionicons
                                                name={iconName}
                                                size={20}
                                                color={isSelected ? theme.accent : theme.placeholder}
                                                style={{ marginRight: 10 }}
                                            />
                                            {/* Label */}
                                            <Text
                                                style={[
                                                    styles.optionText,
                                                    { color: theme.text2 },
                                                    isSelected && { fontWeight: 500, color: theme.accent },
                                                ]}
                                            >
                                                {option.label}
                                            </Text>
                                        </View>
                                        {/* Checkmark */}
                                        {isSelected && (<Ionicons name="checkmark" size={20} color={theme.accent} />)}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Footer */}
                        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setVisible(false)}>
                            <Text style={[styles.cancelText, { color: theme.text }]}>Cancel</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.4)",
        padding: 25,
    },
    modalBox: {
        width: "85%",
        borderRadius: 14,
        overflow: "hidden",
        elevation: 6,
    },
    headerText: {
        fontSize: 17,
        fontWeight: "600",
        paddingHorizontal: 18,
        paddingVertical: 12,
    },
    divider: {
        height: 1,
        width: '100%',
    },
    optionList: {
        paddingVertical: 4,
    },
    optionRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 18,
    },
    optionLabel: {
        flexDirection: "row",
        alignItems: "center",
    },
    optionText: {
        fontSize: 16,
    },
    cancelBtn: {
        alignItems: "center",
        paddingVertical: 12,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: "500",
    },
});