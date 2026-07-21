import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { useUserStore } from '../store/useUserStore';

export function useAppSync() {
  const setUserProfile = useUserStore((state) => state.setUserProfile);
  const setProfileExists = useUserStore((state) => state.setProfileExists);
  const setIsProfileSynced = useUserStore((state) => state.setIsProfileSynced);
  const _hasHydrated = useUserStore((state) => state._hasHydrated);
  const userRole = useUserStore((state) => state.userRole);
  const schoolId = useUserStore((state) => state.schoolId);

  useEffect(() => {
    if (!auth.currentUser || !_hasHydrated || userRole === 'admin' || userRole === 'teacher' || userRole === 'dev') return;

    const uid = auth.currentUser.uid;
    let syncTimeout: any;

    syncTimeout = setTimeout(() => {
      if (!useUserStore.getState().isProfileSynced) {
        setIsProfileSynced(true);
      }
    }, 3000);

    const unsubProfile = onSnapshot(doc(db, "users", uid), { includeMetadataChanges: true }, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const fromCache = docSnap.metadata.fromCache;

        if (data) {
          const isSnapshotComplete = data.role && (data.email || data.fullName);
          if (!isSnapshotComplete) return;

          const currentStoreRole = useUserStore.getState().userRole;
          const finalRole = (currentStoreRole === 'admin' || currentStoreRole === 'teacher') ? currentStoreRole : (data.role || 'student');

          const firebaseAuthVerified = auth.currentUser?.emailVerified === true;
          const freshIsEmailVerified = (finalRole === 'admin' || finalRole === 'teacher') ? true : (data.isEmailVerified === true || firebaseAuthVerified);

          setUserProfile({
            fullName: data.fullName || '',
            email: data.email || '',
            phone: data.phone || '',
            schoolId: data.selectedSchoolId || useUserStore.getState().schoolId,
            schoolName: data.selectedSchoolName || '',
            profilePic: data.profilePic || '',
            language: data.language || 'en',
            userRole: finalRole as any,
            isEmailVerified: freshIsEmailVerified,
          });

          setProfileExists(true);

          if (!fromCache || freshIsEmailVerified) {
            clearTimeout(syncTimeout);
            setIsProfileSynced(true);
          }
        }
      } else {
        setProfileExists(false);
        clearTimeout(syncTimeout);
        setIsProfileSynced(true);
      }
    }, (error) => {
      console.log("Profile listener disconnected.");
    });

    return () => {
      unsubProfile();
      clearTimeout(syncTimeout);
    };
  }, [auth.currentUser, _hasHydrated, userRole]);
}
