import {
  NotificationPayload,
  BulkNotificationPayload,
  CreateCampaignPayload,
  RegisterTokenPayload,
  NotificationType,
  NotificationPriority,
  CampaignTarget,
} from './notification.types.js';
import * as repo from './notification.repository.js';
import { renderTitle, renderBody, getDefaultTemplate } from './notification.templates.js';
import { enqueueNotification, enqueueBatch } from './notification.queue.js';

export class NotificationService {
  // ============================================================================
  // Preference partitioning: drops muted categories, splits push vs in-app
  // ============================================================================
  private async partitionRecipients(
    institutionCode: string,
    recipientIds: string[],
    type: string
  ): Promise<{ push: string[]; inApp: string[] }> {
    const prefs = await repo.getRecipientPreferences(recipientIds);
    const push: string[] = [];
    const inApp: string[] = [];

    for (const id of recipientIds) {
      const pref = prefs.get(id);
      if (pref && pref.disabledTypes.includes(type)) continue;
      if (pref && pref.pushEnabled === false) inApp.push(id);
      else push.push(id);
    }
    return { push, inApp };
  }

  // ============================================================================
  // Send to single user
  // ============================================================================
  async sendToUser(payload: NotificationPayload): Promise<string> {
    const [recipientId] = await repo.toFirebaseUids(payload.institutionCode, [payload.recipientId]);
    if (!recipientId) {
      throw Object.assign(new Error('Recipient not found in this institution'), { statusCode: 404, code: 'RECIPIENT_NOT_FOUND' });
    }
    payload = { ...payload, recipientId };

    const type = payload.type || 'general';
    const prefs = await repo.getRecipientPreferences([recipientId]);
    const pref = prefs.get(recipientId);
    if (pref && pref.disabledTypes.includes(type)) {
      return '';
    }
    payload = { ...payload, channel: pref && pref.pushEnabled === false ? 'in_app' : payload.channel || 'push' };

    const dbTemplate = await repo.getTemplateByType(payload.institutionCode, type);
    const defaultTemplate = getDefaultTemplate(payload.type || 'general');

    const variables = payload.data || {};
    const title = renderTitle(dbTemplate, payload.title || defaultTemplate?.title || 'Notification', variables);
    const body = renderBody(dbTemplate, payload.body || defaultTemplate?.body || '', variables);

    const notification = await repo.createNotification({
      ...payload,
      title,
      body,
    });

    enqueueNotification(notification.id);

    await repo.logAudit({
      institutionCode: payload.institutionCode,
      action: 'notification_created',
      notificationId: notification.id,
      userId: payload.recipientId,
      details: { type: payload.type, priority: payload.priority },
    });

    return notification.id;
  }

  // ============================================================================
  // Send to multiple users (batch)
  // ============================================================================
  async sendToUsers(payload: BulkNotificationPayload): Promise<{ created: number; ids: string[] }> {
    if (payload.recipientIds.length === 0) return { created: 0, ids: [] };

    const recipientIds = await repo.toFirebaseUids(payload.institutionCode, payload.recipientIds);
    if (recipientIds.length === 0) return { created: 0, ids: [] };

    const type = payload.type || 'general';
    const { push, inApp } = await this.partitionRecipients(payload.institutionCode, recipientIds, type);
    if (push.length === 0 && inApp.length === 0) return { created: 0, ids: [] };
    payload = { ...payload, recipientIds };

    const dbTemplate = await repo.getTemplateByType(payload.institutionCode, type);
    const defaultTemplate = getDefaultTemplate(type);

    const title = renderTitle(dbTemplate, payload.title || defaultTemplate?.title || 'Notification', payload.data || {});
    const body = renderBody(dbTemplate, payload.body || defaultTemplate?.body || '', payload.data || {});

    // Honour the requested campaign/channel. Only 'push' splits by the
    // per-user push preference; an explicit in_app/sms/email request applies
    // to every recipient.
    const requested = payload.channel || 'push';
    const notifications: NotificationPayload[] =
      requested === 'push'
        ? [
            ...push.map((recipientId) => ({ ...payload, recipientId, channel: 'push' as const, title, body })),
            ...inApp.map((recipientId) => ({ ...payload, recipientId, channel: 'in_app' as const, title, body })),
          ]
        : [...push, ...inApp].map((recipientId) => ({ ...payload, recipientId, channel: requested, title, body }));

    const created = await repo.createBulkNotifications(notifications);
    enqueueBatch(created.map((n) => n.id));

    await repo.logAudit({
      institutionCode: payload.institutionCode,
      action: 'bulk_notification_created',
      details: { count: created.length, type: payload.type },
    });

    return { created: created.length, ids: created.map((n) => n.id) };
  }

