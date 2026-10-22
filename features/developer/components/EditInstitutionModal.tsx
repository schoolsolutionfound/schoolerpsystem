import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
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
import {
  buildTerms,
  DEFAULT_INSTITUTION_TYPE,
  DEFAULT_STRUCTURE,
  normalizeInstitutionType,
  termCountFromPlan,
} from '../../shared/academicStructure';

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
    watch,
    formState: { errors },
  } = useForm<UpdateInstitutionFormValues>({
    resolver: zodResolver(UpdateInstitutionZodSchema),
    defaultValues: {
      institutionName: '',
      institutionType: DEFAULT_INSTITUTION_TYPE,
      subscriptionStatus: 'active',
    },
  });

  const institutionType = watch('institutionType');
  const isSchool = normalizeInstitutionType(institutionType) === 'school';

  const splitList = (value: string) =>
    value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const [unitsText, setUnitsText] = useState('');
  const [levelsText, setLevelsText] = useState('');
  const [programsText, setProgramsText] = useState('');
  const [sectionsText, setSectionsText] = useState('');
  const [termsCount, setTermsCount] = useState('3');

  useEffect(() => {
    if (institution) {
      reset({
        institutionName: institution.institutionName,
        institutionType: institution.institutionType,
        subscriptionStatus: institution.subscriptionStatus,
      });
      setUnitsText(
        Array.isArray(institution.departments) ? institution.departments.join(', ') : ''
      );
      setLevelsText(
        Array.isArray(institution.yearsOfStudy) && institution.yearsOfStudy.length > 0
          ? institution.yearsOfStudy.join(', ')
          : Array.isArray(institution.academicYears)
            ? institution.academicYears.join(', ')
            : ''
      );
      setProgramsText(
        Array.isArray(institution.courses) ? institution.courses.join(', ') : ''
      );
      setSectionsText(
        Array.isArray(institution.sections) ? institution.sections.join(', ') : ''
      );
      setTermsCount(String(termCountFromPlan(institution.terms, institution.institutionType)));
    }
  }, [institution, reset]);

  useEffect(() => {
    if (!institution) return;
    const original = normalizeInstitutionType(institution.institutionType);
    const next = normalizeInstitutionType(institutionType);
    if (next === original) return;
    const defaults = DEFAULT_STRUCTURE[next];
    setUnitsText(defaults.units.join(', '));
    setLevelsText(defaults.levels.join(', '));
    setProgramsText(defaults.programs.join(', '));
    setSectionsText(defaults.sections.join(', '));
    setTermsCount(String(defaults.terms[0]?.terms.length || (next === 'college' ? 2 : 3)));
  }, [institutionType, institution]);

  const handleFormSubmit = (data: UpdateInstitutionFormValues) => {
    if (institution) {
      const units = splitList(unitsText);
      const levels = splitList(levelsText);
      const programs = splitList(programsText);
      const sections = splitList(sectionsText);
      const kind = normalizeInstitutionType(data.institutionType);
      const typeChanged = kind !== normalizeInstitutionType(institution.institutionType);
      onSubmit(institution.id, {
        ...data,
        institutionType: kind,
        subjects: kind === 'school' ? units : [],
        classes: kind === 'school' ? levels : [],
        departments: kind === 'college' ? units : [],
        yearsOfStudy: kind === 'college' ? levels : [],
        programs: kind === 'college' ? programs : [],
        courses: kind === 'college' ? programs : [],
        sections,
        terms: (() => {
          const plan = buildTerms(termsCount, institution.terms?.[0]?.academicYear, kind);
          return [...(institution.terms || []).filter((t) => t.academicYear !== plan[0].academicYear), ...plan];
        })(),
        convert: typeChanged || undefined,
      });
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <AppModal visible={visible} onClose={handleClose} title="Edit Institution">
      <ScrollView contentContainerStyle={styles.form}>
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

        <View style={styles.textInputGroup}>
          <AppInput
            label={isSchool ? 'Subjects (comma-separated)' : 'Departments (comma-separated)'}
            placeholder={isSchool ? 'e.g. English, Mathematics, Science' : 'e.g. CSE, ECE, ME, Civil'}
            value={unitsText}
            onChangeText={setUnitsText}
            iconName="domain"
          />

          <AppInput
            label={isSchool ? 'Classes (comma-separated)' : 'Years of Study (comma-separated)'}
            placeholder={isSchool ? 'e.g. Class 1, Class 2, Class 3' : 'e.g. 1st Year, 2nd Year, 3rd Year'}
            value={levelsText}
            onChangeText={setLevelsText}
            iconName="calendar-range"
          />

          {!isSchool && (
            <AppInput
              label="Programs (comma-separated, optional)"
              placeholder="e.g. B.Tech, M.Tech, MBA"
              value={programsText}
              onChangeText={setProgramsText}
              iconName="book-open-variant"
            />
          )}

          <AppInput
            label="Sections (comma-separated)"
            placeholder="e.g. A, B, C"
            value={sectionsText}
            onChangeText={setSectionsText}
            iconName="view-grid-outline"
          />

          <AppInput
            label={isSchool ? 'Number of Terms (1–12)' : 'Number of Semesters (1–12)'}
            placeholder={isSchool ? 'e.g. 3' : 'e.g. 2'}
            value={termsCount}
            onChangeText={(value) => setTermsCount(value.replace(/[^0-9]/g, '').slice(0, 2))}
            keyboardType="number-pad"
            iconName="numeric"
          />
        </View>

        <AppButton
          title="Save Changes"
          onPress={handleSubmit(handleFormSubmit)}
          loading={loading}
          iconName="check"
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
  readOnlyBox: {
    backgroundColor: '#FFFDF7',
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
  textInputGroup: {
    gap: 12,
  },
  submitBtn: {
    marginTop: 8,
  },
});
