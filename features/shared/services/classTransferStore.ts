import { ClassTransfer, SubstituteFaculty } from '../types/classTransfer.types';

export const AVAILABLE_SUBSTITUTE_FACULTY: SubstituteFaculty[] = [];

let transferRecords: ClassTransfer[] = [];

const listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach((callback) => {
    try {
      callback();
    } catch {
      // ignore listener errors
    }
  });
}

export const ClassTransferStore = {
  getAllTransfers(): ClassTransfer[] {
    return [...transferRecords];
  },

  addTransfer(data: Omit<ClassTransfer, 'id' | 'transferredAt' | 'isTemporary'>): ClassTransfer {
    const newRecord: ClassTransfer = {
      ...data,
      id: `tr-${Date.now()}`,
      isTemporary: true,
      transferredAt: new Date().toISOString(),
    };
    transferRecords = [newRecord, ...transferRecords];
    notifyListeners();
    return newRecord;
  },

  removeTransfer(id: string) {
    transferRecords = transferRecords.filter((t) => t.id !== id);
    notifyListeners();
  },

  getTransferForClassDate(classSectionName: string, subjectName: string, date: string): ClassTransfer | undefined {
    return transferRecords.find(
      (t) =>
        t.date === date &&
        t.classSectionName.toLowerCase().trim() === classSectionName.toLowerCase().trim() &&
        t.subjectName.toLowerCase().trim() === subjectName.toLowerCase().trim()
    );
  },

  getTransferredClassesForSubstitute(substituteTeacherName: string, date?: string): ClassTransfer[] {
    const norm = substituteTeacherName.toLowerCase().trim();
    return transferRecords.filter((t) => {
      const matchTeacher =
        t.substituteTeacherName.toLowerCase().trim() === norm ||
        t.substituteTeacherName.toLowerCase().includes(norm) ||
        norm.includes(t.substituteTeacherName.toLowerCase());
      if (!matchTeacher) return false;
      if (date && t.date !== date) return false;
      return true;
    });
  },

  subscribe(callback: () => void): () => void {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  },
};
