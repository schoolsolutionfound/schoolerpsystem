import { useEffect, useRef } from 'react';
import type { User } from 'firebase/auth';
import { db } from '../../../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { useUserStore } from '../../../store/useUserStore';
import { syncLoginApi } from '../../../api/auth';

function normalizeUserRole(rawRole: string | undefined): string {
  const r = (rawRole || '').toLowerCase().trim();
  if (r === 'institution admin') return 'admin';
  if (r === 'hid') return 'hod';
  return r;
}

const VALID_ROLES = ['admin', 'principal', 'hod', 'teacher', 'student', 'parent', 'dev', 'accountant', 'librarian', 'driver', 'admission_officer'];

export function useAppSync(userSession: User | null) {
  const setUserProfile = useUserStore((state) => state.setUserProfile);
  const setProfileExists = useUserStore((state) => state.setProfileExists);
  const setIsProfileSynced = useUserStore((state) => state.setIsProfileSynced);
  const _hasHydrated = useUserStore((state) => state._hasHydrated);

  const unsubProfileRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!userSession || !_hasHydrated) return;

    const currentUser = userSession;
    let isCancelled = false;

    // IMMEDIATE STEP: Fast token claims resolution directly from Firebase Auth
    currentUser.getIdTokenResult(true).then((tokenResult) => {
      if (isCancelled) return;
      const tokenRole = normalizeUserRole(tokenResult.claims.role as string | undefined);
      if (VALID_ROLES.includes(tokenRole)) {
        const roles = Array.isArray(tokenResult.claims.roles) && (tokenResult.claims.roles as string[]).length > 0 
          ? (tokenResult.claims.roles as string[]) 
          : [tokenRole];
        const instCode = (tokenResult.claims.institutionCode as string) || '';
        const defaultName = tokenRole === 'principal' ? 'Principal Sterling' : (currentUser.displayName || currentUser.email?.split('@')[0] || '');
        setUserProfile({
          userRole: tokenRole as any,
          roles,
          institutionCode: instCode,
          institutionId: instCode,
          email: currentUser.email || '',
          fullName: currentUser.displayName || defaultName,
          isEmailVerified: true,
          profileCompleted: true,
        });
        setIsProfileSynced(true);
      }
    }).catch(() => {});

    const applyBackendData = (res: any) => {
      const backendRole = normalizeUserRole(res.userRole || res.role);
      const currentRole = normalizeUserRole(useUserStore.getState().userRole);
      const finalRole = VALID_ROLES.includes(backendRole)
        ? backendRole
        : (VALID_ROLES.includes(currentRole) ? currentRole : 'student');

      setUserProfile({
        fullName: res.fullName || currentUser.displayName || '',
        email: res.email || currentUser.email || '',
        userRole: finalRole as any,
        roles: Array.isArray(res.roles) && res.roles.length > 0 ? res.roles : [finalRole],
        institutionId: res.institutionCode || '',
        institutionCode: res.institutionCode || '',
        institutionName: res.institutionName || res.institutionCode || '',
        institutionType: res.institutionType || 'college',
        rollNoOrUSN: res.rollNoOrUSN || '',
        phone: res.phone || '',
        parentPhone: res.parentPhone || '',
        profilePic: res.profilePicUrl || '',
        tenthPercentage: res.tenthPercentage || '',
        twelfthPercentage: res.twelfthPercentage || '',
        employeeId: res.employeeId || '',
        department: res.department || '',
        linkedStudentUSN: res.linkedStudentUSN || '',
        relation: res.relation || '',
        childId: res.childId || '',
        childName: res.childName || '',
        qualification: res.qualification || '',
        experience: res.experience || '',
        libraryBadgeId: res.libraryBadgeId || '',
        designation: res.designation || '',
        mustChangePassword: res.mustChangePassword ?? false,
        profileCompleted: res.profileCompleted ?? false,
        isEmailVerified: true,
      });

      setProfileExists(true);
      setIsProfileSynced(true);
    };

    const performBackendSync = async () => {
      try {
        const res = await syncLoginApi();
        if (isCancelled) return;
        if (!res) {
          fallbackFirestoreSync();
          return;
        }
        applyBackendData(res);
      } catch (err: any) {
        if (err?.code === 'EMAIL_NOT_VERIFIED') {
          console.warn('[useAppSync] Email not verified — skipping Firestore fallback, auth guard will redirect.');
          setIsProfileSynced(true);
          return;
        }
        console.warn('[useAppSync] Backend sync error, falling back to Firestore:', err);
        fallbackFirestoreSync();
      }
    };

    const fallbackFirestoreSync = () => {
      if (unsubProfileRef.current) {
        unsubProfileRef.current();
        unsubProfileRef.current = null;
      }
      const uid = currentUser.uid;
      const unsubProfile = onSnapshot(doc(db, "users", uid), { includeMetadataChanges: true }, (docSnap) => {
        if (isCancelled) return;
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data) {
            const currentStoreRole = normalizeUserRole(useUserStore.getState().userRole);
            const docRole = normalizeUserRole(data.role || data.userRole);
            const finalRole = VALID_ROLES.includes(docRole)
              ? docRole
              : (VALID_ROLES.includes(currentStoreRole) ? currentStoreRole : 'student');

            setUserProfile({
              fullName: data.fullName || currentUser.displayName || '',
              email: data.email || currentUser.email || '',
              phone: data.phone || '',
              institutionId: data.selectedSchoolId || data.selectedInstitutionId || data.institutionCode || useUserStore.getState().institutionId,
              institutionName: data.selectedSchoolName || data.selectedInstitutionName || data.institutionName || '',
              institutionCode: data.institutionCode || '',
              institutionType: data.institutionType || 'college',
              rollNoOrUSN: data.rollNoOrUSN || '',
              parentPhone: data.parentPhone || '',
              tenthPercentage: data.tenthPercentage || '',
              twelfthPercentage: data.twelfthPercentage || '',
              profilePic: data.profilePic || data.profilePicUrl || '',
              language: data.language || 'en',
              userRole: finalRole as any,
              employeeId: data.employeeId || '',
              department: data.department || '',
              linkedStudentUSN: data.linkedStudentUSN || '',
              relation: data.relation || '',
              childId: data.childId || '',
              childName: data.childName || '',
              qualification: data.qualification || '',
              experience: data.experience || '',
              libraryBadgeId: data.libraryBadgeId || '',
              designation: data.designation || data.title || '',
              mustChangePassword: data.mustChangePassword ?? false,
              profileCompleted: data.profileCompleted ?? false,
              isEmailVerified: data.isEmailVerified === true || currentUser.emailVerified,
            });

            setProfileExists(true);
            setIsProfileSynced(true);
          }
        } else {
          // Document does not exist in Firestore yet: resolve role from token claims or cached store
          currentUser.getIdTokenResult().then((tokenResult) => {
            if (isCancelled) return;
            const tokenRole = normalizeUserRole(tokenResult.claims.role as string | undefined);
            const currentStoreRole = normalizeUserRole(useUserStore.getState().userRole);
            const finalRole = VALID_ROLES.includes(tokenRole)
              ? tokenRole
              : (VALID_ROLES.includes(currentStoreRole) ? currentStoreRole : 'parent');

            setUserProfile({
              fullName: currentUser.displayName || '',
              email: currentUser.email || '',
              userRole: finalRole as any,
              roles: [finalRole],
              isEmailVerified: currentUser.emailVerified,
            });
            setProfileExists(false);
            setIsProfileSynced(true);
          }).catch(() => {
            if (isCancelled) return;
            const currentStoreRole = normalizeUserRole(useUserStore.getState().userRole);
            const finalRole = VALID_ROLES.includes(currentStoreRole) ? currentStoreRole : 'parent';
            setUserProfile({
              fullName: currentUser.displayName || '',
              email: currentUser.email || '',
              userRole: finalRole as any,
              roles: [finalRole],
            });
            setProfileExists(false);
            setIsProfileSynced(true);
          });
        }
      }, (err) => {
        console.warn('[useAppSync] Firestore fallback profile listener permission check:', err.message);
        const currentStoreRole = normalizeUserRole(useUserStore.getState().userRole);
        const finalRole = VALID_ROLES.includes(currentStoreRole) ? currentStoreRole : 'parent';
        setUserProfile({
          fullName: currentUser.displayName || '',
          email: currentUser.email || '',
          userRole: finalRole as any,
          roles: [finalRole],
        });
        setIsProfileSynced(true);
      });
      unsubProfileRef.current = unsubProfile;
    };

    performBackendSync();

    return () => {
      isCancelled = true;
      if (unsubProfileRef.current) {
        unsubProfileRef.current();
        unsubProfileRef.current = null;
      }
    };
  }, [userSession, _hasHydrated, setIsProfileSynced, setProfileExists, setUserProfile]);
}

