import { apiClient } from './client';

// ============================================================================
// Types
// ============================================================================

export interface NotificationItem {
  id: string;
  institutionCode: string;
  recipientId: string;
  title: string;
  body: string;
  type: string;
  priority: string;
  channel: string;
  data: Record<string, any>;
  status: string;
  readAt: string | null;
  sentAt: string | null;
  failedAt: string | null;
  errorMessage: string;
  retryCount: number;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
}

export interface UnreadCountResponse {
  unread: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  sentToday: number;
  failedToday: number;
}

export interface CampaignItem {
  id: string;
  institutionCode: string;
  title: string;
  body: string;
  type: string;
  priority: string;
  channel: string;
  target: Record<string, any>;
  scheduledAt: string | null;
  status: string;
  totalCount: number;
  sentCount: number;
  failedCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignListResponse {
  items: CampaignItem[];
  total: number;
}

export interface CampaignStats {
  totalCampaigns: number;
  runningCampaigns: number;
  totalSent: number;
  totalFailed: number;
}

export interface TemplateItem {
  id: string;
  institutionCode: string;
  type: string;
  channel: string;
  titleTemplate: string;
  bodyTemplate: string;
  locale: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  type?: string;
  priority?: string;
  data?: Record<string, any>;
}

export interface BatchNotificationPayload {
  recipientIds: string[];
  title: string;
  body: string;
  type?: string;
  priority?: string;
  channel?: string;
  data?: Record<string, any>;
}

export interface CampaignPayload {
  title: string;
  body: string;
  type?: string;
  priority?: string;
  channel?: string;
  target: {
    userIds?: string[];
    roles?: string[];
    classSectionIds?: string[];
    allUsers?: boolean;
  };
  scheduledAt?: string;
}

export interface RegisterTokenPayload {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceName?: string;
}

// ============================================================================
// User endpoints
// ============================================================================

export async function getMyNotificationsApi(params?: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
  type?: string;
}): Promise<NotificationListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));
  if (params?.unreadOnly) searchParams.set('unreadOnly', 'true');
  if (params?.type) searchParams.set('type', params.type);

  const qs = searchParams.toString();
  return apiClient<NotificationListResponse>(`/notifications${qs ? `?${qs}` : ''}`);
}

export async function getUnreadCountApi(): Promise<UnreadCountResponse> {
  return apiClient<UnreadCountResponse>('/notifications/unread-count');
}

export async function markNotificationReadApi(id: string): Promise<{ marked: boolean }> {
  return apiClient<{ marked: boolean }>(`/notifications/${id}/read`, { method: 'PUT' });
}

export async function markAllNotificationsReadApi(): Promise<{ marked: number }> {
  return apiClient<{ marked: number }>('/notifications/read-all', { method: 'PUT' });
}

// ============================================================================
// Token management
// ============================================================================

export async function registerPushTokenApi(payload: RegisterTokenPayload): Promise<any> {
  return apiClient('/notifications/register-token', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function unregisterPushTokenApi(token: string): Promise<{ unregistered: boolean }> {
  return apiClient('/notifications/unregister-token', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

// ============================================================================
// Send (staff)
// ============================================================================

export async function sendNotificationApi(payload: NotificationPayload): Promise<{ id: string }> {
  return apiClient('/notifications/send', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function sendBatchNotificationApi(
  payload: BatchNotificationPayload
): Promise<{ created: number; ids: string[] }> {
  return apiClient('/notifications/send-batch', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ============================================================================
// Campaigns (admin)
// ============================================================================

export async function createCampaignApi(payload: CampaignPayload): Promise<{ id: string }> {
  return apiClient('/notifications/campaigns', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function launchCampaignApi(id: string): Promise<{ created: number }> {
  return apiClient(`/notifications/campaigns/${id}/launch`, { method: 'POST' });
}

export async function getCampaignsApi(params?: {
  limit?: number;
  offset?: number;
  status?: string;
}): Promise<CampaignListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));
  if (params?.status) searchParams.set('status', params.status);

  const qs = searchParams.toString();
  return apiClient<CampaignListResponse>(`/notifications/campaigns${qs ? `?${qs}` : ''}`);
}

export async function getCampaignStatsApi(): Promise<CampaignStats> {
  return apiClient<CampaignStats>('/notifications/campaigns/stats');
}

// ============================================================================
// Stats (admin)
// ============================================================================

export async function getNotificationStatsApi(): Promise<NotificationStats> {
  return apiClient<NotificationStats>('/notifications/stats');
}

// ============================================================================
// Preferences
// ============================================================================

export interface NotificationPreferences {
  pushEnabled: boolean;
  disabledTypes: string[];
}

export const NOTIFIABLE_TYPES = [
  'attendance',
  'fee',
  'exam',
  'homework',
  'timetable',
  'bus',
  'library',
  'chat',
  'admission',
  'announcement',
  'reminder',
  'system',
] as const;

export async function getNotificationPreferencesApi(): Promise<NotificationPreferences> {
  return apiClient<NotificationPreferences>('/notifications/preferences');
}

export async function saveNotificationPreferencesApi(
  payload: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  return apiClient('/notifications/preferences', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// ============================================================================
// Templates (admin)
// ============================================================================

export async function getTemplatesApi(type?: string): Promise<TemplateItem[]> {
  const qs = type ? `?type=${type}` : '';
  return apiClient<TemplateItem[]>(`/notifications/templates${qs}`);
}

export async function upsertTemplateApi(payload: {
  type: string;
  channel?: string;
  titleTemplate: string;
  bodyTemplate: string;
  locale?: string;
  isActive?: boolean;
}): Promise<TemplateItem> {
  return apiClient('/notifications/templates', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
