import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auth } from '../../../firebaseConfig';
import {
  fetchAnnouncementsApi,
  fetchAnnouncementFeedApi,
  fetchUnreadAnnouncementCountApi,
  fetchAnnouncementByIdApi,
  createAnnouncementApi,
  updateAnnouncementApi,
  deleteAnnouncementApi,
  publishAnnouncementApi,
  cancelAnnouncementApi,
  markAnnouncementReadApi,
  AnnouncementQueryPayload,
  CreateAnnouncementPayload,
  UpdateAnnouncementPayload,
} from '../../../api/announcements';

const getUserScope = () => auth.currentUser?.uid || 'guest';
const isAuthReady = () => Boolean(auth.currentUser?.uid);

export const ANNOUNCEMENTS_QUERY_KEY = ['announcements'];

/**
 * Management list query (Staff / Admin).
 */
export function useAnnouncementsQuery(query: AnnouncementQueryPayload = {}) {
  const userScope = getUserScope();
  return useQuery({
    queryKey: ['announcements', userScope, 'management', query],
    queryFn: () => fetchAnnouncementsApi(query),
    enabled: isAuthReady(),
  });
}

/**
 * User-facing active announcement feed query.
 */
export function useAnnouncementFeedQuery(query: AnnouncementQueryPayload = {}) {
  const userScope = getUserScope();
  return useQuery({
    queryKey: ['announcements', userScope, 'feed', query],
    queryFn: () => fetchAnnouncementFeedApi(query),
    enabled: isAuthReady(),
  });
}

/**
 * Unread announcement count query.
 */
export function useUnreadAnnouncementCountQuery() {
  const userScope = getUserScope();
  return useQuery({
    queryKey: ['announcements', userScope, 'unread-count'],
    queryFn: () => fetchUnreadAnnouncementCountApi(),
    refetchInterval: 60000,
    enabled: isAuthReady(),
  });
}

/**
 * Single announcement detail query.
 */
export function useAnnouncementDetailQuery(id: string | null) {
  const userScope = getUserScope();
  return useQuery({
    queryKey: ['announcements', userScope, 'detail', id],
    queryFn: () => (id ? fetchAnnouncementByIdApi(id) : null),
    enabled: Boolean(id) && isAuthReady(),
  });
}

/**
 * Create announcement mutation.
 */
export function useCreateAnnouncementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAnnouncementPayload) => createAnnouncementApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', getUserScope()] });
    },
  });
}

/**
 * Update announcement mutation.
 */
export function useUpdateAnnouncementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAnnouncementPayload }) =>
      updateAnnouncementApi(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', getUserScope()] });
    },
  });
}

/**
 * Delete draft announcement mutation.
 */
export function useDeleteAnnouncementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAnnouncementApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', getUserScope()] });
    },
  });
}

/**
 * Publish announcement mutation.
 */
export function usePublishAnnouncementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => publishAnnouncementApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', getUserScope()] });
    },
  });
}

/**
 * Cancel announcement mutation.
 */
export function useCancelAnnouncementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelAnnouncementApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', getUserScope()] });
    },
  });
}

/**
 * Mark announcement read mutation.
 */
export function useMarkAnnouncementReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markAnnouncementReadApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', getUserScope()] });
    },
  });
}

