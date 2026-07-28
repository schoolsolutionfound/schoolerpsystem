import { useEffect } from 'react';
import { auth, db } from '../../../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { useUserStore } from '../../../store/useUserStore';
import { syncLoginApi } from '../../../api/auth';

export function useAppSync() {
  const setUserProfile = useUserStore((state) => state.setUserProfile);
  const setProfileExists = useUserStore((state) => state.setProfileExists);
  const setIsProfileSynced = useUserStore((state) => state.setIsProfileSynced);
  const _hasHydrated = useUserStore((state) => state._hasHydrated);

  useEffect(() => {
    if (!auth.currentUser || !_hasHydrated) return;

    const currentUser = auth.currentUser;
    let isCancelled = false;

    // Primary Sync Strategy: Backend PostgreSQL via Fastify API (/auth/login-sync)
    const performBackendSync = async () => {
      try {
        const res = await syncLoginApi();
        if (isCancelled || !res) return;

        const rawRole = (res.userRole || '').toLowerCase();
        const finalRole = (rawRole === 'maintainer' || rawRole === 'institution admin' || rawRole === 'admin')
          ? 'admin'
          : (rawRole || 'student');

        setUserProfile({
          fullName: res.fullName || currentUser.displayName || '',
          email: res.email || currentUser.email || '',
          userRole: finalRole as any,
          institutionId: res.institutionCode || '',
          institutionCode: res.institutionCode || '',
          institutionName: res.institutionName || res.institutionCode || '',
          institutionType: res.institutionType || 'school',
          mustChangePassword: res.mustChangePassword ?? false,
          profileCompleted: res.profileCompleted ?? false,
          isEmailVerified: true,
        });

        setProfileExists(true);
        setIsProfileSynced(true);
      } catch (err) {
        console.warn('[useAppSync] Backend sync error, falling back to Firestore/local state:', err);
        // Fallback: If backend sync fails, verify Firestore doc
        fallbackFirestoreSync();
      }
    };

    const fallbackFirestoreSync = () => {
      const uid = currentUser.uid;
      const unsubProfile = onSnapshot(doc(db, "users", uid), { includeMetadataChanges: true }, (docSnap) => {
        if (isCancelled) return;
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data) {
            const currentStoreRole = useUserStore.getState().userRole;
            const finalRole = (currentStoreRole === 'admin' || currentStoreRole === 'teacher')
              ? currentStoreRole
              : (data.role || 'student');

            setUserProfile({
              fullName: data.fullName || '',
              email: data.email || '',
              phone: data.phone || '',
              institutionId: data.selectedSchoolId || data.selectedInstitutionId || useUserStore.getState().institutionId,
              institutionName: data.selectedSchoolName || data.selectedInstitutionName || '',
              profilePic: data.profilePic || '',
              language: data.language || 'en',
              userRole: finalRole as any,
              isEmailVerified: data.isEmailVerified === true || currentUser.emailVerified,
            });

            setProfileExists(true);
            setIsProfileSynced(true);
          }
        } else {
          setProfileExists(false);
          setIsProfileSynced(true);
        }
      }, (err) => {
        console.warn('[useAppSync] Firestore fallback profile listener permission check:', err.message);
        setProfileExists(true);
        setIsProfileSynced(true);
      });
      return unsubProfile;
    };

    performBackendSync();

    return () => {
      isCancelled = true;
    };
  }, [auth.currentUser, _hasHydrated]);
}

