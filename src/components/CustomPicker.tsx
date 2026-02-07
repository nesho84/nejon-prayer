import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  items: Item[];
  selectedValue: string | number;
  onValueChange: (value: string | number) => void;
  placeholder?: string;
  style?: any;
  textColor?: string;
  selectedColor?: string;
  backgroundColor?: string;
  modalBackgroundColor?: string;
  borderColor?: string;
  enabled?: boolean;
}

export interface Item {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
}

export default function CustomPicker({
  items,
  selectedValue,
  onValueChange,
  placeholder = "Select...",
  style,
  textColor = "#666",
  selectedColor = "#666",
  backgroundColor = "transparent",
  modalBackgroundColor = "#fff",
  borderColor = "#ddd",
  enabled = true,
}: Props) {
  // Local state
  const [modalVisible, setModalVisible] = useState(false);
  const selectedItem = items.find(item => item.value === selectedValue);

  // ------------------------------------------------------------
  // Handle Option Select
  // ------------------------------------------------------------
  const handleSelect = (value: string | number) => {
    onValueChange(value);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.selector,
          { backgroundColor, borderColor, opacity: enabled ? 1 : 0.5 },
          style
        ]}
        onPress={() => enabled && setModalVisible(true)}
        activeOpacity={0.7}
        disabled={!enabled}
      >
        {selectedItem ? (
          <>
            {/* Selected Item icon/emojie */}
            {selectedItem.icon && (
              <Text style={styles.selectedIcon}>{selectedItem.icon}</Text>
            )}
            {/* Selected Item label */}
            <Text style={[styles.selectedText, { color: selectedItem.color || textColor }]}>
              {selectedItem.label}
            </Text>
          </>
        ) : (
          // Selected Item placeholder
          <Text style={[styles.selectedText, { color: textColor, opacity: 0.5 }]}>
            {placeholder}
          </Text>
        )}
        {/* Selected Item icon right */}
        <MaterialCommunityIcons
          name="chevron-down"
          size={24}
          color={selectedColor}
          style={styles.chevron}
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: modalBackgroundColor }]}
            onStartShouldSetResponder={() => true}
          >
            <FlatList
              data={items}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    {
                      backgroundColor: selectedValue === item.value
                        ? `${selectedColor}15`
                        : 'transparent',
                      borderBottomColor: borderColor,
                    }
                  ]}
                  onPress={() => handleSelect(item.value)}
                >
                  {/* Item icon/emojie */}
                  {item.icon && (
                    <Text style={styles.selectedIcon}>{item.icon}</Text>
                  )}
                  {/* Item label */}
                  <Text style={[styles.optionText, { color: item.color || textColor }]}>
                    {item.label}
                  </Text>
                  {/* Item icon right */}
                  {selectedValue === item.value && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={24}
                      color={selectedColor}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectedIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  selectedText: {
    fontSize: 17,
    flex: 1,
  },
  chevron: {
    marginLeft: 'auto',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    maxHeight: '60%',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: {
    fontSize: 17,
    flex: 1,
    fontWeight: '500',
  },
});