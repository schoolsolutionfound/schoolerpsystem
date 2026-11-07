import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily, FontSize } from '../../../../constants/fonts';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}) => {
  const accent = danger ? '#DC2626' : '#F4C430';
  const accentSoft = danger ? '#FEE2E2' : '#FDF3CF';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          style={styles.card}
          onPress={() => {}}
          accessibilityRole="dialog"
          accessibilityLabel={title}
        >
          <View style={[styles.iconCircle, { backgroundColor: accentSoft }]}>
            <MaterialCommunityIcons
              name={danger ? 'logout' : 'check-circle-outline'}
              size={26}
              color={accent}
            />
          </View>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.btn, styles.cancelBtn, pressed && styles.pressed]}
              onPress={onCancel}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.btn, { backgroundColor: accent }, pressed && styles.pressed]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#111827',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: FontSize.cardTitle,
    fontWeight: '800',
    fontFamily: FontFamily.extrabold,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6,
  },
  message: {
    fontSize: FontSize.sub,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 18,
  },
  actions: {
    alignSelf: 'stretch',
    gap: 10,
  },
  btn: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  cancelBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  cancelText: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.bold,
    color: '#374151',
  },
  confirmText: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.85,
  },
});
