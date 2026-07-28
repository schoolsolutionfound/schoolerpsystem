import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppModal } from '../../shared/components/AppModal';
import { AppButton } from '../../shared/components/AppButton';
import { Colors } from '../../../constants/theme';
import { Institution } from '../types/developer.types';

interface DeleteInstitutionModalProps {
  visible: boolean;
  institution: Institution | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  loading?: boolean;
}

export const DeleteInstitutionModal: React.FC<DeleteInstitutionModalProps> = ({
  visible,
  institution,
  onClose,
  onConfirm,
  loading = false,
}) => {
  if (!institution) return null;

  return (
    <AppModal visible={visible} onClose={onClose} title="Delete Institution">
      <View style={styles.content}>
        <View style={styles.warningCircle}>
          <MaterialCommunityIcons name="alert" size={32} color={Colors.light.danger} />
        </View>

        <Text style={styles.title}>Are you absolutely sure?</Text>
        <Text style={styles.description}>
          You are about to delete <Text style={styles.bold}>{institution.institutionName}</Text> (
          <Text style={styles.bold}>{institution.institutionCode}</Text>). This action cannot be
          undone.
        </Text>

        <View style={styles.actions}>
          <AppButton
            title="Cancel"
            onPress={onClose}
            variant="outline"
            style={styles.cancelBtn}
          />
          <AppButton
            title="Delete Institution"
            onPress={() => onConfirm(institution.id)}
            variant="danger"
            loading={loading}
            iconName="trash-can-outline"
            style={styles.deleteBtn}
          />
        </View>
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  warningCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.text,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: Colors.light.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
    color: Colors.light.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
  },
  deleteBtn: {
    flex: 1.4,
  },
});
