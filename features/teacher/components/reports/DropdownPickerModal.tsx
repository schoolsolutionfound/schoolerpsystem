import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { FontFamily } from '../../../../constants/fonts';

export interface DropdownOption {
  label: string;
  value: string;
  badge?: string;
  subtext?: string;
}

interface DropdownPickerModalProps {
  visible: boolean;
  title: string;
  options: (string | DropdownOption)[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export const DropdownPickerModal: React.FC<DropdownPickerModalProps> = ({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}) => {
  const normalizedOptions: DropdownOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { label: opt, value: opt };
    }
    return opt;
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetCard}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Options List */}
              <ScrollView
                style={styles.scrollList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {normalizedOptions.map((opt) => {
                  const isSelected = opt.value === selectedValue;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.optionRow, isSelected && styles.optionRowActive]}
                      onPress={() => {
                        onSelect(opt.value);
                        onClose();
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.optionLabel,
                            isSelected && styles.optionLabelActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                        {opt.subtext && (
                          <Text style={styles.optionSub}>{opt.subtext}</Text>
                        )}
                      </View>

                      {opt.badge && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{opt.badge}</Text>
                        </View>
                      )}

                      {isSelected && (
                        <View style={styles.checkPill}>
                          <Text style={styles.checkPillText}>✓ Selected</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheetCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '75%',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    overflow: 'hidden',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFBEB',
  },
  title: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  closeBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  closeBtnText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#6B7280',
  },
  scrollList: {
    padding: 8,
    backgroundColor: '#FFFFFF',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionRowActive: {
    backgroundColor: '#FEF9C3',
    borderColor: '#FDE68A',
  },
  optionLabel: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#374151',
  },
  optionLabelActive: {
    color: '#111827',
    fontFamily: FontFamily.bold,
  },
  optionSub: {
    fontSize: 10.5,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 1,
  },
  badge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: '#4B5563',
  },
  checkPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#F4C430',
  },
  checkPillText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
});
