import { useQuery, useMutation, useQueryClient, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
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
  searchInstitutionsApi,
  fetchInstitutionsPageApi,
  FetchInstitutionsParams,
} from '../api/developer.api';
import {
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
  institutionSearch: (search: string, limit: number) =>
    [...developerKeys.institutions(), 'search', search, limit] as const,
  institutionPages: (search: string, type: string, status: string) =>
    [...developerKeys.institutions(), 'pages', search, type, status] as const,
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

/**
 * Debounced server-side search for typeahead pickers. Pass a query term and an
 * `enabled` flag (e.g. "field focused"). Returns at most `limit` institutions
 * plus a `total` count.
 */
export function useInstitutionSearchQuery(
  search: string,
  enabled: boolean,
  limit = 50
) {
  const term = search.trim();
  return useQuery({
    queryKey: developerKeys.institutionSearch(term, limit),
    queryFn: () => searchInstitutionsApi(term, limit),
    enabled: enabled && term.length > 0,
    staleTime: 1000 * 60,
  });
}

/** Page size for the paginated institution list screens. */
export const INSTITUTION_PAGE_SIZE = 25;

export interface InstitutionPagesParams {
  /** Debounced search term (empty string = no search). */
  search?: string;
  /** 'school' | 'college'. */
  type?: string;
  /** 'active' | 'trial' | 'inactive' | 'suspended' | 'non_active' (inactive+suspended). */
  status?: string;
}

/**
 * Infinite, server-paginated institution list. Search/filter run in SQL, so
 * these screens never download the whole table. Use `fetchNextPage` from
 * FlatList's `onEndReached`.
 */
export function useInstitutionPagesQuery(params: InstitutionPagesParams) {
  const search = (params.search ?? '').trim();
  return useInfiniteQuery({
    queryKey: developerKeys.institutionPages(search, params.type ?? '', params.status ?? ''),
    queryFn: ({ pageParam }) =>
      fetchInstitutionsPageApi({
        page: pageParam,
        limit: INSTITUTION_PAGE_SIZE,
        search: search || undefined,
        type: params.type,
        status: params.status,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((n, p) => n + p.data.length, 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
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

