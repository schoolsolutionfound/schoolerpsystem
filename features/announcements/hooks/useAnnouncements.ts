import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auth } from '../../../firebaseConfig';
import {
  fetchAnnouncementsApi,
  fetchAnnouncementFeedApi,
  fetchUnreadAnnouncementCountApi,
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
import { Announcement } from '../types';

const getUserScope = () => auth.currentUser?.uid || 'guest';
const isAuthReady = () => Boolean(auth.currentUser?.uid);

export const ANNOUNCEMENTS_QUERY_KEY = ['announcements'];

const PAGE_SIZE = 20;

type AnnouncementPage = { items?: Announcement[]; total?: number };

/**
 * Management list with infinite scroll (A8): pages of PAGE_SIZE, load-more
 * via FlatList onEndReached. Invalidations on ['announcements', userScope]
 * still apply through the key prefix.
 */
export function useAnnouncementsInfiniteQuery(query: Omit<AnnouncementQueryPayload, 'limit' | 'offset'> = {}) {
  const userScope = getUserScope();
  return useInfiniteQuery({
    queryKey: ['announcements', userScope, 'management-infinite', query],
    queryFn: ({ pageParam }): Promise<AnnouncementPage> =>
      fetchAnnouncementsApi({ ...query, limit: PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: AnnouncementPage, allPages: AnnouncementPage[]) => {
      const loaded = allPages.reduce((n, p) => n + (p?.items?.length || 0), 0);
      const total = lastPage?.total ?? loaded;
      return loaded < total ? loaded : undefined;
    },
    enabled: isAuthReady(),
  });
}

/**
 * User feed with infinite scroll (A8).
 */
export function useAnnouncementFeedInfiniteQuery(query: Omit<AnnouncementQueryPayload, 'limit' | 'offset'> = {}) {
  const userScope = getUserScope();
  return useInfiniteQuery({
    queryKey: ['announcements', userScope, 'feed-infinite', query],
    queryFn: ({ pageParam }): Promise<AnnouncementPage> =>
      fetchAnnouncementFeedApi({ ...query, limit: PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: AnnouncementPage, allPages: AnnouncementPage[]) => {
      const loaded = allPages.reduce((n, p) => n + (p?.items?.length || 0), 0);
      const total = lastPage?.total ?? loaded;
      return loaded < total ? loaded : undefined;
    },
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

