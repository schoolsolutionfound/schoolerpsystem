import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Modal, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useUserStore } from '../store/useUserStore';
import { completeProfileApi, getMyProfileFieldsApi } from '../api/users';
import { uploadProfilePictureApi } from '../api/upload';
import { handleGlobalError, AppError } from '../utils/errorHandler';
import { getHomeRouteForRole } from '../features/shared/utils/routeGuards';
import { FontFamily, FontSize } from '../constants/fonts';
import { DynamicProfileFieldsForm } from '../features/shared/formFields/DynamicProfileFieldsForm';
import { validateDynamicFields, type CustomFieldValues } from '../features/shared/formFields/types';
import { ShimmerProvider, ShimmerSkeleton } from '../features/student/components/ShimmerSkeleton';

const ProfileSetupSkeleton: React.FC = () => (
  <ShimmerProvider>
    <View style={styles.profileSkeleton}>
      <View style={styles.headerSkeletonCard}>
        <ShimmerSkeleton width={56} height={56} borderRadius={28} />
        <View style={styles.headerSkeletonText}>
          <ShimmerSkeleton width="62%" height={15} borderRadius={4} />
          <ShimmerSkeleton width="88%" height={11} borderRadius={4} />
        </View>
      </View>

      <View style={styles.picSkeletonCard}>
        <ShimmerSkeleton width={72} height={72} borderRadius={36} />
        <View style={styles.picSkeletonInfo}>
          <ShimmerSkeleton width="55%" height={14} borderRadius={4} />
          <ShimmerSkeleton width="72%" height={10} borderRadius={4} />
          <ShimmerSkeleton width={96} height={28} borderRadius={14} />
        </View>
      </View>

      <View style={styles.formSkeletonCard}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.fieldSkeleton}>
            <ShimmerSkeleton width={i === 0 ? 88 : 110} height={10} borderRadius={4} />
            <ShimmerSkeleton width="100%" height={48} borderRadius={12} />
          </View>
        ))}
      </View>

      <ShimmerSkeleton width="100%" height={52} borderRadius={14} />
    </View>
  </ShimmerProvider>
);


