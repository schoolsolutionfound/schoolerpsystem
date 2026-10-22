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
  const institutionType = useUserStore((state) => state.institutionType) || 'college';
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
            <TouchableOpacity
              style={styles.topRow}
              activeOpacity={0.7}
              onPress={() => router.replace('/change-password')}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color="#171717" />
              <Text style={styles.topRowText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.progressContainer}>
              <Text style={styles.stepText}>Step 2 of 2</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: '100%' }]} />
              </View>
            </View>

            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="account-check-outline" size={30} color="#1A1B1C" />
              </View>
              <Text style={styles.title}>Complete Your Profile</Text>
              <Text style={styles.subtitle}>Fill in the remaining details to activate your account.</Text>
            </View>

            <View style={styles.picCard}>
              <View style={styles.picWrap}>
                {avatarSource ? (
                  <Image source={{ uri: avatarSource }} style={styles.picImg} resizeMode="cover" />
                ) : (
                  <MaterialCommunityIcons name="account" size={44} color="#1A1B1C" />
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
  container: { flex: 1, backgroundColor: '#FFFDF7' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingVertical: 14, gap: 14, paddingBottom: 40 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 8, minHeight: 40 },
  topRowText: { fontSize: 14, fontWeight: '700', fontFamily: FontFamily.bold, color: '#171717' },
  progressContainer: { gap: 4, marginBottom: 4 },
  stepText: { fontSize: 12, fontWeight: '700', fontFamily: FontFamily.bold, color: '#1A1B1C' },
  barTrack: { height: 6, backgroundColor: '#E8E5DC', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#F4C430', borderRadius: 3 },
  header: { gap: 4, marginBottom: 4, alignItems: 'center' },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 5,
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#F4C430',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: { fontSize: 22, fontWeight: '800', fontFamily: FontFamily.extrabold, color: '#1A1B1C', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#6B6B6B', textAlign: 'center', lineHeight: 19 },

  picCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#F0E4B8',
    padding: 16,
  },
  picWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F4C430',
    borderWidth: 2,
    borderColor: 'rgba(26,27,28,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  picImg: { width: '100%', height: '100%' },
  picInfo: { flex: 1, gap: 3 },
  picName: { fontSize: 16, fontWeight: '800', fontFamily: FontFamily.extrabold, color: '#171717' },
  picEmail: { fontSize: 12, color: '#6B6B6B', fontFamily: FontFamily.medium },
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
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#F0E4B8',
    borderLeftWidth: 3,
    borderLeftColor: '#F4C430',
    padding: 16,
    gap: 4,
  },
  identityLabel: { fontSize: 12, color: '#6B6B6B', fontWeight: '600', fontFamily: FontFamily.semibold },
  identityValue: { fontSize: 14, color: '#171717', fontWeight: '700', fontFamily: FontFamily.bold },
  identityHint: { fontSize: 13, color: '#6B6B6B', fontFamily: FontFamily.medium, lineHeight: 18 },

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

  syncOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 100, gap: 12 },
  syncText: { fontSize: 15, color: '#6B6B6B', fontWeight: '600', fontFamily: FontFamily.semibold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    gap: 12,
    borderWidth: 1,
    borderColor: '#F0E4B8',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  checkCircleBig: {
    width: 72,
    height: 72,
    borderRadius: 5,
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F4C430',
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', fontFamily: FontFamily.extrabold, color: '#1A1B1C' },
  modalSub: { fontSize: 13, color: '#6B6B6B', textAlign: 'center', lineHeight: 18 },
});
