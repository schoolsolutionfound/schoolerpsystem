import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useAdminsQuery,
  useUpdateAdminMutation,
} from '../../../../features/developer/hooks/useDeveloperQueries';
import { InstitutionSearchSelect } from '../../../../features/developer/components/InstitutionSearchSelect';
import { Institution } from '../../../../features/developer/types/developer.types';
import { AppInput } from '../../../../features/shared/components/AppInput';
import { AppButton } from '../../../../features/shared/components/AppButton';
import { LoadingView } from '../../../../features/shared/components/LoadingView';
import { ErrorState } from '../../../../features/shared/components/ErrorState';
import {
  levelsForInstitution,
  normalizeInstitutionType,
  roleKeysForInstitutionType,
} from '../../../../features/shared/academicStructure';
import { Colors, BorderRadius } from '../../../../constants/theme';
import { safeGoBack } from '../../../../features/shared/utils/safeNavigation';

const TITLE_PRESETS = ['Principal', 'Vice Principal', 'HOD', 'Coordinator', 'Academic Dean', 'Custom'];

const PERMISSION_GROUPS = [
  {
    category: 'Student Management',
    permissions: ['Students:Read', 'Students:Create', 'Students:Update', 'Students:Delete'],
  },
  {
    category: 'Teacher Management',
    permissions: ['Teachers:Read', 'Teachers:Create', 'Teachers:Update'],
  },
  {
    category: 'Classroom & Academic',
    permissions: ['Attendance:Manage', 'Reports:View'],
  },
  {
    category: 'Institution Settings',
    permissions: ['Settings:Manage', 'Fees:Manage'],
  },
];

