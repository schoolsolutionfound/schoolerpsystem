import { notificationService } from './notification.service.js';
import * as repo from './notification.repository.js';
import { NotificationPayload } from './notification.types.js';
import { db } from '../shared/db/index.js';
import * as schema from '../shared/db/schema.js';
import { and, eq, inArray, or } from 'drizzle-orm';

/**
 * Fire-and-forget notification triggers wired into existing backend events.
 *
 * Rules:
 *  - Never throw: a notification failure must never fail the business action.
 *  - Never block the response: work runs in the background.
 *  - Recipients are resolved to Firebase uids inside the service.
 */

function fire(label: string, fn: () => Promise<unknown>): void {
  fn().catch((err: any) => {
    console.warn(`[NotificationTrigger:${label}] ${err?.message || err}`);
  });
}

// ---------------------------------------------------------------------------
// Fee
// ---------------------------------------------------------------------------
export function notifyFeePaid(params: {
  institutionCode: string;
  studentId: string;
  studentName?: string;
  amount: string | number;
  receiptNo?: string;
  paymentId?: string;
}): void {
  fire('feePaid', async () => {
    const recipients = await repo.getFamilyRecipients(params.institutionCode, [params.studentId]);
    if (recipients.length === 0) return;

    const amount = String(params.amount);
    await notificationService.sendToUsers({
      institutionCode: params.institutionCode,
      recipientIds: recipients,
      title: `Payment Received: ₹${amount}`,
      body: `Payment of ₹${amount} received${params.receiptNo ? `. Receipt: ${params.receiptNo}` : '.'}`,
      type: 'fee',
      priority: 'normal',
      data: {
        amount,
        receiptNo: params.receiptNo || '',
        studentName: params.studentName || 'your child',
        paymentId: params.paymentId || '',
      },
    });
  });
}

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------
export function notifyAttendanceMarked(params: {
  institutionCode: string;
  studentId: string;
  status: string;
  studentName?: string;
  date: string;
  subject?: string;
  className?: string;
  remarks?: string;
}): void {
  const status = (params.status || '').toLowerCase();
  if (status !== 'absent' && status !== 'late') return;

  fire('attendance', async () => {
    const recipients = await repo.getFamilyRecipients(params.institutionCode, [params.studentId]);
    if (recipients.length === 0) return;

    const studentName = params.studentName || 'Your child';
    const isAbsent = status === 'absent';
    const subject = params.subject || 'class';
    const className = params.className || '';

    await notificationService.sendToUsers({
      institutionCode: params.institutionCode,
      recipientIds: recipients,
      title: isAbsent
        ? `Attendance Alert: ${studentName} was absent`
        : `Late Arrival: ${studentName}`,
      body: isAbsent
        ? `${studentName} was marked absent for ${subject} on ${params.date}${className ? `. Class: ${className}` : ''}.`
        : `${studentName} arrived late for ${subject} on ${params.date}${className ? `. Class: ${className}` : ''}.`,
      type: 'attendance',
      priority: isAbsent ? 'high' : 'normal',
      data: {
        studentName,
        date: params.date,
        subject,
        className,
        status,
        remarks: params.remarks || '',
      },
    });
  });
}

/**
 * Batch attendance trigger: one lookup pass for the slot, subject, class and
 * student names, then a single bulk insert for every absent/late family.
 */
export function notifyAttendanceForSlot(params: {
  institutionCode: string;
  timetableSlotId: string;
  date: string;
  entries: { studentId: string; attendanceStatus: string; remarks?: string }[];
}): void {
  fire('attendanceSlot', async () => {
    const flagged = params.entries.filter((e) => {
      const status = (e.attendanceStatus || '').toLowerCase();
      return status === 'absent' || status === 'late';
    });
    if (flagged.length === 0 || !db) return;

    const [slot] = await db
      .select()
      .from(schema.timetableSlots)
      .where(eq(schema.timetableSlots.id, params.timetableSlotId))
      .limit(1);

    const subjectName = slot ? await lookupName(schema.subjects, slot.subjectId) : '';
    const className = slot ? await lookupName(schema.classSections, slot.classSectionId) : '';

    const identifiers = flagged.map((f) => f.studentId);
    const [familyMap, studentNames] = await Promise.all([
      repo.getFamilyRecipientMap(params.institutionCode, identifiers),
      lookupUserNames(params.institutionCode, identifiers),
    ]);

    const items: NotificationPayload[] = [];
    for (const entry of flagged) {
      const recipients = familyMap.get(entry.studentId);
      if (!recipients?.length) continue;

      const status = (entry.attendanceStatus || '').toLowerCase();
      const isAbsent = status === 'absent';
      const studentName = studentNames.get(entry.studentId) || 'Your child';
      const subject = subjectName || 'class';
      const title = isAbsent
        ? `Attendance Alert: ${studentName} was absent`
        : `Late Arrival: ${studentName}`;
      const body = isAbsent
        ? `${studentName} was marked absent for ${subject} on ${params.date}${className ? `. Class: ${className}` : ''}.`
        : `${studentName} arrived late for ${subject} on ${params.date}${className ? `. Class: ${className}` : ''}.`;

      for (const recipientId of recipients) {
        items.push({
          institutionCode: params.institutionCode,
          recipientId,
          title,
          body,
          type: 'attendance',
          priority: isAbsent ? 'high' : 'normal',
          data: {
            studentName,
            date: params.date,
            subject,
            className,
            status,
            remarks: entry.remarks || '',
          },
        });
      }
    }

    if (items.length > 0) {
      await notificationService.sendIndividualMessages(items);
    }
  });
}

async function lookupName(table: any, id: string): Promise<string> {
  if (!db || !id) return '';
  try {
    const rows = await db
      .select({ name: table.name })
      .from(table)
      .where(eq(table.id, id))
      .limit(1);
    return rows[0]?.name || '';
  } catch {
    return '';
  }
}

