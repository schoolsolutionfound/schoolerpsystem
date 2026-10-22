import { useCallback, useEffect } from 'react';
import { useUserStore } from '../../../store/useUserStore';
import { getMyProfileFieldsApi, updateMyProfileApi } from '../../../api/users';
import type { CustomFieldValues, ProfileFormField } from './types';

interface ProfileCustomFieldsState {
  fields: ProfileFormField[];
  values: CustomFieldValues;
  /** PATCH /users/me with customFields, then mirror into the store. Throws on failure. */
  save: (next: CustomFieldValues) => Promise<boolean>;
}

/**
 * Store-backed config + values for the admin-configured profile fields,
 * with a direct fetch fallback when login sync hasn't filled them in yet.
 */
export function useProfileCustomFields(): ProfileCustomFieldsState {
  const fields = useUserStore((state) => state.profileFields) || [];
  const values = useUserStore((state) => state.customFields) || {};
  const setUserProfile = useUserStore((state) => state.setUserProfile);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (useUserStore.getState().profileFields.length > 0) return;
      try {
        const res = await getMyProfileFieldsApi();
        if (!cancelled && Array.isArray(res) && res.length > 0) {
          useUserStore.getState().setUserProfile({ profileFields: res as ProfileFormField[] });
        }
      } catch { /* keep whatever the sync gave us */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const save = useCallback(async (next: CustomFieldValues) => {
    await updateMyProfileApi({ customFields: next });
    setUserProfile({ customFields: { ...useUserStore.getState().customFields, ...next } });
    return true;
  }, [setUserProfile]);

  return { fields, values, save };
}
