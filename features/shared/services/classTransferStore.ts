import { ClassTransfer, SubstituteFaculty } from '../types/classTransfer.types';

export const AVAILABLE_SUBSTITUTE_FACULTY: SubstituteFaculty[] = [
  { id: 'fac-01', name: 'Dr. Emily Watson', department: 'Computer Science' },
  { id: 'fac-02', name: 'Prof. David Vance', department: 'Electronics & Comm' },
  { id: 'fac-03', name: 'Dr. Henry Ford', department: 'Mechanical Eng' },
  { id: 'fac-04', name: 'Dr. Sarah Connor', department: 'Computer Science' },
  { id: 'fac-05', name: 'Prof. Alan Turing', department: 'Computer Science' },
  { id: 'fac-06', name: 'Dr. Marie Curie', department: 'Applied Sciences' },
  { id: 'fac-07', name: 'Prof. Sneha Patil', department: 'Computer Science' },
];

let transferRecords: ClassTransfer[] = [
  {
    id: 'tr-sample-1',
    classSectionName: 'CSE 2nd Year · Sec B',
    subjectName: 'Database Management Systems',
    originalTeacherName: 'Prof. David Vance',
    substituteTeacherName: 'Teacher', // Matches default teacher name
    date: new Date().toISOString().slice(0, 10),
    periodTime: '10:00 AM - 10:50 AM',
    reason: 'Conference duty / HOD leave coverage',
    isTemporary: true,
    transferredAt: new Date().toISOString(),
  },
];

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
