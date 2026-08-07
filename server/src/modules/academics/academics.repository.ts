import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { db } from '../shared/db/index.js';
import {
  classSections,
  subjects,
  subjectTeachers,
  periods,
  timetables,
  timetableSlots,
  attendanceRecords,
  attendanceEntries,
  ClassSectionRecord,
  SubjectRecord,
  SubjectTeacherRecord,
  PeriodRecord,
  TimetableRecord,
  TimetableSlotRecord,
  AttendanceRecordRecord,
  AttendanceEntryRecord,
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
          const inserted = await db.insert(timetableSlots).values(slots).returning();
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
}

export const academicsRepository = new AcademicsRepository();
