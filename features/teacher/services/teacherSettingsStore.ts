import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ExamTypeItem {
  id: string;
  name: string;
  maxMarks: number;
  category: 'Periodic' | 'Term' | 'Cumulative';
}

export interface ListTypeItem {
  id: string;
  name: string;
  category?: string;
  enabled: boolean;
  maxMarks: number;
}

export type TotalMarksCalculationMode = 'sum' | 'weighted' | 'best_scores';
export type AverageCalculationFormula = 'all_students' | 'exclude_absent';
export type DecimalPrecision = 0 | 1 | 2;
export type PassingThresholdType = 'mark' | 'percentage';

export interface CalculationSettings {
  calculationMode: TotalMarksCalculationMode;
  passingPercentage: number;
  passingThresholdType?: PassingThresholdType;
  passingThresholdValue?: number;
  averageFormula: AverageCalculationFormula;
  decimalPrecision: DecimalPrecision;
  includeListTypesInTotal: boolean;
  bestOfNCount: number;
}

export const DEFAULT_CALCULATION_SETTINGS: CalculationSettings = {
  calculationMode: 'sum',
  passingPercentage: 35,
  passingThresholdType: 'percentage',
  passingThresholdValue: 35,
  averageFormula: 'all_students',
  decimalPrecision: 1,
  includeListTypesInTotal: true,
  bestOfNCount: 2,
};

const DEFAULT_EXAM_TYPES: ExamTypeItem[] = [
  { id: 'ex-1', name: 'Unit Test 1', maxMarks: 50, category: 'Periodic' },
  { id: 'ex-2', name: 'Unit Test 2', maxMarks: 50, category: 'Periodic' },
  { id: 'ex-3', name: 'Mid Term Exam', maxMarks: 100, category: 'Term' },
  { id: 'ex-4', name: 'Final Exam', maxMarks: 100, category: 'Term' },
  { id: 'ex-5', name: 'Overall', maxMarks: 100, category: 'Cumulative' },
];

const DEFAULT_LIST_TYPES: ListTypeItem[] = [
  { id: 'lt-1', name: 'Assessment', category: 'Evaluation', enabled: true, maxMarks: 25 },
  { id: 'lt-2', name: 'Project', category: 'Practical', enabled: true, maxMarks: 50 },
  { id: 'lt-3', name: 'Test', category: 'Evaluation', enabled: true, maxMarks: 25 },
  { id: 'lt-4', name: 'Assignment', category: 'Submission', enabled: true, maxMarks: 20 },
  { id: 'lt-5', name: 'Lab Work', category: 'Practical', enabled: false, maxMarks: 30 },
  { id: 'lt-6', name: 'Homework', category: 'Submission', enabled: false, maxMarks: 10 },
  { id: 'lt-7', name: 'Viva / Practical', category: 'Oral', enabled: false, maxMarks: 20 },
];

interface TeacherSettingsStoreState {
  examTypes: ExamTypeItem[];
  listTypes: ListTypeItem[];
  calculationSettings: CalculationSettings;

  addExamType: (name: string, maxMarks?: number, category?: 'Periodic' | 'Term' | 'Cumulative') => void;
  updateExamMaxMarks: (id: string, maxMarks: number) => void;
  updateExamType: (id: string, updates: Partial<ExamTypeItem>) => void;
  removeExamType: (id: string) => void;

  toggleListType: (id: string) => void;
  addListType: (name: string, category?: string, maxMarks?: number) => void;
  updateListTypeMaxMarks: (id: string, maxMarks: number) => void;
  removeListType: (id: string) => void;

  updateCalculationSettings: (updates: Partial<CalculationSettings>) => void;
  resetToDefaults: () => void;
}

