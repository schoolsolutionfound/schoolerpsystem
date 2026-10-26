import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Modal, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useUserStore } from '../store/useUserStore';
import { completeProfileApi, getMyProfileFieldsApi } from '../api/users';
import { uploadProfilePictureApi } from '../api/upload';
import { handleGlobalError, AppError } from '../utils/errorHandler';
import { getHomeRouteForRole } from '../features/shared/utils/routeGuards';
import { FontFamily } from '../constants/fonts';
import { BorderRadius } from '../constants/theme';
import { DynamicProfileFieldsForm } from '../features/shared/formFields/DynamicProfileFieldsForm';
import { validateDynamicFields, type CustomFieldValues } from '../features/shared/formFields/types';

export default function CompleteProfileScreen() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
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
        // First-login chain continues to email verification when pending.
        if (!state.isEmailVerified) {
          router.replace('/verify-email');
        } else {
          router.replace(getHomeRouteForRole(state.userRole) as any);
        }
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
                onPress={() => router.replace('/change-password')}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <MaterialCommunityIcons name="arrow-left" size={22} color="#F4C430" />
              </TouchableOpacity>
              <Text style={styles.topBarTitle}>Step 2 of 2</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.progressContainer}>
              <Text style={styles.stepText}>Complete Your Profile</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: '100%' }]} />
              </View>
            </View>

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
                theme="dark"
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
              style={[styles.saveBtn, loading && styles.saveBtnBusy]}
              activeOpacity={0.8}
              onPress={handleSaveProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#1A1B1C" />
              ) : (
                <Text style={styles.saveBtnText}>Complete Profile</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {syncing && (
        <View style={styles.syncOverlay}>
          <ActivityIndicator size="large" color="#F4C430" />
          <Text style={styles.syncText}>Syncing your profile...</Text>
        </View>
      )}
      <Modal visible={showWelcomeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.checkCircleBig}>
              <MaterialCommunityIcons name="check" size={40} color="#1A1B1C" />
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
  container: { flex: 1, backgroundColor: '#1A1B1C' },
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
    borderBottomColor: 'rgba(244,196,48,0.15)',
    backgroundColor: '#1A1B1C',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,196,48,0.10)',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: '#F4C430',
  },
  progressContainer: { gap: 8, marginBottom: 4, paddingHorizontal: 4 },
  stepText: { fontSize: 12, fontWeight: '700', fontFamily: FontFamily.bold, color: '#F4C430' },
  barTrack: { height: 5, backgroundColor: 'rgba(244,196,48,0.2)', borderRadius: 2.5, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#F4C430', borderRadius: 2.5 },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1F1F1F',
    borderRadius: BorderRadius.card,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(244,196,48,0.15)',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  headerText: { flex: 1 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1A1B1C',
    borderWidth: 2,
    borderColor: 'rgba(244,196,48,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  title: { fontSize: 22, fontWeight: '800', fontFamily: FontFamily.extrabold, color: '#F4C430' },
  subtitle: { fontSize: 13, color: '#9CA3AF', lineHeight: 19, marginTop: 2 },

  picCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#1F1F1F',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: 'rgba(244,196,48,0.12)',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  picWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1A1B1C',
    borderWidth: 2,
    borderColor: 'rgba(244,196,48,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  picImg: { width: '100%', height: '100%' },
  picInfo: { flex: 1, gap: 3 },
  picName: { fontSize: 16, fontWeight: '800', fontFamily: FontFamily.extrabold, color: '#E5E7EB' },
  picEmail: { fontSize: 12, color: '#9CA3AF', fontFamily: FontFamily.medium },
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
  picBtnText: { fontSize: 12, fontWeight: '800', fontFamily: FontFamily.bold, color: '#1A1B1C' },

  identityCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: 'rgba(244,196,48,0.12)',
    borderLeftWidth: 3,
    borderLeftColor: '#F4C430',
    padding: 16,
    gap: 4,
  },
  identityLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', fontFamily: FontFamily.semibold },
  identityValue: { fontSize: 14, color: '#E5E7EB', fontWeight: '700', fontFamily: FontFamily.bold },
  identityHint: { fontSize: 13, color: '#9CA3AF', fontFamily: FontFamily.medium, lineHeight: 18 },

  saveBtn: {
    backgroundColor: '#F4C430',
    borderRadius: BorderRadius.button,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#F4C430',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  saveBtnBusy: { opacity: 0.7 },
  saveBtnText: { fontSize: 15, fontWeight: '800', fontFamily: FontFamily.bold, color: '#1A1B1C' },

  syncOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(26,27,28,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 100, gap: 12 },
  syncText: { fontSize: 15, color: '#9CA3AF', fontWeight: '600', fontFamily: FontFamily.semibold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: BorderRadius.modal,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(244,196,48,0.2)',
    shadowColor: '#000000',
    shadowOpacity: 0.5,
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
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', fontFamily: FontFamily.extrabold, color: '#F4C430' },
  modalSub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
});