  // ============================================================================
  // Send messages with per-recipient title/body (batched, one template lookup)
  // ============================================================================
  async sendIndividualMessages(items: NotificationPayload[]): Promise<{ created: number }> {
    if (items.length === 0) return { created: 0 };

    const type = items[0].type || 'general';
    const prefs = await repo.getRecipientPreferences(items.map((i) => i.recipientId));
    const dbTemplate = await repo.getTemplateByType(items[0].institutionCode, type);
    const defaultTemplate = getDefaultTemplate(type);

    const allowed = items.filter((item) => {
      const pref = prefs.get(item.recipientId);
      return !(pref && pref.disabledTypes.includes(type));
    });
    if (allowed.length === 0) return { created: 0 };

    const notifications: NotificationPayload[] = allowed.map((item) => ({
      ...item,
      type: (item.type || 'general') as NotificationType,
      channel: prefs.get(item.recipientId)?.pushEnabled === false ? 'in_app' : 'push',
      title: renderTitle(dbTemplate, item.title || defaultTemplate?.title || 'Notification', item.data || {}),
      body: renderBody(dbTemplate, item.body || defaultTemplate?.body || '', item.data || {}),
    }));

    const created = await repo.createBulkNotifications(notifications);
    enqueueBatch(created.map((n) => n.id));

    await repo.logAudit({
      institutionCode: items[0].institutionCode,
      action: 'bulk_notification_created',
      details: { count: created.length, type },
    });

    return { created: created.length };
  }

  // ============================================================================
  // Send with template
  // ============================================================================
  async sendWithTemplate(
    institutionCode: string,
    type: string,
    recipientIds: string[],
    variables: Record<string, any>,
    opts: { priority?: NotificationPriority; data?: Record<string, any> } = {}
  ): Promise<{ created: number }> {
    if (recipientIds.length === 0) return { created: 0 };

    recipientIds = await repo.toFirebaseUids(institutionCode, recipientIds);
    if (recipientIds.length === 0) return { created: 0 };

    const { push, inApp } = await this.partitionRecipients(institutionCode, recipientIds, type);
    if (push.length === 0 && inApp.length === 0) return { created: 0 };

    const dbTemplate = await repo.getTemplateByType(institutionCode, type);
    const defaultTemplate = getDefaultTemplate(type);

    if (!dbTemplate && !defaultTemplate) {
      return { created: 0 };
    }

    const title = renderTitle(dbTemplate, defaultTemplate?.title || 'Notification', variables);
    const body = renderBody(dbTemplate, defaultTemplate?.body || '', variables);

    const notifications: NotificationPayload[] = [
      ...push.map((recipientId) => ({
        institutionCode,
        recipientId,
        title,
        body,
        type: type as NotificationType,
        priority: opts.priority || 'normal',
        channel: 'push' as const,
        data: { ...variables, ...opts.data },
      })),
      ...inApp.map((recipientId) => ({
        institutionCode,
        recipientId,
        title,
        body,
        type: type as NotificationType,
        priority: opts.priority || 'normal',
        channel: 'in_app' as const,
        data: { ...variables, ...opts.data },
      })),
    ];

    const created = await repo.createBulkNotifications(notifications);
    enqueueBatch(created.map((n) => n.id));

    return { created: created.length };
  }

  // ============================================================================
  // Resolve recipients from target
  // ============================================================================
  async resolveRecipients(institutionCode: string, target: CampaignTarget): Promise<string[]> {
    const userIds = new Set<string>();

    if (target.allUsers) {
      const allIds = await repo.getAllUserIds(institutionCode);
      allIds.forEach((id) => userIds.add(id));
    }

    if (target.userIds && target.userIds.length > 0) {
      const explicit = await repo.toFirebaseUids(institutionCode, target.userIds);
      explicit.forEach((id) => userIds.add(id));
    }

    if (target.roles && target.roles.length > 0) {
      const roleIds = await repo.getUserIdsByRole(institutionCode, target.roles);
      roleIds.forEach((id) => userIds.add(id));
    }

    if (target.classSectionIds && target.classSectionIds.length > 0) {
      const studentIds = await repo.getUserIdsByClass(institutionCode, target.classSectionIds);
      studentIds.forEach((id) => userIds.add(id));
    }

    return Array.from(userIds);
  }

  // ============================================================================
  // Campaigns
  // ============================================================================
  async createCampaign(payload: CreateCampaignPayload): Promise<string> {
    const recipients = await this.resolveRecipients(payload.institutionCode, payload.target);

    const campaign = await repo.createCampaign({
      institutionCode: payload.institutionCode,
      title: payload.title,
      body: payload.body,
      type: payload.type || 'announcement',
      priority: payload.priority || 'normal',
      channel: payload.channel || 'push',
      target: payload.target as any,
      scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : null,
      status: payload.scheduledAt ? 'scheduled' : 'draft',
      totalCount: recipients.length,
      createdBy: payload.createdBy,
    });

    await repo.logAudit({
      institutionCode: payload.institutionCode,
      action: 'campaign_created',
      campaignId: campaign.id,
      userId: payload.createdBy,
      details: { target: payload.target, recipientCount: recipients.length },
    });

    return campaign.id;
  }