export const useTeacherSettingsStore = create<TeacherSettingsStoreState>()(
  persist(
    (set, get) => ({
      examTypes: DEFAULT_EXAM_TYPES,
      listTypes: DEFAULT_LIST_TYPES,
      calculationSettings: DEFAULT_CALCULATION_SETTINGS,

      addExamType: (name, maxMarks = 100, category = 'Periodic') => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const exists = get().examTypes.some(
          (e) => e.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (exists) return;

        const newItem: ExamTypeItem = {
          id: `ex-${Date.now()}`,
          name: trimmed,
          maxMarks,
          category,
        };
        set({ examTypes: [...get().examTypes, newItem] });
      },

      updateExamMaxMarks: (id, maxMarks) => {
        set({
          examTypes: get().examTypes.map((e) =>
            e.id === id ? { ...e, maxMarks } : e
          ),
        });
      },

      updateExamType: (id, updates) => {
        set({
          examTypes: get().examTypes.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        });
      },

      removeExamType: (id) => {
        set({ examTypes: get().examTypes.filter((e) => e.id !== id) });
      },

      toggleListType: (id) => {
        set({
          listTypes: get().listTypes.map((item) =>
            item.id === id ? { ...item, enabled: !item.enabled } : item
          ),
        });
      },

      addListType: (name, category = 'Evaluation', maxMarks = 25) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const exists = get().listTypes.some(
          (l) => l.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (exists) return;

        const newItem: ListTypeItem = {
          id: `lt-${Date.now()}`,
          name: trimmed,
          category,
          enabled: true,
          maxMarks,
        };
        set({ listTypes: [...get().listTypes, newItem] });
      },

      updateListTypeMaxMarks: (id, maxMarks) => {
        set({
          listTypes: get().listTypes.map((l) =>
            l.id === id ? { ...l, maxMarks } : l
          ),
        });
      },

      removeListType: (id) => {
        set({ listTypes: get().listTypes.filter((l) => l.id !== id) });
      },

      updateCalculationSettings: (updates) => {
        set({
          calculationSettings: {
            ...get().calculationSettings,
            ...updates,
          },
        });
      },

      resetToDefaults: () => {
        set({
          examTypes: DEFAULT_EXAM_TYPES,
          listTypes: DEFAULT_LIST_TYPES,
          calculationSettings: DEFAULT_CALCULATION_SETTINGS,
        });
      },
    }),
    {
      name: 'kivquo-teacher-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * Calculates student total marks and percentage based on configured calculation rules
 */
export function calculateTotalMarksAndPercentage(
  marksList: { marks: number; maxMarks: number; isAbsent?: boolean }[],
  settings: CalculationSettings = DEFAULT_CALCULATION_SETTINGS
): {
  totalObtained: number;
  totalMax: number;
  percentage: number;
  isPassed: boolean;
} {
  if (!marksList || marksList.length === 0) {
    return { totalObtained: 0, totalMax: 0, percentage: 0, isPassed: false };
  }

  let totalObtained = 0;
  let totalMax = 0;

  if (settings.calculationMode === 'best_scores') {
    // Sort by percentage descending, take top bestOfNCount
    const sorted = [...marksList].sort((a, b) => {
      const pctA = a.maxMarks > 0 ? a.marks / a.maxMarks : 0;
      const pctB = b.maxMarks > 0 ? b.marks / b.maxMarks : 0;
      return pctB - pctA;
    });
    const count = Math.min(settings.bestOfNCount || 2, sorted.length);
    const topN = sorted.slice(0, count);
    totalObtained = topN.reduce((acc, cur) => acc + (cur.isAbsent ? 0 : cur.marks), 0);
    totalMax = topN.reduce((acc, cur) => acc + cur.maxMarks, 0);
  } else if (settings.calculationMode === 'weighted') {
    // Normalize each test to 100%, then calculate average percentage
    let sumPercentages = 0;
    marksList.forEach((item) => {
      if (item.maxMarks > 0) {
        const pct = item.isAbsent ? 0 : (item.marks / item.maxMarks) * 100;
        sumPercentages += pct;
      }
    });
    const avgPct = marksList.length > 0 ? sumPercentages / marksList.length : 0;
    totalObtained = Math.round(avgPct);
    totalMax = 100;
  } else {
    // 'sum' mode (Default)
    marksList.forEach((item) => {
      totalObtained += item.isAbsent ? 0 : item.marks;
      totalMax += item.maxMarks;
    });
  }

  const rawPercentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
  const factor = Math.pow(10, settings.decimalPrecision ?? 1);
  const percentage = Math.round(rawPercentage * factor) / factor;
  const thresholdType = settings.passingThresholdType || 'percentage';
  const cutoff = settings.passingThresholdValue ?? settings.passingPercentage ?? 35;
  const isPassed =
    thresholdType === 'mark'
      ? totalObtained >= cutoff
      : percentage >= cutoff;

  return { totalObtained, totalMax, percentage, isPassed };
}

/**
 * Calculates class average based on configured average formula and precision
 */
export function calculateClassAverage(
  studentPercentages: { percentage: number; isAbsent?: boolean }[],
  settings: CalculationSettings = DEFAULT_CALCULATION_SETTINGS
): {
  average: number;
  highest: number;
  lowest: number;
  passCount: number;
  failCount: number;
} {
  if (!studentPercentages || studentPercentages.length === 0) {
    return { average: 0, highest: 0, lowest: 0, passCount: 0, failCount: 0 };
  }

  const relevant =
    settings.averageFormula === 'exclude_absent'
      ? studentPercentages.filter((s) => !s.isAbsent)
      : studentPercentages;

  if (relevant.length === 0) {
    return { average: 0, highest: 0, lowest: 0, passCount: 0, failCount: 0 };
  }

  const sum = relevant.reduce((acc, s) => acc + s.percentage, 0);
  const rawAvg = sum / relevant.length;
  const factor = Math.pow(10, settings.decimalPrecision ?? 1);
  const average = Math.round(rawAvg * factor) / factor;

  const numericValues = relevant.map((s) => s.percentage);
  const highest = Math.max(...numericValues);
  const lowest = Math.min(...numericValues);

  const passCutoff = settings.passingPercentage ?? 35;
  const passCount = relevant.filter((s) => s.percentage >= passCutoff).length;
  const failCount = relevant.length - passCount;

  return { average, highest, lowest, passCount, failCount };
}
