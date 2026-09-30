import { apiClient } from './client';

export interface AnnouncementTargetPayload {
  targetType?: 'all' | 'role' | 'class' | 'section';
  targetRole?: string;
  classId?: string;
  sectionId?: string;
}

export interface CreateAnnouncementPayload {
  title: string;
  content: string;
  type?: 'GENERAL' | 'ACADEMIC' | 'EVENT' | 'URGENT' | 'NOTICE';
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  action?: 'draft' | 'publish' | 'schedule';
  publishAt?: string | null;
  expiresAt?: string | null;
  imageUrl?: string;
  attachmentUrl?: string;
  targets?: AnnouncementTargetPayload[];
}

export interface UpdateAnnouncementPayload {
  title?: string;
  content?: string;
  type?: 'GENERAL' | 'ACADEMIC' | 'EVENT' | 'URGENT' | 'NOTICE';
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  action?: 'draft' | 'publish' | 'schedule';
  publishAt?: string | null;
  expiresAt?: string | null;
  imageUrl?: string;
  attachmentUrl?: string;
  targets?: AnnouncementTargetPayload[];
}

export interface AnnouncementQueryPayload {
  search?: string;
  status?: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'EXPIRED' | 'CANCELLED';
  type?: 'GENERAL' | 'ACADEMIC' | 'EVENT' | 'URGENT' | 'NOTICE';
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  audience?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch management list of announcements (Staff / Admin).
 */
export async function fetchAnnouncementsApi(query: AnnouncementQueryPayload = {}) {
  const params = new URLSearchParams();
  if (query.search) params.append('search', query.search);
  if (query.status) params.append('status', query.status);
  if (query.type) params.append('type', query.type);
  if (query.priority) params.append('priority', query.priority);
  if (query.audience) params.append('audience', query.audience);
  if (query.limit !== undefined) params.append('limit', String(query.limit));
  if (query.offset !== undefined) params.append('offset', String(query.offset));

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  return apiClient(`/announcements${queryStr}`);
}

/**
 * Fetch active user-facing announcement feed.
 */
export async function fetchAnnouncementFeedApi(query: AnnouncementQueryPayload = {}) {
  const params = new URLSearchParams();
  if (query.limit !== undefined) params.append('limit', String(query.limit));
  if (query.offset !== undefined) params.append('offset', String(query.offset));

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  return apiClient(`/announcements/feed${queryStr}`);
}

/**
 * Fetch unread announcement count for active user feed.
 */
export async function fetchUnreadAnnouncementCountApi() {
  return apiClient('/announcements/unread-count');
}

/**
 * Fetch single announcement details by ID.
 */
export async function fetchAnnouncementByIdApi(id: string) {
  return apiClient(`/announcements/${id}`);
}

/**
 * Create a new announcement.
 */
export async function createAnnouncementApi(payload: CreateAnnouncementPayload) {
  return apiClient('/announcements', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Update an existing announcement.
 */
export async function updateAnnouncementApi(id: string, payload: UpdateAnnouncementPayload) {
  return apiClient(`/announcements/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * Delete a draft announcement.
 */
export async function deleteAnnouncementApi(id: string) {
  return apiClient(`/announcements/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Publish a draft or scheduled announcement immediately.
 */
export async function publishAnnouncementApi(id: string) {
  return apiClient(`/announcements/${id}/publish`, {
    method: 'POST',
  });
}

/**
 * Cancel a scheduled or published announcement.
 */
export async function cancelAnnouncementApi(id: string) {
  return apiClient(`/announcements/${id}/cancel`, {
    method: 'POST',
  });
}

/**
 * Archive an announcement.
 */
export async function archiveAnnouncementApi(id: string) {
  return apiClient(`/announcements/${id}/archive`, {
    method: 'POST',
  });
}

/**
 * Mark announcement as read.
 */
export async function markAnnouncementReadApi(id: string) {
  return apiClient(`/announcements/${id}/read`, {
    method: 'POST',
  });
}
