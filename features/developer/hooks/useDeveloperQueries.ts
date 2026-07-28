import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchInstitutionsApi,
  fetchInstitutionByIdApi,
  createInstitutionApi,
  updateInstitutionApi,
  deleteInstitutionApi,
  fetchDeveloperStatsApi,
  fetchAdminsApi,
  createAdminApi,
  updateAdminApi,
  deleteAdminApi,
  FetchInstitutionsParams,
} from '../api/developer.api';
import {
  Institution,
  CreateInstitutionInput,
  UpdateInstitutionInput,
  InstitutionAdmin,
  CreateAdminInput,
  UpdateAdminInput,
  DeveloperStats,
} from '../types/developer.types';

export const developerKeys = {
  all: ['developer'] as const,
  institutions: () => [...developerKeys.all, 'institutions'] as const,
  institutionList: (params?: FetchInstitutionsParams) =>
    [...developerKeys.institutions(), 'list', params] as const,
  institutionDetail: (id: string) => [...developerKeys.institutions(), 'detail', id] as const,
  stats: () => [...developerKeys.all, 'stats'] as const,
  admins: () => [...developerKeys.all, 'admins'] as const,
};

export function useInstitutionsQuery(params?: FetchInstitutionsParams) {
  return useQuery({
    queryKey: developerKeys.institutionList(params),
    queryFn: () => fetchInstitutionsApi(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useInstitutionDetailsQuery(id: string) {
  return useQuery({
    queryKey: developerKeys.institutionDetail(id),
    queryFn: () => fetchInstitutionByIdApi(id),
    enabled: Boolean(id),
  });
}

export function useCreateInstitutionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInstitutionInput) => createInstitutionApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: developerKeys.institutions() });
      queryClient.invalidateQueries({ queryKey: developerKeys.stats() });
    },
  });
}

export function useUpdateInstitutionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateInstitutionInput }) =>
      updateInstitutionApi(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: developerKeys.institutions() });
      queryClient.invalidateQueries({ queryKey: developerKeys.institutionDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: developerKeys.stats() });
    },
  });
}

export function useDeleteInstitutionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInstitutionApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: developerKeys.institutions() });
      queryClient.invalidateQueries({ queryKey: developerKeys.stats() });
    },
  });
}

export function useDeveloperStatsQuery() {
  return useQuery<DeveloperStats>({
    queryKey: developerKeys.stats(),
    queryFn: () => fetchDeveloperStatsApi(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useAdminsQuery() {
  return useQuery<InstitutionAdmin[]>({
    queryKey: developerKeys.admins(),
    queryFn: () => fetchAdminsApi(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateAdminMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAdminInput) => createAdminApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: developerKeys.admins() });
      queryClient.invalidateQueries({ queryKey: developerKeys.stats() });
    },
  });
}

export function useUpdateAdminMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAdminInput }) =>
      updateAdminApi(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: developerKeys.admins() });
      queryClient.invalidateQueries({ queryKey: developerKeys.stats() });
    },
  });
}

export function useDeleteAdminMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: developerKeys.admins() });
      queryClient.invalidateQueries({ queryKey: developerKeys.stats() });
    },
  });
}

export function searchInstitutions(list: Institution[] = [], searchTerm: string = ''): Institution[] {
  if (!searchTerm.trim()) return list;
  const term = searchTerm.toLowerCase().trim();
  return list.filter(
    (item) =>
      item.institutionName.toLowerCase().includes(term) ||
      item.institutionCode.toLowerCase().includes(term) ||
      item.institutionType.toLowerCase().includes(term)
  );
}
