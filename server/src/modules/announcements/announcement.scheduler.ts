import { announcementService } from './announcement.service.js';

const SWEEP_INTERVAL_MS = 10_000;

let timer: NodeJS.Timeout | null = null;

async function sweep(): Promise<void> {
  try {
    const promoted = await announcementService.publishDueScheduledAnnouncements();
    if (promoted > 0) {
      console.log(`[Announcements] Promoted ${promoted} scheduled announcement(s) to PUBLISHED`);
    }
  } catch (err: any) {
    console.warn('[Announcements] Scheduled publish sweep failed:', err?.message || err);
  }
}

export function startAnnouncementScheduler(): void {
  if (timer) return;
  void sweep();
  timer = setInterval(() => void sweep(), SWEEP_INTERVAL_MS);
}

export function stopAnnouncementScheduler(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