export default function CompleteProfileScreen() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(() => {
    const state = useUserStore.getState();
    return !(state.isProfileSynced && state.userRole !== 'loading');
  });
  const syncResolved = useRef(false);

  const fullName = useUserStore((state) => state.fullName) || '';
  const email = useUserStore((state) => state.email) || '';
  const profilePic = useUserStore((state) => state.profilePic) || '';
  const rollNoOrUSN = useUserStore((state) => state.rollNoOrUSN) || '';
  const institutionType = useUserStore((state) => state.institutionType) || 'school';
  const profileFields = useUserStore((state) => state.profileFields) || [];
  const savedCustomFields = useUserStore((state) => state.customFields);

  // Wait for profile sync before allowing redirect
  useEffect(() => {
    if (syncResolved.current) return;
    if (useUserStore.getState().isProfileSynced && useUserStore.getState().userRole !== 'loading') {
      syncResolved.current = true;
      return;
    }
    // Standard store-subscription pattern; setSyncing is paired with an unsubscribe cleanup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // Login sync normally fills profileFields; fall back to a direct fetch.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (useUserStore.getState().profileFields.length > 0) return;
      try {
        const fields = await getMyProfileFieldsApi();
        if (!cancelled && Array.isArray(fields) && fields.length > 0) {
          useUserStore.getState().setUserProfile({ profileFields: fields });
        }
      } catch { /* keep whatever the sync gave us */ }
    })();
    return () => { cancelled = true; };
  }, [profileFields.length]);

  const [values, setValues] = useState<CustomFieldValues>(savedCustomFields);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues((prev) => ({ ...savedCustomFields, ...prev }));
  }, [savedCustomFields]);

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
    const validationError = validateDynamicFields(profileFields, values);
    if (validationError) {
      Alert.alert('Check the form', validationError);
      return;
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

      await completeProfileApi({
        profilePicUrl: uploadedPicUrl || undefined,
        institutionType,
        customFields: values,
      } as any);

      useUserStore.getState().setUserProfile({
        profilePic: uploadedPicUrl || useUserStore.getState().profilePic,
        profileCompleted: true,
        customFields: values,
      });

      setShowWelcomeModal(true);
      setTimeout(() => {
        setShowWelcomeModal(false);
        const state = useUserStore.getState();
        router.replace(getHomeRouteForRole(state.userRole) as any);
      }, 1000);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showDynamicForm = profileFields.length > 0;
  const hasAnyInput = showDynamicForm;
  const avatarSource = profilePicUri || profilePic;

return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.topBar}>
<TouchableOpacity
              style={styles.backBtn}
              activeOpacity={0.7}
              onPress={() => router.back()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color="#F4C430" />
            </TouchableOpacity>
              <Text style={styles.topBarTitle}>Step 3 of 3</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.progressContainer}>
              <Text style={styles.stepText}>Complete Your Profile</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: '100%' }]} />
              </View>
            </View>

            {(syncing || loading) ? (
              <ProfileSetupSkeleton />
            ) : (
              <>
            <View style={styles.headerCard}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="account-check-outline" size={30} color="#F4C430" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>Complete Your Profile</Text>
                <Text style={styles.subtitle}>Fill in the remaining details to activate your account.</Text>
              </View>
            </View>

            <View style={styles.picCard}>
              <View style={styles.picWrap}>
                {avatarSource ? (
                  <Image source={{ uri: avatarSource }} style={styles.picImg} resizeMode="cover" />
                ) : (
                  <MaterialCommunityIcons name="account" size={44} color="#F4C430" />
                )}
              </View>
              <View style={styles.picInfo}>
                <Text style={styles.picName} numberOfLines={1}>{fullName || 'Your name'}</Text>
                <Text style={styles.picEmail} numberOfLines={1}>{email}</Text>
                <TouchableOpacity style={styles.picBtn} activeOpacity={0.75} onPress={pickImage}>
                  <MaterialCommunityIcons name="camera-outline" size={14} color="#1A1B1C" />
                  <Text style={styles.picBtnText}>{profilePicUri ? 'Change Photo' : 'Add Photo'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {!!rollNoOrUSN && (
              <View style={styles.identityCard}>
                <Text style={styles.identityLabel}>Roll No / USN</Text>
                <Text style={styles.identityValue}>{rollNoOrUSN}</Text>
              </View>
            )}

            {showDynamicForm ? (
              <DynamicProfileFieldsForm
                fields={profileFields}
                values={values}
                onChange={(fieldId, v) => setValues((prev) => ({ ...prev, [fieldId]: v }))}
                theme="light"
              />
            ) : (
              !hasAnyInput && !syncing && (
                <View style={styles.identityCard}>
                  <Text style={styles.identityHint}>
                    No extra details are needed right now. Tap Complete Profile to finish.
                  </Text>
                </View>
              )
            )}

            <TouchableOpacity
              style={styles.saveBtn}
              activeOpacity={0.8}
              onPress={handleSaveProfile}
            >
              <Text style={styles.saveBtnText}>Complete Profile</Text>
            </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

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
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingVertical: 14, gap: 20, paddingBottom: 40 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  topBarTitle: {
    fontSize: FontSize.screenTitle,
    fontWeight: '800',
    fontFamily: FontFamily.extrabold,
    color: '#111827',
  },
  progressContainer: { gap: 8, marginBottom: 4, paddingHorizontal: 4 },
  stepText: { fontSize: FontSize.caption, fontWeight: '700', fontFamily: FontFamily.bold, color: '#F4C430' },
  barTrack: { height: 5, backgroundColor: '#FDE68A', borderRadius: 2.5, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#F4C430', borderRadius: 2.5 },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  headerText: { flex: 1 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  title: { fontSize: FontSize.cardTitle, fontWeight: '800', fontFamily: FontFamily.extrabold, color: '#111827' },
  subtitle: { fontSize: FontSize.sub, color: '#6B7280', lineHeight: 19, marginTop: 2, fontFamily: FontFamily.regular },

  picCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  picWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  picImg: { width: '100%', height: '100%' },
  picInfo: { flex: 1, gap: 3 },
  picName: { fontSize: FontSize.cardTitle, fontWeight: '800', fontFamily: FontFamily.extrabold, color: '#111827' },
  picEmail: { fontSize: FontSize.sub, color: '#6B7280', fontFamily: FontFamily.regular },
  picBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F4C430',
  },
  picBtnText: { fontSize: FontSize.caption, fontWeight: '800', fontFamily: FontFamily.bold, color: '#1A1B1C' },

  identityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderLeftWidth: 3,
    borderLeftColor: '#F4C430',
    padding: 16,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  identityLabel: { fontSize: FontSize.caption, color: '#9CA3AF', fontWeight: '600', fontFamily: FontFamily.semibold },
  identityValue: { fontSize: FontSize.body, color: '#111827', fontWeight: '700', fontFamily: FontFamily.bold },
  identityHint: { fontSize: FontSize.sub, color: '#9CA3AF', fontFamily: FontFamily.regular, lineHeight: 18 },

  saveBtn: {
    backgroundColor: '#F4C430',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#F4C430',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  saveBtnText: { fontSize: FontSize.body, fontWeight: '800', fontFamily: FontFamily.bold, color: '#1A1B1C' },

  profileSkeleton: { gap: 20 },
  headerSkeletonCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  headerSkeletonText: { flex: 1, gap: 8, paddingTop: 6 },
  picSkeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  picSkeletonInfo: { flex: 1, gap: 8 },
  formSkeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 16,
    gap: 16,
  },
  fieldSkeleton: { gap: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    gap: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  checkCircleBig: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F4C430',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  modalTitle: { fontSize: FontSize.headerTitle, fontWeight: '800', fontFamily: FontFamily.extrabold, color: '#111827' },
  modalSub: { fontSize: FontSize.sub, color: '#6B7280', textAlign: 'center', lineHeight: 20, fontFamily: FontFamily.regular },
});
