import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  archiveAnnouncementApi,
  markAnnouncementReadApi,
  AnnouncementQueryPayload,
  CreateAnnouncementPayload,
  UpdateAnnouncementPayload,
} from '../../../api/announcements';

export const ANNOUNCEMENTS_QUERY_KEY = ['announcements'];
export const ANNOUNCEMENT_FEED_QUERY_KEY = ['announcements', 'feed'];
export const UNREAD_COUNT_QUERY_KEY = ['announcements', 'unread-count'];

/**
 * Management list query (Staff / Admin).
 */
export function useAnnouncementsQuery(query: AnnouncementQueryPayload = {}) {
  return useQuery({
    queryKey: [...ANNOUNCEMENTS_QUERY_KEY, query],
    queryFn: () => fetchAnnouncementsApi(query),
  });
}

/**
 * User-facing active announcement feed query.
 */
export function useAnnouncementFeedQuery(query: AnnouncementQueryPayload = {}) {
  return useQuery({
    queryKey: [...ANNOUNCEMENT_FEED_QUERY_KEY, query],
    queryFn: () => fetchAnnouncementFeedApi(query),
  });
}

/**
 * Unread announcement count query.
 */
export function useUnreadAnnouncementCountQuery() {
  return useQuery({
    queryKey: UNREAD_COUNT_QUERY_KEY,
    queryFn: () => fetchUnreadAnnouncementCountApi(),
    refetchInterval: 60000, // Refetch every 60 seconds
  });
}

/**
 * Single announcement detail query.
 */
export function useAnnouncementDetailQuery(id: string | null) {
  return useQuery({
    queryKey: [...ANNOUNCEMENTS_QUERY_KEY, 'detail', id],
    queryFn: () => (id ? fetchAnnouncementByIdApi(id) : null),
    enabled: Boolean(id),
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
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENT_FEED_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
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
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENT_FEED_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
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
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENT_FEED_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
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
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENT_FEED_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
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
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENT_FEED_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
    },
  });
}

/**
 * Archive announcement mutation.
 */
export function useArchiveAnnouncementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveAnnouncementApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENT_FEED_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
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
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENT_FEED_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
    },
  });
}