async function lookupUserNames(
  institutionCode: string,
  identifiers: string[]
): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  if (!db) return names;
  const unique = Array.from(new Set(identifiers.filter(Boolean)));
  if (unique.length === 0) return names;

  const rows = await db
    .select({ id: schema.users.id, firebaseUid: schema.users.firebaseUid, fullName: schema.users.fullName })
    .from(schema.users)
    .where(
      or(
        inArray(schema.users.id, unique),
        inArray(schema.users.firebaseUid, unique)
      ) as any
    );
  for (const row of rows) {
    names.set(row.id, row.fullName);
    names.set(row.firebaseUid, row.fullName);
  }
  return names;
}

// ---------------------------------------------------------------------------
// Homework
// ---------------------------------------------------------------------------
export function notifyHomeworkAssigned(params: {
  institutionCode: string;
  classSectionId: string;
  title: string;
  subject?: string;
  subjectId?: string;
  dueDate: string;
  teacherName?: string;
  className?: string;
  priority?: string;
}): void {
  fire('homework', async () => {
    const recipients = await repo.getClassFamilyRecipients(params.institutionCode, [
      params.classSectionId,
    ]);
    if (recipients.length === 0) return;

    const subject =
      params.subject || (params.subjectId ? await lookupName(schema.subjects, params.subjectId) : '') || 'a subject';
    const className =
      params.className || (await lookupName(schema.classSections, params.classSectionId));
    const teacherName = params.teacherName || 'Your teacher';

    await notificationService.sendToUsers({
      institutionCode: params.institutionCode,
      recipientIds: recipients,
      title: `New Homework: ${subject}`,
      body: `${teacherName} assigned homework in ${subject}${className ? ` for ${className}` : ''}. Due: ${params.dueDate}. ${params.title}`,
      type: 'homework',
      priority: (params.priority as any) || 'normal',
      data: {
        title: params.title,
        subject,
        dueDate: params.dueDate,
        teacherName,
        className,
      },
    });
  });
}

// ---------------------------------------------------------------------------
// Exams
// ---------------------------------------------------------------------------
export function notifyExamPublished(params: {
  institutionCode: string;
  classSectionIds: string[];
  examName: string;
  term?: string;
}): void {
  fire('examPublished', async () => {
    if (!params.classSectionIds?.length) return;
    const recipients = await repo.getClassFamilyRecipients(
      params.institutionCode,
      params.classSectionIds
    );
    if (recipients.length === 0) return;

    await notificationService.sendToUsers({
      institutionCode: params.institutionCode,
      recipientIds: recipients,
      title: `Results Published: ${params.examName}`,
      body: `The results for ${params.examName} have been published. Check your marks now.`,
      type: 'exam',
      priority: 'high',
      data: { examName: params.examName, term: params.term || '' },
    });
  });
}

/**
 * Exam results published: discovers the affected classes from entered marks,
 * then notifies every student family in those classes.
 */
export function notifyExamPublishedForExam(params: {
  institutionCode: string;
  examId: string;
  examName?: string;
  term?: string;
}): void {
  fire('examPublished', async () => {
    if (!db) return;

    const examName =
      params.examName || (await lookupName(schema.exams, params.examId));
    if (!examName) return;

    const classRows = await db
      .selectDistinct({ classSectionId: schema.marks.classSectionId })
      .from(schema.marks)
      .where(
        and(
          eq(schema.marks.institutionCode, params.institutionCode),
          eq(schema.marks.examId, params.examId)
        )
      );
    const classSectionIds = classRows.map((r) => r.classSectionId).filter(Boolean);
    if (classSectionIds.length === 0) return;

    const recipients = await repo.getClassFamilyRecipients(
      params.institutionCode,
      classSectionIds
    );
    if (recipients.length === 0) return;

    await notificationService.sendToUsers({
      institutionCode: params.institutionCode,
      recipientIds: recipients,
      title: `Results Published: ${examName}`,
      body: `The results for ${examName} have been published. Check your marks now.`,
      type: 'exam',
      priority: 'high',
      data: { examName, term: params.term || '' },
    });
  });
}

// ---------------------------------------------------------------------------
// Announcement (class-scoped)
// ---------------------------------------------------------------------------
export function notifyClassAnnouncement(params: {
  institutionCode: string;
  classSectionIds: string[];
  title: string;
  body: string;
  priority?: string;
}): void {
  fire('classAnnouncement', async () => {
    if (!params.classSectionIds?.length) return;
    const recipients = await repo.getClassFamilyRecipients(
      params.institutionCode,
      params.classSectionIds
    );
    if (recipients.length === 0) return;

    await notificationService.sendToUsers({
      institutionCode: params.institutionCode,
      recipientIds: recipients,
      title: params.title,
      body: params.body,
      type: 'announcement',
      priority: (params.priority as any) || 'normal',
      data: { title: params.title, body: params.body },
    });
  });
}

// ---------------------------------------------------------------------------
// Institution-wide announcement (uses campaign pipeline so counts are tracked)
// ---------------------------------------------------------------------------
export function notifyInstitutionAnnouncement(params: {
  institutionCode: string;
  createdBy: string;
  title: string;
  body: string;
  priority?: string;
}): void {
  fire('institutionAnnouncement', async () => {
    const campaignId = await notificationService.createCampaign({
      institutionCode: params.institutionCode,
      createdBy: params.createdBy,
      title: params.title,
      body: params.body,
      type: 'announcement',
      priority: (params.priority as any) || 'normal',
      channel: 'push',
      target: { allUsers: true },
    });
    await notificationService.launchCampaign(campaignId, params.institutionCode);
  });
}
