import { useMemo } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function PrayerModal({
    visible,
    setVisible,
    header,
    theme,
    tr,
    selectedValue,
    onSelect
}) {

    if (!visible) return null;

    const handleSelect = (value) => {
        setVisible(false);
        onSelect(value);
    };

    const options = useMemo(() => {
        return [
            { label: `${tr('labels.offsetOff')}`, value: { enabled: false, offset: 0 }, icon: "close-circle-outline" },
            { label: `${tr('labels.offsetOnTime')}`, value: { enabled: true, offset: 0 }, icon: "time-outline" },
            { label: `5 ${tr('labels.offsetMinutes')}`, value: { enabled: true, offset: -5 }, icon: "alarm-outline" },
            { label: `10 ${tr('labels.offsetMinutes')}`, value: { enabled: true, offset: -10 }, icon: "alarm-outline" },
            { label: `15 ${tr('labels.offsetMinutes')}`, value: { enabled: true, offset: -15 }, icon: "alarm-outline" },
            { label: `30 ${tr('labels.offsetMinutes')}`, value: { enabled: true, offset: -30 }, icon: "alarm-outline" },
            { label: `45 ${tr('labels.offsetMinutes')}`, value: { enabled: true, offset: -45 }, icon: "alarm-outline" },
            { label: `60 ${tr('labels.offsetMinutes')}`, value: { enabled: true, offset: -60 }, icon: "alarm-outline" },
        ];
    }, []);

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setVisible(false)}
        >

            <View style={styles.overlay}>
                <View style={[styles.modalBox, { backgroundColor: theme.bg }]}>

                    {/* Header */}
                    <Text style={[styles.headerText, { color: theme.accent }]}>
                        {tr(`prayers.${header}`)}
                    </Text>
                    <View style={[styles.divider, { backgroundColor: theme.divider }]} />

                    {/* Options */}
                    <View style={styles.optionList}>
                        {options.map((option, index) => {
                            const isSelected =
                                selectedValue.enabled === option.value.enabled &&
                                selectedValue.offset === option.value.offset;

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.optionRow, isSelected && { backgroundColor: theme.accentLight }]}
                                    onPress={() => handleSelect(option.value)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.optionLabel}>
                                        {/* Icon */}
                                        <Ionicons
                                            name={option.icon}
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
                                    {isSelected && (<Ionicons name="checkmark" size={22} color={theme.accent} />)}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Footer */}
                    <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setVisible(false)}>
                        <Text style={[styles.cancelText, { color: theme.accent }]}>{tr("buttons.cancel")}</Text>
                    </TouchableOpacity>

                </View>
            </View>

        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.3)",
        padding: 25,
    },
    modalBox: {
        width: "85%",
        borderRadius: 14,
        overflow: "hidden",
        elevation: 6,
    },
    headerText: {
        fontSize: 18,
        fontWeight: "600",
        paddingHorizontal: 18,
        paddingVertical: 14,
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
        paddingHorizontal: 18,
        paddingVertical: 14,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: "500",
    },
});