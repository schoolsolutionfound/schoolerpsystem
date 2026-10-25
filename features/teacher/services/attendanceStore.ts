import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MarkedPeriodRecord {
  slotId: string;
  date: string; // YYYY-MM-DD
  className?: string; // e.g. "Class 10-A"
  normalizedClass?: string; // "X"
  normalizedSection?: string; // "A"
  subjectName?: string;
  markedAt: string; // ISO string
  presentCount?: number;
  absentCount?: number;
  totalStudents?: number;
  marks?: Record<string, 'present' | 'absent'>;
}

interface AttendanceStoreState {
  markedPeriods: MarkedPeriodRecord[];
  markPeriodAttendance: (record: {
    slotId: string;
    date: string;
    className?: string;
    normalizedClass?: string;
    normalizedSection?: string;
    subjectName?: string;
    presentCount?: number;
    absentCount?: number;
    totalStudents?: number;
    marks?: Record<string, 'present' | 'absent'>;
  }) => void;
  isPeriodMarked: (
    slotId: string,
    date: string,
    className?: string,
    subjectName?: string
  ) => boolean;
  getAttendanceRecord: (
    slotId: string,
    date: string,
    className?: string,
    subjectName?: string
  ) => MarkedPeriodRecord | undefined;
  clearMarkedAttendance: () => void;
}

export const useAttendanceStore = create<AttendanceStoreState>()(
  persist(
    (set, get) => ({
      markedPeriods: [],

      markPeriodAttendance: (record) => {
        set((state) => {
          // Remove any prior entry matching this slotId or class+subject on this date
          const filtered = state.markedPeriods.filter((p) => {
            if (p.date !== record.date) return true;
            if (p.slotId && record.slotId && p.slotId === record.slotId) return false;
            if (
              p.className &&
              record.className &&
              p.subjectName &&
              record.subjectName &&
              p.className.toLowerCase().replace(/\s+/g, '') ===
                record.className.toLowerCase().replace(/\s+/g, '') &&
              p.subjectName.toLowerCase().trim() === record.subjectName.toLowerCase().trim()
            ) {
              return false;
            }
            return true;
          });

          const newEntry: MarkedPeriodRecord = {
            ...record,
            markedAt: new Date().toISOString(),
          };

          return {
            markedPeriods: [newEntry, ...filtered],
          };
        });
      },

      isPeriodMarked: (slotId, date, className, subjectName) => {
        const { markedPeriods } = get();
        return markedPeriods.some((p) => {
          if (p.date !== date) return false;
          // Match by slotId
          if (p.slotId && slotId && p.slotId === slotId) return true;

          // Match by Class and Subject
          if (
            Boolean(className) &&
            Boolean(p.className) &&
            Boolean(subjectName) &&
            Boolean(p.subjectName)
          ) {
            const classMatch =
              p.className?.toLowerCase().replace(/\s+/g, '') ===
              className?.toLowerCase().replace(/\s+/g, '');
            const subjectMatch =
              p.subjectName?.toLowerCase().trim() === subjectName?.toLowerCase().trim() ||
              p.subjectName?.toLowerCase().includes(subjectName?.toLowerCase().trim() || '') ||
              subjectName?.toLowerCase().includes(p.subjectName?.toLowerCase().trim() || '');
            if (classMatch && subjectMatch) return true;
          }
          return false;
        });
      },

      getAttendanceRecord: (slotId, date, className, subjectName) => {
        const { markedPeriods } = get();
        return markedPeriods.find((p) => {
          if (p.date !== date) return false;
          if (p.slotId && slotId && p.slotId === slotId) return true;
          if (
            Boolean(className) &&
            Boolean(p.className) &&
            Boolean(subjectName) &&
            Boolean(p.subjectName)
          ) {
            const classMatch =
              p.className?.toLowerCase().replace(/\s+/g, '') ===
              className?.toLowerCase().replace(/\s+/g, '');
            const subjectMatch =
              p.subjectName?.toLowerCase().trim() === subjectName?.toLowerCase().trim() ||
              p.subjectName?.toLowerCase().includes(subjectName?.toLowerCase().trim() || '') ||
              subjectName?.toLowerCase().includes(p.subjectName?.toLowerCase().trim() || '');
            if (classMatch && subjectMatch) return true;
          }
          return false;
        });
      },

      clearMarkedAttendance: () => {
        set({ markedPeriods: [] });
      },
    }),
    {
      name: 'schoolerp-attendance-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
