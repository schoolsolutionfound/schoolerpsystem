import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Modal, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useUserStore } from '../store/useUserStore';
import { completeProfileApi } from '../api/users';
import { uploadProfilePictureApi } from '../api/upload';
import { BorderRadius } from '../constants/theme';
import { handleGlobalError, AppError } from '../utils/errorHandler';
import { getHomeRouteForRole } from '../features/shared/utils/routeGuards';
import { CompleteProfileForm } from '../features/student/components/CompleteProfileForm';
import { AdminCompleteProfileForm } from '../features/admin/components/AdminCompleteProfileForm';
import { TeacherCompleteProfileForm } from '../features/teacher/components/TeacherCompleteProfileForm';
import { PrincipalCompleteProfileForm } from '../features/principal/components/PrincipalCompleteProfileForm';
import { ParentCompleteProfileForm } from '../features/parent/components/ParentCompleteProfileForm';
import { AccountantCompleteProfileForm } from '../features/accountant/components/AccountantCompleteProfileForm';
import { HODCompleteProfileForm } from '../features/hod/components/HODCompleteProfileForm';
import { LibrarianCompleteProfileForm } from '../features/librarian/components/LibrarianCompleteProfileForm';

export default function CompleteProfileScreen() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const syncResolved = useRef(false);

  const fullName = useUserStore((state) => state.fullName) || '';
  const email = useUserStore((state) => state.email) || '';
  const userRole = useUserStore((state) => state.userRole) || 'student';
  const rollNoOrUSN = useUserStore((state) => state.rollNoOrUSN) || '';
  const institutionType = useUserStore((state) => state.institutionType) || 'college';

  const isStudent = userRole === 'student';

  // Wait for profile sync before allowing redirect
  useEffect(() => {
    if (syncResolved.current) return;
    if (useUserStore.getState().isProfileSynced && useUserStore.getState().userRole !== 'loading') {
      syncResolved.current = true;
      return;
    }
    setSyncing(true);
    const unsub = useUserStore.subscribe((state) => {
      if (state.isProfileSynced && state.userRole !== 'loading') {
        syncResolved.current = true;
        setSyncing(false);
      }
    });
    const timeout = setTimeout(() => {
      unsub();
      syncResolved.current = true;
      setSyncing(false);
    }, 15000);
    return () => { unsub(); clearTimeout(timeout); };
  }, []);

  const nameParts = fullName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [tenthPercentage, setTenthPercentage] = useState('');
  const [twelfthPercentage, setTwelfthPercentage] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [linkedStudentUSN, setLinkedStudentUSN] = useState('');
  const [relation, setRelation] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');
  const [libraryBadgeId, setLibraryBadgeId] = useState('');
  const [designation, setDesignation] = useState('');

  const [profilePicUri, setProfilePicUri] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        handleGlobalError(new AppError('Permission to access camera roll is required!'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfilePicUri(result.assets[0].uri);
      }
    } catch (err: any) {
      handleGlobalError(err, 'Failed to select profile image.');
    }
  };

  const handleSaveProfile = async () => {
    if (isStudent) {
      if (!parentPhone.trim() || parentPhone.trim().length < 10) {
        handleGlobalError(new AppError('Please enter a valid 10-digit Parent/Guardian phone number.', 'INVALID_PARENT_PHONE', 400));
        return;
      }

      if (institutionType === 'college') {
        if (tenthPercentage && (isNaN(Number(tenthPercentage)) || Number(tenthPercentage) < 0 || Number(tenthPercentage) > 100)) {
          handleGlobalError(new AppError('10th percentage must be a valid number between 0 and 100.', 'INVALID_PERCENTAGE', 400));
          return;
        }
        if (twelfthPercentage && (isNaN(Number(twelfthPercentage)) || Number(twelfthPercentage) < 0 || Number(twelfthPercentage) > 100)) {
          handleGlobalError(new AppError('12th percentage must be a valid number between 0 and 100.', 'INVALID_PERCENTAGE', 400));
          return;
        }
      }
    }

    setLoading(true);

    try {
      let uploadedPicUrl = '';
      if (profilePicUri) {
        try {
          uploadedPicUrl = await uploadProfilePictureApi(profilePicUri);
        } catch {
          uploadedPicUrl = profilePicUri;
        }
      }

      const payload: any = {
        profilePicUrl: uploadedPicUrl || undefined,
        institutionType,
      };

      payload.phone = phone.trim() || undefined;
      if (isStudent) {
        payload.parentPhone = parentPhone.trim();
        payload.tenthPercentage = tenthPercentage.trim() || undefined;
        payload.twelfthPercentage = twelfthPercentage.trim() || undefined;
      } else {
        payload.employeeId = employeeId.trim() || undefined;
        payload.department = department.trim() || undefined;
        payload.linkedStudentUSN = linkedStudentUSN.trim() || undefined;
        payload.relation = relation.trim() || undefined;
        payload.qualification = qualification.trim() || undefined;
        payload.experience = experience.trim() || undefined;
        payload.libraryBadgeId = libraryBadgeId.trim() || undefined;
        payload.designation = designation.trim() || undefined;
      }

      await completeProfileApi(payload);

      const profileUpdate: any = {
        profilePic: uploadedPicUrl,
        profileCompleted: true,
      };

      profileUpdate.phone = phone.trim();
      if (isStudent) {
        profileUpdate.parentPhone = parentPhone.trim();
        profileUpdate.tenthPercentage = tenthPercentage.trim();
        profileUpdate.twelfthPercentage = twelfthPercentage.trim();
      } else {
        profileUpdate.employeeId = employeeId.trim();
        profileUpdate.department = department.trim();
        profileUpdate.linkedStudentUSN = linkedStudentUSN.trim();
        profileUpdate.relation = relation.trim();
        profileUpdate.qualification = qualification.trim();
        profileUpdate.experience = experience.trim();
        profileUpdate.libraryBadgeId = libraryBadgeId.trim();
        profileUpdate.designation = designation.trim();
      }

      useUserStore.getState().setUserProfile(profileUpdate);

      setShowWelcomeModal(true);
      setTimeout(() => {
        setShowWelcomeModal(false);
        router.replace(getHomeRouteForRole(useUserStore.getState().userRole) as any);
      }, 1000);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    if (isStudent) {
      return (
        <CompleteProfileForm
          firstName={firstName}
          lastName={lastName}
          email={email}
          rollNoOrUSN={rollNoOrUSN}
          institutionType={institutionType}
          phone={phone}
          setPhone={setPhone}
          parentPhone={parentPhone}
          setParentPhone={setParentPhone}
          tenthPercentage={tenthPercentage}
          setTenthPercentage={setTenthPercentage}
          twelfthPercentage={twelfthPercentage}
          setTwelfthPercentage={setTwelfthPercentage}
          profilePicUri={profilePicUri}
          onPickImage={pickImage}
          loading={loading}
          onSubmit={handleSaveProfile}
        />
      );
    }

    const formProps = {
      fullName, email, phone, setPhone: setPhone as (val: string) => void,
      profilePicUri, onPickImage: pickImage, loading, onSubmit: handleSaveProfile,
    };

    switch (userRole) {
      case 'teacher':
        return <TeacherCompleteProfileForm {...formProps} employeeId={employeeId} setEmployeeId={setEmployeeId} department={department} setDepartment={setDepartment} />;
      case 'admin':
      case 'institution admin':
        return <AdminCompleteProfileForm {...formProps} designation={designation} setDesignation={setDesignation} />;
      case 'principal':
        return <PrincipalCompleteProfileForm {...formProps} qualification={qualification} setQualification={setQualification} experience={experience} setExperience={setExperience} />;
      case 'parent':
        return <ParentCompleteProfileForm {...formProps} linkedStudentUSN={linkedStudentUSN} setLinkedStudentUSN={setLinkedStudentUSN} relation={relation} setRelation={setRelation} />;
      case 'accountant':
        return <AccountantCompleteProfileForm {...formProps} employeeId={employeeId} setEmployeeId={setEmployeeId} qualification={qualification} setQualification={setQualification} />;
      case 'hod':
        return <HODCompleteProfileForm {...formProps} department={department} setDepartment={setDepartment} employeeId={employeeId} setEmployeeId={setEmployeeId} />;
      case 'librarian':
        return <LibrarianCompleteProfileForm {...formProps} employeeId={employeeId} setEmployeeId={setEmployeeId} libraryBadgeId={libraryBadgeId} setLibraryBadgeId={setLibraryBadgeId} />;
      default:
        return <AdminCompleteProfileForm {...formProps} designation={designation} setDesignation={setDesignation} />;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.progressContainer}>
              <Text style={styles.stepText}>Step 2 of 2</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: '100%' }]} />
              </View>
            </View>

            <View style={styles.header}>
              <Text style={styles.title}>Complete Your Profile</Text>
              <Text style={styles.subtitle}>Please fill in the remaining details to activate your account.</Text>
            </View>

            {renderForm()}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {syncing && (
        <View style={styles.syncOverlay}>
          <ActivityIndicator size="large" color="#7E57C2" />
          <Text style={styles.syncText}>Syncing your profile...</Text>
        </View>
      )}
      <Modal visible={showWelcomeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.checkCircleBig}>
              <MaterialCommunityIcons name="check" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.modalTitle}>Profile Completed!</Text>
            <Text style={styles.modalSub}>Welcome aboard! Redirecting to your dashboard...</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingVertical: 14, gap: 14 },
  progressContainer: { gap: 4, marginBottom: 4 },
  stepText: { fontSize: 12, fontWeight: '700', color: '#7E57C2' },
  barTrack: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#7E57C2', borderRadius: 3 },
  header: { gap: 4, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#1A202C' },
  subtitle: { fontSize: 13, color: '#718096' },
  syncOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 100, gap: 12 },
  syncText: { fontSize: 15, color: '#718096', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.modal, padding: 24, alignItems: 'center', width: '100%', gap: 12 },
  checkCircleBig: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  modalSub: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 18 },
});
