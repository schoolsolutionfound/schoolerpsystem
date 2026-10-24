import { db } from '../shared/db/index.js';
import { counselingRecords, CounselingRecordEntity, NewCounselingRecordEntity } from '../shared/db/schema.js';
import { eq, and, desc } from 'drizzle-orm';

function getDb() {
  if (!db) {
    const err: any = new Error('Database unavailable');
    err.statusCode = 500;
    throw err;
  }
  return db;
}

export interface CreateCounselingInput {
  studentId: string;
  studentName: string;
  gradeSection?: string;
  counselorId: string;
  counselorName: string;
  concernCategory: string;
  severity?: string;
  actionPlan?: string;
  parentContacted?: boolean;
  status?: string;
  date: string;
  lastFollowUpDate?: string;
}

export interface UpdateCounselingInput {
  status?: string;
  actionPlan?: string;
  lastFollowUpDate?: string;
  parentContacted?: boolean;
}

export class CounselingService {
  async listRecords(institutionCode: string): Promise<CounselingRecordEntity[]> {
    const database = getDb();
    return await database
      .select()
      .from(counselingRecords)
      .where(eq(counselingRecords.institutionCode, institutionCode))
      .orderBy(desc(counselingRecords.date));
  }

  async createRecord(
    institutionCode: string,
    input: CreateCounselingInput
  ): Promise<CounselingRecordEntity> {
    const database = getDb();
    const [created] = await database
      .insert(counselingRecords)
      .values({
        institutionCode,
        studentId: input.studentId,
        studentName: input.studentName,
        gradeSection: input.gradeSection || '',
        counselorId: input.counselorId,
        counselorName: input.counselorName,
        concernCategory: input.concernCategory,
        severity: input.severity || 'medium',
        actionPlan: input.actionPlan || '',
        parentContacted: input.parentContacted ?? false,
        status: input.status || 'active',
        date: input.date,
        lastFollowUpDate: input.lastFollowUpDate || null,
      })
      .returning();

    return created;
  }

  async updateRecord(
    institutionCode: string,
    id: string,
    input: UpdateCounselingInput
  ): Promise<CounselingRecordEntity | null> {
    const database = getDb();
    const updates: Partial<NewCounselingRecordEntity> = {
      updatedAt: new Date(),
    };
    if (input.status !== undefined) updates.status = input.status;
    if (input.actionPlan !== undefined) updates.actionPlan = input.actionPlan;
    if (input.lastFollowUpDate !== undefined) updates.lastFollowUpDate = input.lastFollowUpDate;
    if (input.parentContacted !== undefined) updates.parentContacted = input.parentContacted;

    const [updated] = await database
      .update(counselingRecords)
      .set(updates)
      .where(
        and(
          eq(counselingRecords.id, id),
          eq(counselingRecords.institutionCode, institutionCode)
        )
      )
      .returning();

    return updated || null;
  }
}

export const counselingService = new CounselingService();