  async launchCampaign(campaignId: string, institutionCode: string): Promise<{ created: number }> {
    const campaign = await repo.getCampaignById(campaignId, institutionCode);
    if (!campaign) {
      throw Object.assign(new Error('Campaign not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (campaign.status === 'completed' || campaign.status === 'running') {
      throw Object.assign(new Error('Campaign already launched'), { statusCode: 400, code: 'ALREADY_LAUNCHED' });
    }

    const target = (campaign.target as any) || {};
    const recipients = await this.resolveRecipients(institutionCode, target);

    if (recipients.length === 0) {
      throw Object.assign(new Error('No recipients found for campaign target'), { statusCode: 400, code: 'NO_RECIPIENTS' });
    }

    await repo.updateCampaign(campaignId, { status: 'running', totalCount: recipients.length });

    const result = await this.sendToUsers({
      institutionCode,
      recipientIds: recipients,
      title: campaign.title,
      body: campaign.body,
      type: campaign.type as NotificationType,
      priority: campaign.priority as NotificationPriority,
      channel: campaign.channel as any,
      data: { campaignId },
    });

    await repo.updateCampaign(campaignId, {
      status: 'completed',
      sentCount: result.created,
    });

    await repo.logAudit({
      institutionCode,
      action: 'campaign_launched',
      campaignId,
      details: { recipients: recipients.length, sent: result.created },
    });

    return { created: result.created };
  }

  // ============================================================================
  // Scheduler: launches campaigns whose scheduledAt has passed.
  // Called periodically by the notification queue loop.
  // ============================================================================
  async processDueCampaigns(limit: number = 20): Promise<number> {
    const due = await repo.getDueCampaigns(limit);
    if (due.length === 0) return 0;

    let processed = 0;
    for (const campaign of due) {
      try {
        await this.launchCampaign(campaign.id, campaign.institutionCode);
        processed++;
        console.log(`[Notifications] Launched scheduled campaign ${campaign.id}`);
      } catch (err: any) {
        await repo.updateCampaign(campaign.id, { status: 'failed' });
        await repo.logAudit({
          institutionCode: campaign.institutionCode,
          action: 'campaign_failed',
          campaignId: campaign.id,
          userId: campaign.createdBy || undefined,
          details: { error: err.message, scheduledAt: campaign.scheduledAt },
        });
        console.error(`[Notifications] Scheduled campaign ${campaign.id} failed:`, err.message);
      }
    }
    return processed;
  }

  // ============================================================================
  // User-facing queries
  // ============================================================================
  async getMyNotifications(
    userId: string,
    opts: { limit?: number; offset?: number; unreadOnly?: boolean; type?: string } = {}
  ) {
    return repo.getNotificationsByRecipient(userId, opts);
  }

  async getMyUnreadCount(userId: string): Promise<number> {
    return repo.getUnreadCount(userId);
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await repo.markAsRead(id, userId);
  }

  async markAllAsRead(userId: string): Promise<number> {
    return repo.markAllAsRead(userId);
  }

  // ============================================================================
  // Admin queries
  // ============================================================================
  async getStats(institutionCode: string) {
    return repo.getNotificationStats(institutionCode);
  }

  async getCampaigns(institutionCode: string, opts: { limit?: number; offset?: number; status?: string }) {
    return repo.getCampaigns(institutionCode, opts);
  }

  async getCampaignStats(institutionCode: string) {
    return repo.getCampaignStats(institutionCode);
  }

  // ============================================================================
  // Token management
  // ============================================================================
  async registerToken(userId: string, institutionCode: string, payload: RegisterTokenPayload) {
    return repo.registerPushToken(userId, institutionCode, payload.token, payload.platform, payload.deviceName);
  }

  async unregisterToken(token: string, userId: string) {
    await repo.unregisterPushToken(token, userId);
  }

  // ============================================================================
  // Preferences
  // ============================================================================
  async getPreferences(userId: string) {
    return (await repo.getPreferences(userId)) || { pushEnabled: true, disabledTypes: [] };
  }

  async updatePreferences(
    userId: string,
    institutionCode: string,
    prefs: { pushEnabled?: boolean; disabledTypes?: string[] }
  ) {
    return repo.upsertPreferences(userId, institutionCode, prefs);
  }

  // ============================================================================
  // Templates
  // ============================================================================
  async getTemplates(institutionCode: string, type?: string) {
    return repo.getTemplates(institutionCode, type);
  }

  async upsertTemplate(payload: any) {
    return repo.upsertTemplate(payload);
  }

  // ============================================================================
  // Cleanup
  // ============================================================================
  async deleteOldNotifications(institutionCode: string, daysOld: number = 90): Promise<number> {
    return repo.deleteOldNotifications(institutionCode, daysOld);
  }
}

export const notificationService = new NotificationService();
