import { useState, useEffect, useCallback } from 'react';
import {
  getMembersApi,
  getMemberApi,
  MemberFilters,
} from '../../../api/library';
import { StudentProfile } from '../types';

export function useLibraryMembers(initialFilters?: MemberFilters) {
  const [members, setMembers] = useState<StudentProfile[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async (filters?: MemberFilters) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMembersApi(filters || initialFilters);
      const itemsList = Array.isArray(res) ? res : res?.items || [];
      const totalCount = Array.isArray(res) ? res.length : (res?.total ?? itemsList.length);

      const mapped: StudentProfile[] = itemsList.map((m: any) => ({
        id: m.id,
        fullName: m.fullName || 'Library Member',
        admissionNo: m.admissionNo || 'ADM-N/A',
        classSection: m.classSection || 'General',
        email: m.email || '',
        phone: m.phone || undefined,
        profilePicUrl: m.profilePicUrl || undefined,
        activeLoansCount: m.activeLoansCount || 0,
        totalUnpaidFine: typeof m.totalUnpaidFine === 'string' ? parseFloat(m.totalUnpaidFine) || 0 : (m.totalUnpaidFine || 0),
      }));

      setMembers(mapped);
      setTotal(totalCount);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch members');
    } finally {
      setLoading(false);
    }
  }, [initialFilters]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const getMemberDetails = async (id: string) => {
    return await getMemberApi(id);
  };

  return {
    members,
    total,
    loading,
    error,
    refetch: fetchMembers,
    getMemberDetails,
  };
}
