import { eq, and, desc, sql, gte, lte, inArray, count } from 'drizzle-orm';
import { db } from '../shared/db/index.js';
import {
  classSections,
  subjects,
  subjectTeachers,
  periods,
  timetables,
  studentClasses,
  exams,
  examSubjects,
  marks,
  timetableSlots,
  attendanceRecords,
  attendanceEntries,
  homework,
  ClassSectionRecord,
  SubjectRecord,
  SubjectTeacherRecord,
  PeriodRecord,
  TimetableRecord,
  TimetableSlotRecord,
  AttendanceRecordRecord,
  AttendanceEntryRecord,
  ExamRecord,
  ExamSubjectRecord,
  MarkRecord,
  HomeworkRecord,
} from '../shared/db/schema.js';

function toClassSection(r: ClassSectionRecord): ClassSectionRecord {
  return {
    id: r.id,
    institutionCode: r.institutionCode,
    name: r.name,
    department: r.department || '',
    academicYear: r.academicYear || '',
    section: r.section || '',
    classTeacherId: r.classTeacherId || '',
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function toSubject(r: SubjectRecord): SubjectRecord {
  return { id: r.id, institutionCode: r.institutionCode, name: r.name, code: r.code || '', createdAt: r.createdAt, updatedAt: r.updatedAt };
}

function toSubjectTeacher(r: SubjectTeacherRecord): SubjectTeacherRecord {
  return {
    id: r.id,
    institutionCode: r.institutionCode,
    classSectionId: r.classSectionId,
    subjectId: r.subjectId,
    teacherId: r.teacherId,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function toPeriod(r: PeriodRecord): PeriodRecord {
  return {
    id: r.id,
    institutionCode: r.institutionCode,
    label: r.label,
    startTime: r.startTime,
    endTime: r.endTime,
    sortOrder: r.sortOrder ?? 0,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function toTimetable(r: TimetableRecord): TimetableRecord {
  return {
    id: r.id,
    institutionCode: r.institutionCode,
    classSectionId: r.classSectionId,
    academicYear: r.academicYear || '',
    term: r.term || '',
    version: r.version,
    effectiveFrom: r.effectiveFrom,
    createdBy: r.createdBy,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function toTimetableSlot(r: TimetableSlotRecord): TimetableSlotRecord {
  return {
    id: r.id,
    timetableId: r.timetableId,
    institutionCode: r.institutionCode,
    classSectionId: r.classSectionId,
    subjectId: r.subjectId,
    teacherId: r.teacherId,
    periodId: r.periodId,
    dayOfWeek: r.dayOfWeek,
    room: r.room || '',
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function toAttendanceRecord(r: AttendanceRecordRecord): AttendanceRecordRecord {
  return {
    id: r.id,
    institutionCode: r.institutionCode,
    timetableSlotId: r.timetableSlotId,
    date: r.date,
    takenByTeacherId: r.takenByTeacherId,
    status: r.status || 'submitted',
    submittedAt: r.submittedAt,
    lockedAt: r.lockedAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function toAttendanceEntry(r: AttendanceEntryRecord): AttendanceEntryRecord {
  return {
    id: r.id,
    attendanceRecordId: r.attendanceRecordId,
    studentId: r.studentId,
    attendanceStatus: r.attendanceStatus || 'present',
    remarks: r.remarks || '',
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

class InMemoryStore<T extends { id: string }> {
  private store = new Map<string, T>();
  public save(item: T): T { this.store.set(item.id, item); return item; }
  public getAll(): T[] { return Array.from(this.store.values()); }
  public getById(id: string): T | undefined { return this.store.get(id); }
  public filter(pred: (item: T) => boolean): T[] { return this.getAll().filter(pred); }
  public delete(id: string): boolean { return this.store.delete(id); }
  public clear() { this.store.clear(); }
}

const classSectionMem = new InMemoryStore<ClassSectionRecord>();
const subjectMem = new InMemoryStore<SubjectRecord>();
const subjectTeacherMem = new InMemoryStore<SubjectTeacherRecord>();
const periodMem = new InMemoryStore<PeriodRecord>();
const timetableMem = new InMemoryStore<TimetableRecord>();
const timetableSlotMem = new InMemoryStore<TimetableSlotRecord>();
const attendanceRecordMem = new InMemoryStore<AttendanceRecordRecord>();
const examMem = new InMemoryStore<ExamRecord>();
const examSubjectMem = new InMemoryStore<ExamSubjectRecord>();
const markMem = new InMemoryStore<MarkRecord>();
const attendanceEntryMem = new InMemoryStore<AttendanceEntryRecord>();

export class AcademicsRepository {
  // ---------- Class Sections ----------
  public async listClassSections(institutionCode: string): Promise<ClassSectionRecord[]> {
    if (db) {
      try {
        const rows = await db.select().from(classSections).where(eq(classSections.institutionCode, institutionCode));
        rows.forEach((r) => classSectionMem.save(toClassSection(r)));
        return rows;
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] listClassSections failed:', err.message);
      }
    }
    return classSectionMem.filter((r) => r.institutionCode.toLowerCase() === institutionCode.toLowerCase());
  }

  public async getClassSectionById(id: string): Promise<ClassSectionRecord | undefined> {
    if (db) {
      try {
        const rows = await db.select().from(classSections).where(eq(classSections.id, id)).limit(1);
        if (rows.length > 0) {
          const rec = toClassSection(rows[0]);
          classSectionMem.save(rec);
          return rec;
        }
        return undefined;
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] getClassSectionById failed:', err.message);
      }
    }
    return classSectionMem.getById(id);
  }

  public async createClassSection(data: any): Promise<ClassSectionRecord> {
    const record: ClassSectionRecord = {
      id: data.id || `cs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      institutionCode: data.institutionCode,
      name: data.name,
      department: data.department || '',
      academicYear: data.academicYear || '',
      section: data.section || '',
      classTeacherId: data.classTeacherId || '',
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
    };
    classSectionMem.save(record);
    if (db) {
      try {
        const [inserted] = await db.insert(classSections).values(record).onConflictDoNothing().returning();
        if (inserted) return toClassSection(inserted);
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] createClassSection failed:', err.message);
      }
    }
    return record;
  }

  public async updateClassSection(id: string, data: any): Promise<ClassSectionRecord | undefined> {
    const existing = classSectionMem.getById(id);
    const updated: ClassSectionRecord = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date(),
    } as ClassSectionRecord;
    classSectionMem.save(updated);
    if (db) {
      try {
        const [row] = await db
          .update(classSections)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(classSections.id, id))
          .returning();
        if (row) return toClassSection(row);
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] updateClassSection failed:', err.message);
      }
    }
    return updated;
  }

  public async deleteClassSection(id: string): Promise<boolean> {
    classSectionMem.delete(id);
    if (db) {
      try {
        await db.delete(classSections).where(eq(classSections.id, id));
        return true;
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] deleteClassSection failed:', err.message);
      }
    }
    return true;
  }

  // ---------- Subjects ----------
  public async listSubjects(institutionCode: string): Promise<SubjectRecord[]> {
    if (db) {
      try {
        const rows = await db.select().from(subjects).where(eq(subjects.institutionCode, institutionCode));
        rows.forEach((r) => subjectMem.save(toSubject(r)));
        return rows;
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] listSubjects failed:', err.message);
      }
    }
    return subjectMem.filter((r) => r.institutionCode.toLowerCase() === institutionCode.toLowerCase());
  }

  public async getSubjectById(id: string): Promise<SubjectRecord | undefined> {
    if (db) {
      try {
        const rows = await db.select().from(subjects).where(eq(subjects.id, id)).limit(1);
        if (rows.length > 0) {
          const rec = toSubject(rows[0]);
          subjectMem.save(rec);
          return rec;
        }
        return undefined;
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] getSubjectById failed:', err.message);
      }
    }
    return subjectMem.getById(id);
  }

  public async createSubject(data: any): Promise<SubjectRecord> {
    const record: SubjectRecord = {
      id: data.id || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      institutionCode: data.institutionCode,
      name: data.name,
      code: data.code || '',
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
    };
    subjectMem.save(record);
    if (db) {
      try {
        const [inserted] = await db.insert(subjects).values(record).onConflictDoNothing().returning();
        if (inserted) return toSubject(inserted);
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] createSubject failed:', err.message);
      }
    }
    return record;
  }

  // ---------- Subject Teachers ----------
  public async listSubjectTeachers(institutionCode: string, classSectionId?: string, teacherId?: string): Promise<SubjectTeacherRecord[]> {
    if (db) {
      try {
        const conditions = [eq(subjectTeachers.institutionCode, institutionCode)];
        if (classSectionId) conditions.push(eq(subjectTeachers.classSectionId, classSectionId));
        if (teacherId) conditions.push(eq(subjectTeachers.teacherId, teacherId));
        const rows = await db.select().from(subjectTeachers).where(and(...conditions));
        rows.forEach((r) => subjectTeacherMem.save(toSubjectTeacher(r)));
        return rows;
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] listSubjectTeachers failed:', err.message);
      }
    }
    return subjectTeacherMem.filter((r) => {
      const okInst = r.institutionCode.toLowerCase() === institutionCode.toLowerCase();
      const okClass = classSectionId ? r.classSectionId === classSectionId : true;
      const okTeacher = teacherId ? r.teacherId === teacherId : true;
      return okInst && okClass && okTeacher;
    });
  }

  public async getSubjectTeacherById(id: string): Promise<SubjectTeacherRecord | undefined> {
    if (db) {
      try {
        const rows = await db.select().from(subjectTeachers).where(eq(subjectTeachers.id, id)).limit(1);
        if (rows.length > 0) {
          const rec = toSubjectTeacher(rows[0]);
          subjectTeacherMem.save(rec);
          return rec;
        }
        return undefined;
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] getSubjectTeacherById failed:', err.message);
      }
    }
    return subjectTeacherMem.getById(id);
  }

  public async createSubjectTeacher(data: any): Promise<SubjectTeacherRecord> {
    const record: SubjectTeacherRecord = {
      id: data.id || `st_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      institutionCode: data.institutionCode,
      classSectionId: data.classSectionId,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
    };
    subjectTeacherMem.save(record);
    if (db) {
      try {
        const [inserted] = await db.insert(subjectTeachers).values(record).onConflictDoNothing().returning();
        if (inserted) return toSubjectTeacher(inserted);
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] createSubjectTeacher failed:', err.message);
      }
    }
    return record;
  }

  public async deleteSubjectTeacher(id: string): Promise<boolean> {
    subjectTeacherMem.delete(id);
    if (db) {
      try {
        await db.delete(subjectTeachers).where(eq(subjectTeachers.id, id));
        return true;
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] deleteSubjectTeacher failed:', err.message);
      }
    }
    return true;
  }

  public async updateSubjectTeacher(id: string, data: { teacherId: string }): Promise<SubjectTeacherRecord | undefined> {
    const existing = subjectTeacherMem.getById(id);
    if (!existing) return undefined;
    const updated: SubjectTeacherRecord = {
      ...existing,
      teacherId: data.teacherId,
      updatedAt: new Date(),
    };
    subjectTeacherMem.save(updated);
    if (db) {
      try {
        const [row] = await db
          .update(subjectTeachers)
          .set({ teacherId: data.teacherId, updatedAt: new Date() })
          .where(eq(subjectTeachers.id, id))
          .returning();
        if (row) return toSubjectTeacher(row);
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] updateSubjectTeacher failed:', err.message);
      }
    }
    return updated;
  }

  public async reassignTimetableSlotsForSubjectTeacher(
    institutionCode: string,
    classSectionId: string,
    subjectId: string,
    newTeacherId: string
  ): Promise<number> {
    let updated = 0;
    const matches = timetableSlotMem.filter(
      (s) => s.institutionCode.toLowerCase() === institutionCode.toLowerCase()
        && s.classSectionId === classSectionId
        && s.subjectId === subjectId
    );
    for (const slot of matches) {
      const next: TimetableSlotRecord = { ...slot, teacherId: newTeacherId, updatedAt: new Date() };
      timetableSlotMem.save(next);
      updated++;
    }
    if (db) {
      try {
        const result = await db
          .update(timetableSlots)
          .set({ teacherId: newTeacherId, updatedAt: new Date() })
          .where(
            and(
              eq(timetableSlots.institutionCode, institutionCode),
              eq(timetableSlots.classSectionId, classSectionId),
              eq(timetableSlots.subjectId, subjectId)
            )
          )
          .returning({ id: timetableSlots.id });
        if (Array.isArray(result) && result.length > 0) updated = result.length;
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] reassignTimetableSlotsForSubjectTeacher failed:', err.message);
      }
    }
    return updated;
  }

  // ---------- Periods ----------
  public async listPeriods(institutionCode: string): Promise<PeriodRecord[]> {
    if (db) {
      try {
        const rows = await db
          .select()
          .from(periods)
          .where(eq(periods.institutionCode, institutionCode))
          .orderBy(sql`${periods.sortOrder} asc, ${periods.startTime} asc`);
        rows.forEach((r) => periodMem.save(toPeriod(r)));
        return rows;
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] listPeriods failed:', err.message);
      }
    }
    return periodMem
      .filter((r) => r.institutionCode.toLowerCase() === institutionCode.toLowerCase())
      .sort((a, b) => a.sortOrder - b.sortOrder || a.startTime.localeCompare(b.startTime));
  }

  public async getPeriodById(id: string): Promise<PeriodRecord | undefined> {
    if (db) {
      try {
        const rows = await db.select().from(periods).where(eq(periods.id, id)).limit(1);
        if (rows.length > 0) {
          const rec = toPeriod(rows[0]);
          periodMem.save(rec);
          return rec;
        }
        return undefined;
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] getPeriodById failed:', err.message);
      }
    }
    return periodMem.getById(id);
  }

  public async createPeriod(data: any): Promise<PeriodRecord> {
    const record: PeriodRecord = {
      id: data.id || `per_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      institutionCode: data.institutionCode,
      label: data.label,
      startTime: data.startTime,
      endTime: data.endTime,
      sortOrder: data.sortOrder ?? 0,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
    };
    periodMem.save(record);
    if (db) {
      try {
        const [inserted] = await db.insert(periods).values(record).onConflictDoNothing().returning();
        if (inserted) return toPeriod(inserted);
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] createPeriod failed:', err.message);
      }
    }
    return record;
  }

  // ---------- Timetables ----------
  public async getLatestTimetable(classSectionId: string): Promise<TimetableRecord | undefined> {
    if (db) {
      try {
        const rows = await db
          .select()
          .from(timetables)
          .where(eq(timetables.classSectionId, classSectionId))
          .orderBy(desc(timetables.version))
          .limit(1);
        if (rows.length > 0) {
          const rec = toTimetable(rows[0]);
          timetableMem.save(rec);
          return rec;
        }
        return undefined;
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] getLatestTimetable failed:', err.message);
      }
    }
    return timetableMem
      .filter((r) => r.classSectionId === classSectionId)
      .sort((a, b) => b.version - a.version)[0];
  }

  public async getTimetableById(id: string): Promise<TimetableRecord | undefined> {
    if (db) {
      try {
        const rows = await db.select().from(timetables).where(eq(timetables.id, id)).limit(1);
        if (rows.length > 0) {
          const rec = toTimetable(rows[0]);
          timetableMem.save(rec);
          return rec;
        }
        return undefined;
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] getTimetableById failed:', err.message);
      }
    }
    return timetableMem.getById(id);
  }

  public async listTimetablesForClass(classSectionId: string): Promise<TimetableRecord[]> {
    if (db) {
      try {
        const rows = await db
          .select()
          .from(timetables)
          .where(eq(timetables.classSectionId, classSectionId))
          .orderBy(desc(timetables.version));
        rows.forEach((r) => timetableMem.save(toTimetable(r)));
        return rows;
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] listTimetablesForClass failed:', err.message);
      }
    }
    return timetableMem.filter((r) => r.classSectionId === classSectionId).sort((a, b) => b.version - a.version);
  }

  public async getEffectiveTimetable(classSectionId: string, dateStr: string): Promise<TimetableRecord | undefined> {
    const dateISO = new Date(`${dateStr}T00:00:00Z`);
    if (db) {
      try {
        const rows = await db
          .select()
          .from(timetables)
          .where(and(eq(timetables.classSectionId, classSectionId), sql`${timetables.effectiveFrom} <= ${dateISO.toISOString().slice(0, 10)}`))
          .orderBy(desc(timetables.version))
          .limit(1);
        if (rows.length > 0) {
          const rec = toTimetable(rows[0]);
          timetableMem.save(rec);
          return rec;
        }
        return undefined;
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] getEffectiveTimetable failed:', err.message);
      }
    }
    const dateKey = dateISO.toISOString().slice(0, 10);
    return timetableMem
      .filter((r) => r.classSectionId === classSectionId && r.effectiveFrom <= dateKey)
      .sort((a, b) => b.version - a.version)[0];
  }

  public async listTimetablesInInstitution(institutionCode: string): Promise<TimetableRecord[]> {
    if (db) {
      try {
        const rows = await db.select().from(timetables).where(eq(timetables.institutionCode, institutionCode));
        rows.forEach((r) => timetableMem.save(toTimetable(r)));
        return rows;
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] listTimetablesInInstitution failed:', err.message);
      }
    }
    return timetableMem.filter((r) => r.institutionCode.toLowerCase() === institutionCode.toLowerCase());
  }

  public async getMaxTimetableVersion(classSectionId: string): Promise<number> {
    if (db) {
      try {
        const rows = await db
          .select({ maxVersion: sql<number>`coalesce(max(${timetables.version}), 0)` })
          .from(timetables)
          .where(eq(timetables.classSectionId, classSectionId));
        return Number(rows[0]?.maxVersion || 0);
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] getMaxTimetableVersion failed:', err.message);
      }
    }
    const versions = timetableMem.filter((r) => r.classSectionId === classSectionId).map((r) => r.version);
    return versions.length > 0 ? Math.max(...versions) : 0;
  }

  public async createTimetable(data: any): Promise<TimetableRecord> {
    const record: TimetableRecord = {
      id: data.id || `tt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      institutionCode: data.institutionCode,
      classSectionId: data.classSectionId,
      academicYear: data.academicYear || '',
      term: data.term || '',
      version: data.version,
      effectiveFrom: data.effectiveFrom,
      createdBy: data.createdBy,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
    };
    timetableMem.save(record);
    if (db) {
      try {
        const [inserted] = await db.insert(timetables).values(record).onConflictDoNothing().returning();
        if (inserted) return toTimetable(inserted);
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] createTimetable failed:', err.message);
      }
    }
    return record;
  }

  // ---------- Timetable Slots ----------
  public async listSlotsForTimetable(timetableId: string): Promise<TimetableSlotRecord[]> {
    if (db) {
      try {
        const rows = await db.select().from(timetableSlots).where(eq(timetableSlots.timetableId, timetableId));
        rows.forEach((r) => timetableSlotMem.save(toTimetableSlot(r)));
        return rows;
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] listSlotsForTimetable failed:', err.message);
      }
    }
    return timetableSlotMem.filter((r) => r.timetableId === timetableId);
  }

  public async getTimetableSlotById(id: string): Promise<TimetableSlotRecord | undefined> {
    if (db) {
      try {
        const rows = await db.select().from(timetableSlots).where(eq(timetableSlots.id, id)).limit(1);
        if (rows.length > 0) {
          const rec = toTimetableSlot(rows[0]);
          timetableSlotMem.save(rec);
          return rec;
        }
        return undefined;
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] getTimetableSlotById failed:', err.message);
      }
    }
    return timetableSlotMem.getById(id);
  }

  public async listSlotsForTeacherOnDay(teacherId: string, dayOfWeek: number): Promise<TimetableSlotRecord[]> {
    if (db) {
      try {
        const rows = await db
          .select()
          .from(timetableSlots)
          .where(and(eq(timetableSlots.teacherId, teacherId), eq(timetableSlots.dayOfWeek, dayOfWeek)));
        rows.forEach((r) => timetableSlotMem.save(toTimetableSlot(r)));
        return rows;
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] listSlotsForTeacherOnDay failed:', err.message);
      }
    }
    return timetableSlotMem.filter((r) => r.teacherId === teacherId && r.dayOfWeek === dayOfWeek);
  }

  public async listSlotsForClassOnDay(classSectionId: string, dayOfWeek: number): Promise<TimetableSlotRecord[]> {
    if (db) {
      try {
        const rows = await db
          .select()
          .from(timetableSlots)
          .where(and(eq(timetableSlots.classSectionId, classSectionId), eq(timetableSlots.dayOfWeek, dayOfWeek)));
        rows.forEach((r) => timetableSlotMem.save(toTimetableSlot(r)));
        return rows;
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] listSlotsForClassOnDay failed:', err.message);
      }
    }
    return timetableSlotMem.filter((r) => r.classSectionId === classSectionId && r.dayOfWeek === dayOfWeek);
  }

  public async replaceSlotsForTimetable(timetableId: string, slots: any[]): Promise<TimetableSlotRecord[]> {
    if (db) {
      try {
        await db.delete(timetableSlots).where(eq(timetableSlots.timetableId, timetableId));
        if (slots.length > 0) {
          const rows = slots.map((s) => ({ ...s, timetableId }));
          const inserted = await db.insert(timetableSlots).values(rows).returning();
          inserted.forEach((r) => timetableSlotMem.save(toTimetableSlot(r)));
          return inserted;
        }
        return [];
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] replaceSlotsForTimetable failed:', err.message);
      }
    }
    for (const existing of timetableSlotMem.filter((r) => r.timetableId === timetableId)) {
      timetableSlotMem.delete(existing.id);
    }
    const saved = slots.map((s) => {
      const rec: TimetableSlotRecord = {
        id: s.id || `ts_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timetableId,
        institutionCode: s.institutionCode,
        classSectionId: s.classSectionId,
        subjectId: s.subjectId,
        teacherId: s.teacherId,
        periodId: s.periodId,
        dayOfWeek: s.dayOfWeek,
        room: s.room || '',
        createdAt: s.createdAt || new Date(),
        updatedAt: s.updatedAt || new Date(),
      };
      return timetableSlotMem.save(rec);
    });
    return saved;
  }

  // ---------- Attendance Records ----------
  public async getAttendanceRecord(timetableSlotId: string, date: string): Promise<AttendanceRecordRecord | undefined> {
    if (db) {
      try {
        const rows = await db
          .select()
          .from(attendanceRecords)
          .where(and(eq(attendanceRecords.timetableSlotId, timetableSlotId), eq(attendanceRecords.date, date)))
          .limit(1);
        if (rows.length > 0) {
          const rec = toAttendanceRecord(rows[0]);
          attendanceRecordMem.save(rec);
          return rec;
        }
        return undefined;
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] getAttendanceRecord failed:', err.message);
      }
    }
    return attendanceRecordMem.filter((r) => r.timetableSlotId === timetableSlotId && r.date === date)[0];
  }

  public async getAttendanceRecordById(id: string): Promise<AttendanceRecordRecord | undefined> {
    if (db) {
      try {
        const rows = await db.select().from(attendanceRecords).where(eq(attendanceRecords.id, id)).limit(1);
        if (rows.length > 0) {
          const rec = toAttendanceRecord(rows[0]);
          attendanceRecordMem.save(rec);
          return rec;
        }
        return undefined;
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] getAttendanceRecordById failed:', err.message);
      }
    }
    return attendanceRecordMem.getById(id);
  }

  public async upsertAttendanceRecord(data: any): Promise<AttendanceRecordRecord> {
    const record: AttendanceRecordRecord = {
      id: data.id || `ar_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      institutionCode: data.institutionCode,
      timetableSlotId: data.timetableSlotId,
      date: data.date,
      takenByTeacherId: data.takenByTeacherId,
      status: data.status || 'submitted',
      submittedAt: data.submittedAt || new Date(),
      lockedAt: data.lockedAt || null,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
    };
    attendanceRecordMem.save(record);
    if (db) {
      try {
        const [inserted] = await db
          .insert(attendanceRecords)
          .values(record)
          .onConflictDoUpdate({
            target: [attendanceRecords.timetableSlotId, attendanceRecords.date],
            set: {
              takenByTeacherId: record.takenByTeacherId,
              status: record.status,
              submittedAt: record.submittedAt,
              lockedAt: record.lockedAt,
              updatedAt: new Date(),
            },
          })
          .returning();
        if (inserted) return toAttendanceRecord(inserted);
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] upsertAttendanceRecord failed:', err.message);
      }
    }
    return record;
  }

  public async updateAttendanceRecordLock(id: string, lockedAt: Date): Promise<AttendanceRecordRecord | undefined> {
    const existing = attendanceRecordMem.getById(id);
    const updated: AttendanceRecordRecord = { ...existing, id, status: 'locked', lockedAt, updatedAt: new Date() } as AttendanceRecordRecord;
    attendanceRecordMem.save(updated);
    if (db) {
      try {
        const [row] = await db
          .update(attendanceRecords)
          .set({ status: 'locked', lockedAt, updatedAt: new Date() })
          .where(eq(attendanceRecords.id, id))
          .returning();
        if (row) return toAttendanceRecord(row);
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] updateAttendanceRecordLock failed:', err.message);
      }
    }
    return updated;
  }

  // ---------- Attendance Entries ----------
  public async listEntriesForRecord(attendanceRecordId: string): Promise<AttendanceEntryRecord[]> {
    if (db) {
      try {
        const rows = await db.select().from(attendanceEntries).where(eq(attendanceEntries.attendanceRecordId, attendanceRecordId));
        rows.forEach((r) => attendanceEntryMem.save(toAttendanceEntry(r)));
        return rows;
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] listEntriesForRecord failed:', err.message);
      }
    }
    return attendanceEntryMem.filter((r) => r.attendanceRecordId === attendanceRecordId);
  }

  public async replaceEntriesForRecord(attendanceRecordId: string, entries: any[]): Promise<AttendanceEntryRecord[]> {
    if (db) {
      try {
        await db.delete(attendanceEntries).where(eq(attendanceEntries.attendanceRecordId, attendanceRecordId));
        if (entries.length > 0) {
          const inserted = await db.insert(attendanceEntries).values(entries).returning();
          inserted.forEach((r) => attendanceEntryMem.save(toAttendanceEntry(r)));
          return inserted;
        }
        return [];
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] replaceEntriesForRecord failed:', err.message);
      }
    }
    for (const existing of attendanceEntryMem.filter((r) => r.attendanceRecordId === attendanceRecordId)) {
      attendanceEntryMem.delete(existing.id);
    }
    const saved = entries.map((e) => {
      const rec: AttendanceEntryRecord = {
        id: e.id || `ae_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        attendanceRecordId,
        studentId: e.studentId,
        attendanceStatus: e.attendanceStatus || 'present',
        remarks: e.remarks || '',
        createdAt: e.createdAt || new Date(),
        updatedAt: e.updatedAt || new Date(),
      };
      return attendanceEntryMem.save(rec);
    });
    return saved;
  }

  public async listAttendanceForStudent(studentId: string, institutionCode: string, fromDate?: string, toDate?: string): Promise<AttendanceEntryRecord[]> {
    if (db) {
      try {
        const conditions = [eq(attendanceEntries.studentId, studentId)];
        if (fromDate) conditions.push(gte(attendanceRecords.date, fromDate));
        if (toDate) conditions.push(lte(attendanceRecords.date, toDate));
        const rows = await db
          .select({
            entry: attendanceEntries,
            record: attendanceRecords,
          })
          .from(attendanceEntries)
          .innerJoin(attendanceRecords, eq(attendanceEntries.attendanceRecordId, attendanceRecords.id))
          .where(and(...conditions));
        const result = rows.map((r) => {
          const entry = toAttendanceEntry(r.entry);
          attendanceEntryMem.save(entry);
          attendanceRecordMem.save(toAttendanceRecord(r.record));
          return entry;
        });
        return result;
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] listAttendanceForStudent failed:', err.message);
      }
    }
    const filtered = attendanceEntryMem.filter((e) => e.studentId === studentId);
    if (!fromDate && !toDate) return filtered;
    const entriesWithRecord = filtered
      .map((e) => {
        const record = attendanceRecordMem.getById(e.attendanceRecordId);
        return { entry: e, record };
      })
      .filter((x) => x.record);
    const dateStr = (d: string | Date | null | undefined) => {
      if (!d) return '';
      const dt = typeof d === 'string' ? new Date(d) : d;
      return dt.toISOString().slice(0, 10);
    };
    return entriesWithRecord
      .filter((x) => {
        const ds = dateStr(x.record!.date);
        const okFrom = fromDate ? ds >= fromDate : true;
        const okTo = toDate ? ds <= toDate : true;
        return okFrom && okTo;
      })
      .map((x) => x.entry);
  }

  /**
   * One JOINed query (entries -> records -> slots -> subjects) for many
   * students at once. Eliminates the N+1 lookups previously done per entry.
   */
  public async listAttendanceEntriesWithSubject(studentIds: string[]): Promise<{
    studentId: string;
    attendanceStatus: string;
    date: Date | string | null;
    subjectId: string;
    subjectName: string | null;
  }[]> {
    if (!studentIds.length) return [];
    if (db) {
      try {
        const rows = await db
          .select({
            studentId: attendanceEntries.studentId,
            attendanceStatus: attendanceEntries.attendanceStatus,
            date: attendanceRecords.date,
            subjectId: timetableSlots.subjectId,
            subjectName: subjects.name,
          })
          .from(attendanceEntries)
          .innerJoin(attendanceRecords, eq(attendanceEntries.attendanceRecordId, attendanceRecords.id))
          .innerJoin(timetableSlots, eq(attendanceRecords.timetableSlotId, timetableSlots.id))
          .innerJoin(subjects, eq(timetableSlots.subjectId, subjects.id))
          .where(inArray(attendanceEntries.studentId, studentIds));
        return rows.map((r) => ({
          studentId: r.studentId,
          attendanceStatus: r.attendanceStatus,
          date: r.date,
          subjectId: r.subjectId,
          subjectName: r.subjectName,
        }));
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] listAttendanceEntriesWithSubject failed:', err.message);
      }
    }
    const entries = attendanceEntryMem.filter((e) => studentIds.includes(e.studentId));
    return entries
      .map((e) => {
        const record = attendanceRecordMem.getById(e.attendanceRecordId);
        const slot = record ? timetableSlotMem.getById(record.timetableSlotId) : undefined;
        const subject = slot ? subjectMem.getById(slot.subjectId) : undefined;
        if (!record || !slot) return null;
        return {
          studentId: e.studentId,
          attendanceStatus: e.attendanceStatus,
          date: record.date,
          subjectId: slot.subjectId,
          subjectName: subject?.name ?? null,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }

  // ---------- Class attendance aggregates (admin/teacher views) ----------
  /**
   * Aggregates attendance for a whole class/section across a date range.
   * Uses SQL GROUP BY (days / students / subjects) so payload size is bounded
   * regardless of how large the class or the range is — no N+1, no row dump.
   */
  public async getClassAttendanceAggregates(
    classSectionId: string,
    fromDate: string,
    toDate: string
  ): Promise<{
    days: { date: string; present: number; absent: number; late: number; excused: number; total: number }[];
    studentStats: { studentId: string; present: number; absent: number; late: number; excused: number; total: number }[];
    subjectStats: { subjectId: string; subjectName: string; present: number; absent: number; late: number; excused: number; total: number }[];
  }> {
    if (db) {
      try {
        const baseWhere = and(
          eq(timetableSlots.classSectionId, classSectionId),
          gte(attendanceRecords.date, fromDate),
          lte(attendanceRecords.date, toDate)
        );
        const statusFilter = (col: any, status: string) =>
          sql<number>`count(*) FILTER (WHERE ${col} = ${status})`;

        const days = await db
          .select({
            date: attendanceRecords.date,
            total: count(),
            present: statusFilter(attendanceEntries.attendanceStatus, 'present'),
            absent: statusFilter(attendanceEntries.attendanceStatus, 'absent'),
            late: statusFilter(attendanceEntries.attendanceStatus, 'late'),
            excused: statusFilter(attendanceEntries.attendanceStatus, 'excused'),
          })
          .from(attendanceEntries)
          .innerJoin(attendanceRecords, eq(attendanceEntries.attendanceRecordId, attendanceRecords.id))
          .innerJoin(timetableSlots, eq(attendanceRecords.timetableSlotId, timetableSlots.id))
          .where(baseWhere)
          .groupBy(attendanceRecords.date)
          .orderBy(attendanceRecords.date);

        const studentStats = await db
          .select({
            studentId: attendanceEntries.studentId,
            total: count(),
            present: statusFilter(attendanceEntries.attendanceStatus, 'present'),
            absent: statusFilter(attendanceEntries.attendanceStatus, 'absent'),
            late: statusFilter(attendanceEntries.attendanceStatus, 'late'),
            excused: statusFilter(attendanceEntries.attendanceStatus, 'excused'),
          })
          .from(attendanceEntries)
          .innerJoin(attendanceRecords, eq(attendanceEntries.attendanceRecordId, attendanceRecords.id))
          .innerJoin(timetableSlots, eq(attendanceRecords.timetableSlotId, timetableSlots.id))
          .where(baseWhere)
          .groupBy(attendanceEntries.studentId);

        const subjectStats = await db
          .select({
            subjectId: timetableSlots.subjectId,
            subjectName: subjects.name,
            total: count(),
            present: statusFilter(attendanceEntries.attendanceStatus, 'present'),
            absent: statusFilter(attendanceEntries.attendanceStatus, 'absent'),
            late: statusFilter(attendanceEntries.attendanceStatus, 'late'),
            excused: statusFilter(attendanceEntries.attendanceStatus, 'excused'),
          })
          .from(attendanceEntries)
          .innerJoin(attendanceRecords, eq(attendanceEntries.attendanceRecordId, attendanceRecords.id))
          .innerJoin(timetableSlots, eq(attendanceRecords.timetableSlotId, timetableSlots.id))
          .innerJoin(subjects, eq(timetableSlots.subjectId, subjects.id))
          .where(baseWhere)
          .groupBy(timetableSlots.subjectId, subjects.name);

        return { days, studentStats, subjectStats };
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] getClassAttendanceAggregates failed:', err.message);
      }
    }
    return this.getClassAttendanceAggregatesMem(classSectionId, fromDate, toDate);
  }

  private async getClassAttendanceAggregatesMem(
    classSectionId: string,
    fromDate: string,
    toDate: string
  ) {
    const entries = attendanceEntryMem.getAll();
    const rows = entries
      .map((e) => {
        const record = attendanceRecordMem.getById(e.attendanceRecordId);
        const slot = record ? timetableSlotMem.getById(record.timetableSlotId) : undefined;
        const subject = slot ? subjectMem.getById(slot.subjectId) : undefined;
        if (!record || !slot || slot.classSectionId !== classSectionId) return null;
        const ds = record.date ? new Date(record.date).toISOString().slice(0, 10) : '';
        if (ds < fromDate || ds > toDate) return null;
        return { studentId: e.studentId, status: e.attendanceStatus, date: ds, subjectId: slot.subjectId, subjectName: subject?.name || '' };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    const days = new Map<string, any>();
    const studentStats = new Map<string, any>();
    const subjectStats = new Map<string, any>();
    const bump = (map: Map<string, any>, key: string, status: string) => {
      const b = map.get(key) || { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
      b.total++;
      b[status] = (b[status] || 0) + 1;
      map.set(key, b);
    };
    for (const r of rows) {
      bump(days, r.date, r.status);
      bump(studentStats, r.studentId, r.status);
      const sk = `${r.subjectId}|${r.subjectName}`;
      const sb = subjectStats.get(sk) || { subjectId: r.subjectId, subjectName: r.subjectName, present: 0, absent: 0, late: 0, excused: 0, total: 0 };
      sb.total++;
      sb[r.status] = (sb[r.status] || 0) + 1;
      subjectStats.set(sk, sb);
    }
    return {
      days: Array.from(days.entries()).map(([date, b]) => ({ date, ...b })).sort((a, b) => a.date.localeCompare(b.date)),
      studentStats: Array.from(studentStats.entries()).map(([studentId, b]) => ({ studentId, ...b })),
      subjectStats: Array.from(subjectStats.values()),
    };
  }

  // ---------- Paged lists (large-user support) ----------
  public async listClassSectionsPaged(institutionCode: string, opts: { limit: number; offset: number }) {
    if (db) {
      try {
        const [rows, totalRows] = await Promise.all([
          db.select().from(classSections).where(eq(classSections.institutionCode, institutionCode)).limit(opts.limit).offset(opts.offset),
          db.select({ count: count() }).from(classSections).where(eq(classSections.institutionCode, institutionCode)),
        ]);
        rows.forEach((r) => classSectionMem.save(toClassSection(r)));
        return { items: rows, total: Number(totalRows[0]?.count ?? 0) };
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] listClassSectionsPaged failed:', err.message);
      }
    }
    const filtered = classSectionMem.filter((r) => r.institutionCode.toLowerCase() === institutionCode.toLowerCase());
    return { items: filtered.slice(opts.offset, opts.offset + opts.limit), total: filtered.length };
  }

  public async listSubjectsPaged(institutionCode: string, opts: { limit: number; offset: number }) {
    if (db) {
      try {
        const [rows, totalRows] = await Promise.all([
          db.select().from(subjects).where(eq(subjects.institutionCode, institutionCode)).limit(opts.limit).offset(opts.offset),
          db.select({ count: count() }).from(subjects).where(eq(subjects.institutionCode, institutionCode)),
        ]);
        rows.forEach((r) => subjectMem.save(toSubject(r)));
        return { items: rows, total: Number(totalRows[0]?.count ?? 0) };
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] listSubjectsPaged failed:', err.message);
      }
    }
    const filtered = subjectMem.filter((r) => r.institutionCode.toLowerCase() === institutionCode.toLowerCase());
    return { items: filtered.slice(opts.offset, opts.offset + opts.limit), total: filtered.length };
  }

  public async listPeriodsPaged(institutionCode: string, opts: { limit: number; offset: number }) {
    if (db) {
      try {
        const [rows, totalRows] = await Promise.all([
          db
            .select()
            .from(periods)
            .where(eq(periods.institutionCode, institutionCode))
            .orderBy(sql`${periods.sortOrder} asc, ${periods.startTime} asc`)
            .limit(opts.limit)
            .offset(opts.offset),
          db.select({ count: count() }).from(periods).where(eq(periods.institutionCode, institutionCode)),
        ]);
        rows.forEach((r) => periodMem.save(toPeriod(r)));
        return { items: rows, total: Number(totalRows[0]?.count ?? 0) };
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] listPeriodsPaged failed:', err.message);
      }
    }
    const filtered = periodMem
      .filter((r) => r.institutionCode.toLowerCase() === institutionCode.toLowerCase())
      .sort((a, b) => a.sortOrder - b.sortOrder || a.startTime.localeCompare(b.startTime));
    return { items: filtered.slice(opts.offset, opts.offset + opts.limit), total: filtered.length };
  }

  public async listSubjectTeachersPaged(
    institutionCode: string,
    opts: { limit: number; offset: number },
    classSectionId?: string,
    teacherId?: string
  ) {
    if (db) {
      try {
        const conditions = [eq(subjectTeachers.institutionCode, institutionCode)];
        if (classSectionId) conditions.push(eq(subjectTeachers.classSectionId, classSectionId));
        if (teacherId) conditions.push(eq(subjectTeachers.teacherId, teacherId));
        const [rows, totalRows] = await Promise.all([
          db.select().from(subjectTeachers).where(and(...conditions)).limit(opts.limit).offset(opts.offset),
          db.select({ count: count() }).from(subjectTeachers).where(and(...conditions)),
        ]);
        rows.forEach((r) => subjectTeacherMem.save(toSubjectTeacher(r)));
        return { items: rows, total: Number(totalRows[0]?.count ?? 0) };
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] listSubjectTeachersPaged failed:', err.message);
      }
    }
    const filtered = subjectTeacherMem.filter((r) => {
      const okInst = r.institutionCode.toLowerCase() === institutionCode.toLowerCase();
      const okClass = classSectionId ? r.classSectionId === classSectionId : true;
      const okTeacher = teacherId ? r.teacherId === teacherId : true;
      return okInst && okClass && okTeacher;
    });
    return { items: filtered.slice(opts.offset, opts.offset + opts.limit), total: filtered.length };
  }

  // ---------- Exams / Marks ----------

  public async listExams(institutionCode: string): Promise<ExamRecord[]> {
    if (db) {
      try {
        const rows = await db.select().from(exams).where(eq(exams.institutionCode, institutionCode)).orderBy(desc(exams.createdAt));
        rows.forEach((r) => examMem.save({ ...r, createdAt: r.createdAt ?? new Date(), updatedAt: r.updatedAt ?? new Date() }));
        return rows;
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] listExams failed:', err.message);
      }
    }
    return examMem
      .filter((r) => r.institutionCode.toLowerCase() === institutionCode.toLowerCase())
      .sort((a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0));
  }

  public async getExamById(id: string): Promise<ExamRecord | undefined> {
    if (db) {
      try {
        const rows = await db.select().from(exams).where(eq(exams.id, id)).limit(1);
        if (rows[0]) {
          const r = rows[0];
          const rec = { ...r, createdAt: r.createdAt ?? new Date(), updatedAt: r.updatedAt ?? new Date() };
          examMem.save(rec);
          return rec;
        }
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] getExamById failed:', err.message);
      }
    }
    return examMem.getById(id);
  }

  public async createExam(data: any): Promise<ExamRecord> {
    const record: ExamRecord = {
      id: data.id || `ex_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      institutionCode: data.institutionCode,
      name: data.name,
      term: data.term || '',
      academicYear: data.academicYear || '',
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      status: data.status || 'draft',
      createdBy: data.createdBy,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
    };
    examMem.save(record);
    if (db) {
      try {
        await db.insert(exams).values(record).onConflictDoNothing();
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] createExam failed:', err.message);
      }
    }
    return record;
  }

  public async updateExam(id: string, data: any): Promise<ExamRecord | undefined> {
    const existing = examMem.getById(id);
    if (!existing) return undefined;
    const updated: ExamRecord = {
      ...existing,
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.term !== undefined ? { term: data.term } : {}),
      ...(data.academicYear !== undefined ? { academicYear: data.academicYear } : {}),
      ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
      ...(data.endDate !== undefined ? { endDate: data.endDate } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      updatedAt: new Date(),
    };
    examMem.save(updated);
    if (db) {
      try {
        await db.update(exams).set({
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.term !== undefined ? { term: data.term } : {}),
          ...(data.academicYear !== undefined ? { academicYear: data.academicYear } : {}),
          ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
          ...(data.endDate !== undefined ? { endDate: data.endDate } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          updatedAt: new Date(),
        }).where(eq(exams.id, id));
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] updateExam failed:', err.message);
      }
    }
    return updated;
  }

  public async listExamSubjects(examId: string): Promise<ExamSubjectRecord[]> {
    if (db) {
      try {
        const rows = await db.select().from(examSubjects).where(eq(examSubjects.examId, examId));
        rows.forEach((r) => examSubjectMem.save({ ...r, createdAt: r.createdAt ?? new Date() }));
        return rows;
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] listExamSubjects failed:', err.message);
      }
    }
    return examSubjectMem.filter((r) => r.examId === examId);
  }

  public async upsertExamSubject(data: any): Promise<ExamSubjectRecord> {
    const existing = examSubjectMem.filter((r) => r.examId === data.examId && r.subjectId === data.subjectId)[0];
    const id = existing?.id || data.id || `es_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const record: ExamSubjectRecord = {
      id,
      examId: data.examId,
      institutionCode: data.institutionCode,
      subjectId: data.subjectId,
      maxMarks: data.maxMarks ?? 100,
      passMarks: data.passMarks ?? 35,
      createdAt: existing?.createdAt || new Date(),
    };
    examSubjectMem.save(record);
    if (db) {
      try {
        await db.insert(examSubjects).values(record).onConflictDoNothing();
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] upsertExamSubject failed:', err.message);
      }
    }
    return record;
  }

  public async getExamSubjectById(id: string): Promise<ExamSubjectRecord | undefined> {
    if (db) {
      try {
        const rows = await db.select().from(examSubjects).where(eq(examSubjects.id, id)).limit(1);
        if (rows[0]) {
          const rec = { ...rows[0], createdAt: rows[0].createdAt ?? new Date() };
          examSubjectMem.save(rec);
          return rec;
        }
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] getExamSubjectById failed:', err.message);
      }
    }
    return examSubjectMem.getById(id);
  }

  public async listMarksForExamSubject(examSubjectId: string): Promise<MarkRecord[]> {
    if (db) {
      try {
        const rows = await db.select().from(marks).where(eq(marks.examSubjectId, examSubjectId));
        rows.forEach((r) => markMem.save({ ...r, enteredAt: r.enteredAt ?? new Date(), updatedAt: r.updatedAt ?? new Date() }));
        return rows;
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] listMarksForExamSubject failed:', err.message);
      }
    }
    return markMem.filter((r) => r.examSubjectId === examSubjectId);
  }

  public async listMarksForStudent(institutionCode: string, studentId: string): Promise<MarkRecord[]> {
    if (db) {
      try {
        const rows = await db.select().from(marks)
          .where(and(eq(marks.institutionCode, institutionCode), eq(marks.studentId, studentId)));
        rows.forEach((r) => markMem.save({ ...r, enteredAt: r.enteredAt ?? new Date(), updatedAt: r.updatedAt ?? new Date() }));
        return rows;
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] listMarksForStudent failed:', err.message);
      }
    }
    return markMem.filter((r) => r.institutionCode.toLowerCase() === institutionCode.toLowerCase() && r.studentId === studentId);
  }

  public async upsertMark(data: any): Promise<MarkRecord> {
    const existing = markMem.filter((r) => r.examSubjectId === data.examSubjectId && r.studentId === data.studentId)[0];
    const id = existing?.id || data.id || `mk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const record: MarkRecord = {
      id,
      examId: data.examId,
      examSubjectId: data.examSubjectId,
      institutionCode: data.institutionCode,
      studentId: data.studentId,
      classSectionId: data.classSectionId,
      subjectId: data.subjectId,
      marksObtained: String(data.marksObtained ?? 0),
      grade: data.grade || '',
      remarks: data.remarks || '',
      enteredBy: data.enteredBy,
      enteredAt: existing?.enteredAt || new Date(),
      updatedAt: new Date(),
    };
    markMem.save(record);
    if (db) {
      try {
        await db.insert(marks).values(record).onConflictDoNothing();
      } catch (err: any) {
        console.warn('[PostgreSQL Academics Warning] upsertMark failed:', err.message);
      }
    }
    return record;
  }

  // ---------- Homework ----------
  private hwMem = new InMemoryStore<HomeworkRecord>();

  public async createHomework(data: any): Promise<HomeworkRecord> {
    const record: HomeworkRecord = {
      id: `hw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      institutionCode: data.institutionCode,
      classSectionId: data.classSectionId,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      title: data.title,
      description: data.description || '',
      dueDate: data.dueDate,
      assignedDate: data.assignedDate || new Date().toISOString().slice(0, 10),
      priority: data.priority || 'normal',
      status: data.status || 'active',
      attachments: data.attachments || [],
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.hwMem.save(record);
    if (db) {
      try {
        await db.insert(homework).values(record);
      } catch (err: any) {
        console.warn('[PostgreSQL Warning] createHomework failed:', err.message);
      }
    }
    return record;
  }

  public async listHomeworkByClass(classSectionId: string): Promise<HomeworkRecord[]> {
    if (db) {
      try {
        const rows = await db.select().from(homework)
          .where(eq(homework.classSectionId, classSectionId))
          .orderBy(desc(homework.createdAt));
        rows.forEach((r) => this.hwMem.save({ ...r, createdAt: r.createdAt ?? new Date(), updatedAt: r.updatedAt ?? new Date() }));
        return rows;
      } catch (err: any) {
        console.warn('[PostgreSQL Warning] listHomeworkByClass failed:', err.message);
      }
    }
    return this.hwMem.filter((r) => r.classSectionId === classSectionId).sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  public async listHomeworkByTeacher(teacherId: string): Promise<HomeworkRecord[]> {
    if (db) {
      try {
        const rows = await db.select().from(homework)
          .where(eq(homework.teacherId, teacherId))
          .orderBy(desc(homework.createdAt));
        rows.forEach((r) => this.hwMem.save({ ...r, createdAt: r.createdAt ?? new Date(), updatedAt: r.updatedAt ?? new Date() }));
        return rows;
      } catch (err: any) {
        console.warn('[PostgreSQL Warning] listHomeworkByTeacher failed:', err.message);
      }
    }
    return this.hwMem.filter((r) => r.teacherId === teacherId).sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  public async getHomeworkById(id: string): Promise<HomeworkRecord | undefined> {
    if (db) {
      try {
        const rows = await db.select().from(homework).where(eq(homework.id, id)).limit(1);
        if (rows[0]) return rows[0];
      } catch (err: any) {
        console.warn('[PostgreSQL Warning] getHomeworkById failed:', err.message);
      }
    }
    return this.hwMem.getById(id);
  }

  public async updateHomework(id: string, data: Partial<HomeworkRecord>): Promise<HomeworkRecord | undefined> {
    const existing = await this.getHomeworkById(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.hwMem.save(updated);
    if (db) {
      try {
        await db.update(homework).set(data).where(eq(homework.id, id));
      } catch (err: any) {
        console.warn('[PostgreSQL Warning] updateHomework failed:', err.message);
      }
    }
    return updated;
  }

  public async deleteHomework(id: string): Promise<boolean> {
    this.hwMem.delete(id);
    if (db) {
      try {
        await db.delete(homework).where(eq(homework.id, id));
      } catch (err: any) {
        console.warn('[PostgreSQL Warning] deleteHomework failed:', err.message);
      }
    }
    return true;
  }
}

export const academicsRepository = new AcademicsRepository();
