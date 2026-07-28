import React, { useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppModal } from '../../shared/components/AppModal';
import { AppInput } from '../../shared/components/AppInput';
import { AppButton } from '../../shared/components/AppButton';
import { Colors } from '../../../constants/theme';
import { Institution } from '../types/developer.types';
import {
  UpdateInstitutionZodSchema,
  UpdateInstitutionFormValues,
} from '../validation/developer.validation';

interface EditInstitutionModalProps {
  visible: boolean;
  institution: Institution | null;
  onClose: () => void;
  onSubmit: (id: string, values: UpdateInstitutionFormValues) => void;
  loading?: boolean;
}

export const EditInstitutionModal: React.FC<EditInstitutionModalProps> = ({
  visible,
  institution,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateInstitutionFormValues>({
    resolver: zodResolver(UpdateInstitutionZodSchema),
    defaultValues: {
      institutionName: '',
      institutionType: 'college',
      subscriptionStatus: 'active',
    },
  });

  useEffect(() => {
    if (institution) {
      reset({
        institutionName: institution.institutionName,
        institutionType: institution.institutionType,
        subscriptionStatus: institution.subscriptionStatus,
      });
    }
  }, [institution]);

  const handleFormSubmit = (data: UpdateInstitutionFormValues) => {
    if (institution) {
      onSubmit(institution.id, data);
    }
  };

  return (
    <AppModal visible={visible} onClose={onClose} title="Edit Institution">
      <View style={styles.form}>
        <View style={styles.readOnlyBox}>
          <Text style={styles.readOnlyLabel}>Institution Code (Immutable)</Text>
          <Text style={styles.readOnlyCode}>{institution?.institutionCode || 'N/A'}</Text>
        </View>

        <Controller
          control={control}
          name="institutionName"
          render={({ field: { onChange, value } }) => (
            <AppInput
              label="Institution Name *"
              placeholder="e.g. PACE Engineering College"
              value={value}
              onChangeText={onChange}
              error={errors.institutionName?.message}
              iconName="office-building"
            />
          )}
        />

        <View style={styles.selectorGroup}>
          <Text style={styles.selectorLabel}>Institution Type</Text>
          <Controller
            control={control}
            name="institutionType"
            render={({ field: { onChange, value } }) => (
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, value === 'college' && styles.toggleBtnActive]}
                  onPress={() => onChange('college')}
                >
                  <Text style={[styles.toggleText, value === 'college' && styles.toggleTextActive]}>
                    College
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toggleBtn, value === 'school' && styles.toggleBtnActive]}
                  onPress={() => onChange('school')}
                >
                  <Text style={[styles.toggleText, value === 'school' && styles.toggleTextActive]}>
                    School
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>

        <View style={styles.selectorGroup}>
          <Text style={styles.selectorLabel}>Subscription Status</Text>
          <Controller
            control={control}
            name="subscriptionStatus"
            render={({ field: { onChange, value } }) => (
              <View style={styles.toggleRow}>
                {(['active', 'trial', 'inactive', 'suspended'] as const).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.toggleBtn, value === status && styles.toggleBtnActive]}
                    onPress={() => onChange(status)}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        value === status && styles.toggleTextActive,
                      ]}
                    >
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
        </View>

        <AppButton
          title="Save Changes"
          onPress={handleSubmit(handleFormSubmit)}
          loading={loading}
          iconName="check"
          style={styles.submitBtn}
        />
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: 14,
  },
  readOnlyBox: {
    backgroundColor: '#F8F9FB',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 12,
    gap: 2,
  },
  readOnlyLabel: {
    fontSize: 11,
    color: Colors.light.muted,
    fontWeight: '600',
  },
  readOnlyCode: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.light.primary,
  },
  selectorGroup: {
    gap: 6,
  },
  selectorLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  toggleBtn: {
    flex: 1,
    minWidth: 80,
    height: 38,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
  },
  toggleBtnActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.muted,
    textTransform: 'capitalize',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    marginTop: 8,
  },
});
