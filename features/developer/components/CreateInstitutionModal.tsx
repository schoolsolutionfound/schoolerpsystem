import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppModal } from '../../shared/components/AppModal';
import { AppInput } from '../../shared/components/AppInput';
import { AppButton } from '../../shared/components/AppButton';
import { Colors } from '../../../constants/theme';
import {
  CreateInstitutionZodSchema,
  CreateInstitutionFormValues,
} from '../validation/developer.validation';

interface CreateInstitutionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: CreateInstitutionFormValues) => void;
  loading?: boolean;
}

export const CreateInstitutionModal: React.FC<CreateInstitutionModalProps> = ({
  visible,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateInstitutionFormValues>({
    resolver: zodResolver(CreateInstitutionZodSchema),
    defaultValues: {
      institutionCode: '',
      institutionName: '',
      institutionType: 'college',
      subscriptionStatus: 'active',
      departments: [],
      academicYears: [],
      courses: [],
    },
  });

  const institutionType = watch('institutionType');

  const [deptsText, setDeptsText] = useState('CSE, ECE, Civil, Mechanical, AIML');
  const [yearsText, setYearsText] = useState('1st Year, 2nd Year, 3rd Year, 4th Year');
  const [coursesText, setCoursesText] = useState('B.Tech, M.Tech');

  useEffect(() => {
    if (institutionType === 'school') {
      setDeptsText('Grade 1, Grade 2, Grade 3, Grade 4, Grade 5');
      setYearsText('A, B, C');
      setCoursesText('');
    } else {
      setDeptsText('CSE, ECE, Civil, Mechanical, AIML');
      setYearsText('1st Year, 2nd Year, 3rd Year, 4th Year');
      setCoursesText('B.Tech, M.Tech');
    }
  }, [institutionType]);

  const handleFormSubmit = (data: CreateInstitutionFormValues) => {
    const departments = deptsText.split(',').map((s) => s.trim()).filter(Boolean);
    const academicYears = yearsText.split(',').map((s) => s.trim()).filter(Boolean);
    const courses = coursesText.split(',').map((s) => s.trim()).filter(Boolean);
    onSubmit({ ...data, departments, academicYears, courses });
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <AppModal visible={visible} onClose={handleClose} title="Create Institution">
      <ScrollView contentContainerStyle={styles.form}>
        <Controller
          control={control}
          name="institutionCode"
          render={({ field: { onChange, value } }) => (
            <AppInput
              label="Institution Code *"
              placeholder="e.g. PACECLGENG01"
              value={value}
              onChangeText={onChange}
              autoCapitalize="characters"
              error={errors.institutionCode?.message}
              iconName="card-bulleted-outline"
            />
          )}
        />

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
                    <Text style={[styles.toggleText, value === status && styles.toggleTextActive]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
        </View>

        <View style={styles.textInputGroup}>
          <AppInput
            label={institutionType === 'college' ? 'Departments (comma-separated)' : 'Classes (comma-separated)'}
            placeholder={institutionType === 'college' ? 'e.g. CSE, ECE, ME, Civil' : 'e.g. Grade 1, Grade 2, Grade 3'}
            value={deptsText}
            onChangeText={setDeptsText}
            iconName="domain"
          />

          <AppInput
            label={institutionType === 'college' ? 'Academic Years (comma-separated)' : 'Sections (comma-separated)'}
            placeholder={institutionType === 'college' ? 'e.g. 1st Year, 2nd Year, 3rd Year' : 'e.g. A, B, C'}
            value={yearsText}
            onChangeText={setYearsText}
            iconName="calendar-range"
          />

          {institutionType === 'college' && (
            <AppInput
              label="Courses (comma-separated, optional)"
              placeholder="e.g. B.Tech, M.Tech, MBA"
              value={coursesText}
              onChangeText={setCoursesText}
              iconName="book-open-variant"
            />
          )}
        </View>

        <AppButton
          title="Create Institution"
          onPress={handleSubmit(handleFormSubmit)}
          loading={loading}
          iconName="plus"
          style={styles.submitBtn}
        />
      </ScrollView>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: 14,
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
  textInputGroup: {
    gap: 12,
  },
  submitBtn: {
    marginTop: 8,
  },
});
