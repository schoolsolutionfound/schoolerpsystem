import { useEffect, useRef } from 'react';
import type { User } from 'firebase/auth';
import { db } from '../../../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { useUserStore } from '../../../store/useUserStore';
import { syncLoginApi } from '../../../api/auth';

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

    const applyBackendData = (res: any) => {
      const rawRole = (res.userRole || '').toLowerCase();
      const finalRole = (rawRole === 'institution admin' || rawRole === 'admin')
        ? 'admin'
        : (rawRole || 'student');

      setUserProfile({
        fullName: res.fullName || currentUser.displayName || '',
        email: res.email || currentUser.email || '',
        userRole: finalRole as any,
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
            const currentStoreRole = useUserStore.getState().userRole;
            const finalRole = (currentStoreRole === 'admin' || currentStoreRole === 'teacher')
              ? currentStoreRole
              : (data.role || 'student');

            setUserProfile({
              fullName: data.fullName || '',
              email: data.email || '',
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
          setProfileExists(false);
          setIsProfileSynced(true);
        }
      }, (err) => {
        console.warn('[useAppSync] Firestore fallback profile listener permission check:', err.message);
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

