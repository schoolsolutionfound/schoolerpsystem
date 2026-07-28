import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useInstitutionsQuery, useCreateAdminMutation } from '../../../features/developer/hooks/useDeveloperQueries';
import { CreateAdminSchema } from '../../../features/developer/validation/admin.schema';
import { AppInput } from '../../../features/shared/components/AppInput';
import { AppButton } from '../../../features/shared/components/AppButton';
import { Colors, BorderRadius } from '../../../constants/theme';

const TITLE_PRESETS = ['Principal', 'Vice Principal', 'HOD', 'Coordinator', 'Academic Dean', 'Custom'];

const COLLEGE_DEPARTMENTS = ['CSE', 'AIML', 'ECE', 'Civil', 'Mechanical'];
const COLLEGE_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const SCHOOL_DEPARTMENTS = ['Science', 'Commerce', 'Arts', 'General'];
const SCHOOL_YEARS = ['Grade 1-5', 'Grade 6-8', 'Grade 9-10', 'Grade 11-12'];

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

export default function CreateInstitutionAdminScreen() {
  const router = useRouter();
  const { data: institutions = [] } = useInstitutionsQuery();
  const createAdminMutation = useCreateAdminMutation();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedInstCode, setSelectedInstCode] = useState(institutions[0]?.institutionCode || '');
  const [selectedTitle, setSelectedTitle] = useState('HOD');
  const [customTitle, setCustomTitle] = useState('');

  const selectedInst = institutions.find(
    (i) => i.institutionCode.toLowerCase() === selectedInstCode.toLowerCase()
  );
  const isSchool = selectedInst?.institutionType === 'school';

  const availableDepts = isSchool ? SCHOOL_DEPARTMENTS : COLLEGE_DEPARTMENTS;
  const availableYears = isSchool ? SCHOOL_YEARS : COLLEGE_YEARS;

  const [selectedDepts, setSelectedDepts] = useState<string[]>([availableDepts[0]]);
  const [selectedYears, setSelectedYears] = useState<string[]>([availableYears[0]]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'Students:Read',
    'Teachers:Read',
  ]);

  const [errorMsg, setErrorMsg] = useState('');

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
      password: password || undefined,
      institutionCode: selectedInstCode || institutions[0]?.institutionCode || 'INST01',
      title: finalTitle,
      scope: {
        departments: selectedDepts,
        academicYears: selectedYears,
      },
      permissions: selectedPermissions,
    };

    const validation = CreateAdminSchema.safeParse(payload);
    if (!validation.success) {
      setErrorMsg(validation.error.issues[0]?.message || 'Please check all required fields.');
      return;
    }

    try {
      await createAdminMutation.mutateAsync(payload);
      Alert.alert('Success', `Admin "${fullName}" created successfully!`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create institution admin.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Institution Admin</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {Boolean(errorMsg) && (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color={Colors.light.danger} />
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
          </View>
        )}

        {/* Section 1: Basic Details */}
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
        <AppInput
          label="Initial Password"
          placeholder="Set temporary password"
          value={password}
          onChangeText={setPassword}
          iconName="lock-outline"
          secureTextEntry
        />

        {/* Section 2: Institution Selection */}
        <Text style={styles.sectionTitle}>Institution</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {institutions.map((inst) => (
            <TouchableOpacity
              key={inst.id}
              style={[
                styles.chip,
                selectedInstCode === inst.institutionCode && styles.activeChip,
              ]}
              onPress={() => setSelectedInstCode(inst.institutionCode)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedInstCode === inst.institutionCode && styles.activeChipText,
                ]}
              >
                {inst.institutionName} ({inst.institutionCode})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Section 3: Designation / Title */}
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

        {/* Section 4: Departments Scope */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Departments Scope</Text>
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

        {/* Section 5: Academic Years Scope */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Academic Years Scope</Text>
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

        {/* Section 6: Grouped Permissions */}
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
          title="Create Institution Admin"
          onPress={handleSubmit}
          loading={createAdminMutation.isPending}
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
  chipRow: {
    marginBottom: 16,
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
    backgroundColor: '#EDE7F6',
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
