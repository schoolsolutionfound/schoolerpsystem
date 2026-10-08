import type { NotificationRecord } from '../shared/db/schema.js';

export type NotificationType =
  | 'general'
  | 'announcement'
  | 'attendance'
  | 'fee'
  | 'exam'
  | 'homework'
  | 'timetable'
  | 'bus'
  | 'library'
  | 'chat'
  | 'admission'
  | 'system'
  | 'reminder';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationChannel = 'push' | 'in_app' | 'sms' | 'email';
export type NotificationStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'read';
export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface NotificationPayload {
  institutionCode: string;
  recipientId: string;
  title: string;
  body: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  channel?: NotificationChannel;
  data?: Record<string, any>;
}

export interface BulkNotificationPayload {
  institutionCode: string;
  recipientIds: string[];
  title: string;
  body: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  channel?: NotificationChannel;
  data?: Record<string, any>;
}

export interface CampaignTarget {
  userIds?: string[];
  roles?: string[];
  classSectionIds?: string[];
  allUsers?: boolean;
}

export interface CreateCampaignPayload {
  institutionCode: string;
  title: string;
  body: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  channel?: NotificationChannel;
  target: CampaignTarget;
  scheduledAt?: string;
  createdBy: string;
}

export interface RegisterTokenPayload {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceName?: string;
}

export interface SendToUserPayload {
  userId: string;
  title: string;
  body: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  data?: Record<string, any>;
}

export interface NotificationWithRecipient extends NotificationRecord {
  recipientName?: string;
  recipientRole?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  sentToday: number;
  failedToday: number;
}

export interface CampaignStats {
  totalCampaigns: number;
  runningCampaigns: number;
  totalSent: number;
  totalFailed: number;
}

export type {
  NotificationRecord,
  NewNotificationRecord,
  PushTokenRecord,
  NewPushTokenRecord,
  NotificationTemplateRecord,
  NewNotificationTemplateRecord,
  NotificationCampaignRecord,
  NewNotificationCampaignRecord,
} from '../shared/db/schema.js';

export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  priority?: string;
  ttl?: number;
  badge?: number;
}

export interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: Record<string, any>;
}

export interface ExpoPushReceipt {
  status: 'ok' | 'error' | 'waiting';
  message?: string;
  details?: Record<string, any>;
}

export const PRIORITY_QUEUE_MAP: Record<NotificationPriority, number> = {
  urgent: 1,
  high: 2,
  normal: 3,
  low: 4,
};

export const MAX_RETRY_COUNT = 5;
export const BATCH_SIZE = 100;
export const MAX_BATCHES_PER_SECOND = 50;
