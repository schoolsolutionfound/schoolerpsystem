export interface AttendanceRecord {
  date: string;
  classId: string;
  slotId?: string;
  classSectionName?: string;
  subjectName?: string;
  entries: Record<string, 'present' | 'absent'>;
  presentCount: number;
  absentCount: number;
  totalCount: number;
  submittedAt: string;
}

const attendanceCache: Record<string, AttendanceRecord> = {};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch {
      // ignore
    }
  });
}

function normalize(s?: string) {
  return (s || '')
    .toLowerCase()
    .replace(/[·•\-–]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const AttendanceStore = {
  saveAttendance(record: AttendanceRecord) {
    const keys = [
      `${record.classId}_${record.date}`,
      record.slotId ? `${record.slotId}_${record.date}` : null,
      record.classSectionName && record.subjectName
        ? `${normalize(record.classSectionName)}_${normalize(record.subjectName)}_${record.date}`
        : null,
    ].filter(Boolean) as string[];

    for (const key of keys) {
      attendanceCache[key] = record;
    }
    notify();
  },

  getAttendanceRecord(query: {
    classId?: string;
    slotId?: string;
    classSectionName?: string;
    subjectName?: string;
    date: string;
  }): AttendanceRecord | undefined {
    const { classId, slotId, classSectionName, subjectName, date } = query;

    if (classId && attendanceCache[`${classId}_${date}`]) {
      return attendanceCache[`${classId}_${date}`];
    }
    if (slotId && attendanceCache[`${slotId}_${date}`]) {
      return attendanceCache[`${slotId}_${date}`];
    }
    if (classSectionName && subjectName) {
      const nameKey = `${normalize(classSectionName)}_${normalize(subjectName)}_${date}`;
      if (attendanceCache[nameKey]) {
        return attendanceCache[nameKey];
      }
    }

    // Fallback scan across all records with flexible matching
    return Object.values(attendanceCache).find((rec) => {
      if (rec.date !== date) return false;
      if (classId && rec.classId === classId) return true;
      if (slotId && (rec.slotId === slotId || rec.classId === slotId)) return true;
      if (classSectionName && subjectName && rec.classSectionName && rec.subjectName) {
        const normRecClass = normalize(rec.classSectionName);
        const normQClass = normalize(classSectionName);
        const normRecSub = normalize(rec.subjectName);
        const normQSub = normalize(subjectName);

        const classMatches =
          normRecClass === normQClass ||
          normRecClass.includes(normQClass) ||
          normQClass.includes(normRecClass);
        const subMatches =
          normRecSub === normQSub ||
          normRecSub.includes(normQSub) ||
          normQSub.includes(normRecSub);

        if (classMatches && subMatches) {
          return true;
        }
      }
      return false;
    });
  },

  isAttendanceMarked(query: {
    classId?: string;
    slotId?: string;
    classSectionName?: string;
    subjectName?: string;
    date: string;
  }): boolean {
    return !!this.getAttendanceRecord(query);
  },

  getAllRecords(): AttendanceRecord[] {
    return Object.values(attendanceCache);
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