export default function EditInstitutionAdminScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: admins = [], isLoading: adminsLoading, isError: adminsError } = useAdminsQuery();
  const updateAdminMutation = useUpdateAdminMutation();

  const admin = useMemo(() => admins.find((a) => a.id === id), [admins, id]);

  const [fullName, setFullName] = useState(admin?.fullName || '');
  const [email, setEmail] = useState(admin?.email || '');
  const [selectedInstCode, setSelectedInstCode] = useState(admin?.institutionCode || '');
  const [selectedInstLabel, setSelectedInstLabel] = useState(
    admin ? `${admin.institutionName} (${admin.institutionCode})` : ''
  );
  const [selectedInstType, setSelectedInstType] = useState<'school' | 'college'>(
    normalizeInstitutionType(admin?.institutionType)
  );
  const [selectedTitle, setSelectedTitle] = useState(admin?.title || '');
  const [customTitle, setCustomTitle] = useState('');
  const [selectedRole, setSelectedRole] = useState(admin?.role || 'admin');

  const isSchool = normalizeInstitutionType(selectedInstType) === 'school';
  const availableRoles = roleKeysForInstitutionType(selectedInstType);

  // Options are the selected institution's own structure, seeded from the
  // admin's current scope so existing selections stay editable.
  const [instDepts, setInstDepts] = useState<string[]>(admin?.scope?.departments || []);
  const [instYears, setInstYears] = useState<string[]>(admin?.scope?.academicYears || []);

  const handleSelectInstitution = (inst: Institution | null) => {
    if (!inst) return;
    setSelectedInstCode(inst.institutionCode);
    setSelectedInstLabel(`${inst.institutionName} (${inst.institutionCode})`);
    setSelectedInstType(normalizeInstitutionType(inst.institutionType));
    const depts = Array.isArray(inst.departments) ? inst.departments : [];
    const years = levelsForInstitution(inst);
    setInstDepts(depts);
    setInstYears(years);
    setSelectedDepts(depts.length > 0 ? [depts[0]] : []);
    setSelectedYears(years.length > 0 ? [years[0]] : []);
    setSelectedRole((prev) =>
      roleKeysForInstitutionType(inst.institutionType).includes(prev) ? prev : 'admin'
    );
  };

  const availableDepts = instDepts;
  const availableYears = instYears;

  const [selectedDepts, setSelectedDepts] = useState<string[]>(admin?.scope?.departments || []);
  const [selectedYears, setSelectedYears] = useState<string[]>(admin?.scope?.academicYears || []);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    admin?.permissions || ['Students:Read', 'Teachers:Read']
  );

  const [errorMsg, setErrorMsg] = useState('');

  React.useEffect(() => {
    if (admin) {
      // Sync form state from fetched admin record.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFullName(admin.fullName);
      setEmail(admin.email);
      setSelectedInstCode(admin.institutionCode);
      setSelectedInstLabel(`${admin.institutionName} (${admin.institutionCode})`);
      setSelectedInstType(normalizeInstitutionType(admin.institutionType));
      setSelectedTitle(admin.title || '');
      setSelectedRole(admin.role || 'admin');
      setInstDepts(admin.scope?.departments || []);
      setInstYears(admin.scope?.academicYears || []);
      setSelectedDepts(admin.scope?.departments || []);
      setSelectedYears(admin.scope?.academicYears || []);
      setSelectedPermissions(admin.permissions || []);
    }
  }, [admin]);

  const toggleDept = (dept: string) => {
    setSelectedDepts((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  const toggleYear = (yr: string) => {
    setSelectedYears((prev) =>
      prev.includes(yr) ? prev.filter((y) => y !== yr) : [...prev, yr]
    );
  };

  const togglePermission = (perm: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    const finalTitle = selectedTitle === 'Custom' ? customTitle || 'Institution Admin' : selectedTitle;

    const payload = {
      fullName: fullName.trim(),
      email: email.trim(),
      role: selectedRole,
      institutionCode: selectedInstCode || admin?.institutionCode || '',
      title: finalTitle,
      scope: {
        departments: selectedDepts,
        academicYears: selectedYears,
      },
      permissions: selectedPermissions,
    };

    if (!payload.fullName || !payload.email) {
      setErrorMsg('Full name and email are required.');
      return;
    }

    try {
      await updateAdminMutation.mutateAsync({ id: id!, payload });
      Alert.alert('Success', `Admin "${fullName}" updated successfully!`, [
        { text: 'OK', onPress: () => safeGoBack(navigation, '/(developer)/home') },
      ]);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update institution admin.');
    }
  };

  if (adminsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingView message="Loading admin details..." />
      </SafeAreaView>
    );
  }

  if (adminsError || !admin) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          title="Admin Not Found"
          message="Could not load admin details. The admin may have been removed."
          onRetry={() => safeGoBack(navigation, '/(developer)/home')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => safeGoBack(navigation, '/(developer)/home')}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Institution Admin</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {Boolean(errorMsg) && (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color={Colors.light.danger} />
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Basic Details</Text>
        <AppInput
          label="Full Name *"
          placeholder="e.g. John Smith"
          value={fullName}
          onChangeText={setFullName}
          iconName="account-outline"
        />
        <AppInput
          label="Email Address *"
          placeholder="e.g. john.smith@institution.edu"
          value={email}
          onChangeText={setEmail}
          iconName="email-outline"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.sectionTitle}>Institution</Text>
        <InstitutionSearchSelect
          value={selectedInstCode}
          valueLabel={selectedInstLabel}
          onChange={handleSelectInstitution}
          placeholder="Search institutions by name or code…"
        />

        <Text style={styles.sectionTitle}>Role</Text>
        <View style={styles.chipRowWrap}>
          {availableRoles.map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.chip, selectedRole === role && styles.activeChip]}
              onPress={() => setSelectedRole(role)}
            >
              <Text style={[styles.chipText, selectedRole === role && styles.activeChipText]}>
                {role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Designation / Title</Text>
        <View style={styles.chipRowWrap}>
          {TITLE_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset}
              style={[styles.chip, selectedTitle === preset && styles.activeChip]}
              onPress={() => setSelectedTitle(preset)}
            >
              <Text style={[styles.chipText, selectedTitle === preset && styles.activeChipText]}>
                {preset}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {selectedTitle === 'Custom' && (
          <AppInput
            placeholder="Enter custom title e.g. Dean of Academics"
            value={customTitle}
            onChangeText={setCustomTitle}
            style={styles.customTitleInput}
          />
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{isSchool ? 'Subjects Scope' : 'Departments Scope'}</Text>
          <Text style={styles.countBadge}>{selectedDepts.length} selected</Text>
        </View>
        <View style={styles.chipRowWrap}>
          {availableDepts.map((dept) => {
            const isSelected = selectedDepts.includes(dept);
            return (
              <TouchableOpacity
                key={dept}
                style={[styles.chip, isSelected && styles.activeChip]}
                onPress={() => toggleDept(dept)}
              >
                <Text style={[styles.chipText, isSelected && styles.activeChipText]}>{dept}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{isSchool ? 'Classes Scope' : 'Academic Years Scope'}</Text>
          <Text style={styles.countBadge}>{selectedYears.length} selected</Text>
        </View>
        <View style={styles.chipRowWrap}>
          {availableYears.map((yr) => {
            const isSelected = selectedYears.includes(yr);
            return (
              <TouchableOpacity
                key={yr}
                style={[styles.chip, isSelected && styles.activeChip]}
                onPress={() => toggleYear(yr)}
              >
                <Text style={[styles.chipText, isSelected && styles.activeChipText]}>{yr}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Permissions</Text>
          <Text style={styles.countBadge}>{selectedPermissions.length} selected</Text>
        </View>

        {PERMISSION_GROUPS.map((group) => (
          <View key={group.category} style={styles.permGroupCard}>
            <Text style={styles.permGroupCategory}>{group.category}</Text>
            <View style={styles.chipRowWrap}>
              {group.permissions.map((perm) => {
                const isSelected = selectedPermissions.includes(perm);
                return (
                  <TouchableOpacity
                    key={perm}
                    style={[styles.permChip, isSelected && styles.activePermChip]}
                    onPress={() => togglePermission(perm)}
                  >
                    <MaterialCommunityIcons
                      name={isSelected ? 'checkbox-marked-circle' : 'circle-outline'}
                      size={16}
                      color={isSelected ? Colors.light.primary : Colors.light.muted}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.permChipText, isSelected && styles.activePermChipText]}>
                      {perm.split(':')[1] || perm}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <AppButton
          title="Save Changes"
          onPress={handleSubmit}
          loading={updateAdminMutation.isPending}
          style={styles.submitButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 6,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  scrollContent: {
    padding: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: BorderRadius.card,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 12,
    color: Colors.light.danger,
    marginLeft: 6,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 12,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  countBadge: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  chipRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.chip,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginRight: 8,
  },
  activeChip: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  chipText: {
    fontSize: 12,
    color: Colors.light.icon,
    fontWeight: '600',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  customTitleInput: {
    marginTop: -8,
    marginBottom: 16,
  },
  permGroupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  permGroupCategory: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  permChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.chip,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  activePermChip: {
    backgroundColor: '#FFF4C7',
    borderColor: Colors.light.primary,
  },
  permChipText: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  activePermChipText: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 16,
    marginBottom: 32,
  },
});
