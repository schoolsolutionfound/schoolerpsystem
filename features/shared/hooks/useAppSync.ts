import { useEffect, useRef } from 'react';
import type { User } from 'firebase/auth';
import { db } from '../../../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { useUserStore } from '../../../store/useUserStore';
import { syncLoginApi } from '../../../api/auth';

const loginSyncRequests = new Map<string, Promise<any>>();

function getLoginSyncRequest(uid: string) {
  const existing = loginSyncRequests.get(uid);
  if (existing) {
    if (__DEV__) console.log('[BOOT] /auth/login-sync reusing in-flight request', { uid });
    return existing;
  }

  if (__DEV__) console.log('[BOOT] /auth/login-sync request start');
  const request = syncLoginApi();
  loginSyncRequests.set(uid, request);

  const clear = () => {
    if (loginSyncRequests.get(uid) === request) {
      loginSyncRequests.delete(uid);
    }
  };
  request.then(clear, clear);
  return request;
}

export function useAppSync(userSession: User | null) {
  const setUserProfile = useUserStore((state) => state.setUserProfile);
  const setProfileExists = useUserStore((state) => state.setProfileExists);
  const setIsProfileSynced = useUserStore((state) => state.setIsProfileSynced);
  const _hasHydrated = useUserStore((state) => state._hasHydrated);

  const unsubProfileRef = useRef<(() => void) | null>(null);
  const lastSyncedUidRef = useRef<string | null>(null);
  const userSessionRef = useRef(userSession);

  useEffect(() => {
    userSessionRef.current = userSession;
  }, [userSession]);

  useEffect(() => {
    const currentUser = userSessionRef.current;
    if (__DEV__) {
      console.log('[BOOT] profile sync effect', {
        hasUser: !!currentUser,
        uid: currentUser?.uid ?? null,
        hydrated: _hasHydrated,
      });
    }
    if (!currentUser || !_hasHydrated) {
      if (__DEV__) console.log('[BOOT] profile sync waiting', { hasUser: !!currentUser, hydrated: _hasHydrated });
      lastSyncedUidRef.current = null;
      if (unsubProfileRef.current) {
        unsubProfileRef.current();
        unsubProfileRef.current = null;
      }
      return;
    }

    // Only run sync once per authenticated user UID
    if (lastSyncedUidRef.current === currentUser.uid) {
      if (__DEV__) console.log('[BOOT] profile sync already ran for uid', currentUser.uid);
      return;
    }
    lastSyncedUidRef.current = currentUser.uid;

    let isCancelled = false;

    const applyBackendData = (res: any) => {
      const rawRole = (res.userRole || '').toLowerCase();
      // Canonicalize aliases so client guards (isDeveloper/isAdmin) always match.
      const finalRole = (rawRole === 'institution admin' || rawRole === 'admin')
        ? 'admin'
        : (rawRole === 'developer' ? 'dev' : (rawRole || 'student'));

      setUserProfile({
        fullName: res.fullName || currentUser.displayName || '',
        email: res.email || currentUser.email || '',
        userRole: finalRole as any,
        roles: Array.isArray(res.roles) && res.roles.length > 0 ? res.roles : [finalRole],
        institutionId: res.institutionCode || '',
        institutionCode: res.institutionCode || '',
        institutionName: res.institutionName || res.institutionCode || '',
        institutionType: res.institutionType || 'school',
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
        profileFields: Array.isArray(res.profileFormFields) ? res.profileFormFields : [],
        customFields: res.customFields && typeof res.customFields === 'object' ? res.customFields : {},
        mustChangePassword: res.mustChangePassword ?? false,
        profileCompleted: res.profileCompleted ?? false,
        placementAccess: res.placementAccess || null,
        // Trust the backend's users.email_verified, not the (often stale) Firebase
        // claim — the backend is the source of truth post-Phase 2.
        isEmailVerified: res.isEmailVerified ?? res.emailVerified ?? true,
      });

      setProfileExists(true);
      setIsProfileSynced(true);
      if (__DEV__) {
        console.log('[BOOT] backend profile applied', {
          userRole: finalRole,
          institutionCode: res.institutionCode || '',
          profileCompleted: res.profileCompleted ?? false,
          mustChangePassword: res.mustChangePassword ?? false,
          isEmailVerified: res.isEmailVerified ?? res.emailVerified ?? true,
        });
      }
    };

    // SECURITY: Never infer privileged roles from email substrings.
    // Email-based inference let anyone whose address contains "admin"/"dev"
    // render admin/developer dashboards locally before (or without) backend sync.
    // Pre-sync profile is a neutral placeholder; applyBackendData (login-sync)
    // is the sole source of truth for role/flags.
    const NEUTRAL_PRE_SYNC_ROLE = 'student';

    const initProfileFromAuth = async () => {
      try {
        const tokenResult = await currentUser.getIdTokenResult();
        const claims = tokenResult?.claims || {};
        const claimRole = ((claims.role || claims.userRole) as string | undefined)?.toLowerCase().trim();
        // Claims only — no email inference. Unknown/unprovisioned users stay neutral.
        const resolvedRole = claimRole === 'institution admin'
          ? 'admin'
          : (claimRole === 'developer' ? 'dev' : (claimRole || NEUTRAL_PRE_SYNC_ROLE));

        const stored = useUserStore.getState();
        const hasStoredInstitution = _hasHydrated && !!stored.institutionCode;
        const claimInstitutionCode = (claims.institutionCode as string) || '';
        const claimInstitutionName = (claims.institutionName as string) || '';
        const claimInstitutionType = claims.institutionType === 'college' ? 'college' : 'school';

        setUserProfile({
          fullName: currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'User'),
          email: currentUser.email || '',
          userRole: resolvedRole as any,
          institutionId: hasStoredInstitution ? stored.institutionId || stored.institutionCode : claimInstitutionCode,
          institutionCode: hasStoredInstitution ? stored.institutionCode : claimInstitutionCode,
          institutionName: hasStoredInstitution ? stored.institutionName : claimInstitutionName,
          institutionType: hasStoredInstitution ? stored.institutionType : claimInstitutionType,
          mustChangePassword: false,
          profileCompleted: true,
          // Pre-sync fallback: trust the Firebase client claim; the backend
          // sync below overwrites it with the authoritative value.
          isEmailVerified: currentUser.emailVerified ?? true,
        });
        setProfileExists(true);
        if (__DEV__) {
          console.log('[BOOT] auth claims profile applied', {
            userRole: resolvedRole,
            institutionCode: (claims.institutionCode as string) || '',
          });
        }
        // NOTE: isProfileSynced stays false until login-sync returns — the
        // auth guard waits for it so first-login routing uses the real flags.
      } catch (error) {
        if (__DEV__) console.warn('[BOOT] failed to read auth claims, using neutral profile', error);
        const stored = useUserStore.getState();
        const hasStoredInstitution = _hasHydrated && !!stored.institutionCode;
        setUserProfile({
          fullName: currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'User'),
          email: currentUser.email || '',
          userRole: NEUTRAL_PRE_SYNC_ROLE as any,
          institutionId: hasStoredInstitution ? stored.institutionId || stored.institutionCode : '',
          institutionCode: hasStoredInstitution ? stored.institutionCode : '',
          institutionName: hasStoredInstitution ? stored.institutionName : '',
          institutionType: hasStoredInstitution ? stored.institutionType : 'school',
          mustChangePassword: false,
          profileCompleted: true,
          // Pre-sync fallback: trust the Firebase client claim; the backend
          // sync below overwrites it with the authoritative value.
          isEmailVerified: currentUser.emailVerified ?? true,
        });
        setProfileExists(true);
      }
    };

    const performBackendSync = async () => {
      await initProfileFromAuth();
      try {
        const res = await getLoginSyncRequest(currentUser.uid);
        if (__DEV__) console.log('[BOOT] /auth/login-sync response', { hasData: !!res });
        if (isCancelled) return;
        if (!res) {
          if (__DEV__) console.warn('[BOOT] /auth/login-sync returned no data, using Firestore fallback');
          fallbackFirestoreSync();
          return;
        }
        applyBackendData(res);
      } catch (err: any) {
        if (__DEV__) console.warn('[BOOT] /auth/login-sync failed', { code: err?.code, message: err?.message });
        if (err?.code === 'EMAIL_NOT_VERIFIED') {
          console.warn('[useAppSync] Email not verified — skipping Firestore fallback, auth guard will redirect.');
          setIsProfileSynced(true);
          if (__DEV__) console.log('[BOOT] profile marked synced after EMAIL_NOT_VERIFIED');
          return;
        }
        // Only fall back when the backend is actually unreachable. 4xx/5xx
        // (incl. 429 RATE_LIMITED) mean the backend responded — falling back
        // to Firestore there only piles on a second failure (its rules often
        // deny the read, spamming permission warnings).
        if (err?.code === 'NETWORK_ERROR') {
          console.warn('[useAppSync] Backend unreachable, falling back to Firestore:', err?.message);
          if (__DEV__) console.warn('[BOOT] using Firestore fallback after network error');
          fallbackFirestoreSync();
          return;
        }
        console.warn('[useAppSync] Backend sync rejected — keeping auth-derived profile:', err?.message);
        // initProfileFromAuth already populated a usable claim-based profile.
        setIsProfileSynced(true);
        if (__DEV__) console.log('[BOOT] profile marked synced after backend rejection');
      }
    };

    const fallbackFirestoreSync = () => {
      if (__DEV__) console.log('[BOOT] Firestore fallback listener starting', { uid: currentUser.uid });
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
            const rawRole = ((data.role || data.userRole || '') as string)
              .toLowerCase()
              .trim() || 'student';
            const finalRole = (rawRole === 'institution admin' || rawRole === 'admin')
              ? 'admin'
              : (rawRole === 'developer' ? 'dev' : rawRole);

            setUserProfile({
              fullName: data.fullName || '',
              email: data.email || '',
              phone: data.phone || '',
              institutionId: data.selectedSchoolId || data.selectedInstitutionId || data.institutionCode || useUserStore.getState().institutionId,
              institutionName: data.selectedSchoolName || data.selectedInstitutionName || data.institutionName || '',
              institutionCode: data.institutionCode || '',
              institutionType: data.institutionType || 'school',
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
              placementAccess: data.placementAccess || useUserStore.getState().placementAccess || null,
              isEmailVerified: data.isEmailVerified === true || currentUser.emailVerified,
            });

            setProfileExists(true);
            setIsProfileSynced(true);
            if (__DEV__) console.log('[BOOT] Firestore fallback profile applied', { userRole: finalRole, exists: true });
          }
        } else {
          if (__DEV__) console.warn('[BOOT] Firestore fallback profile missing, marking synced');
          setProfileExists(false);
          setIsProfileSynced(true);
        }
      }, (err) => {
        console.warn('[useAppSync] Firestore fallback profile listener permission check:', err.message);
        if (__DEV__) console.warn('[BOOT] Firestore fallback listener failed, marking synced', err.message);
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
  }, [userSession?.uid, _hasHydrated, setUserProfile, setProfileExists, setIsProfileSynced]);
}
