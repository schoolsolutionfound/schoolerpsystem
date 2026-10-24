export interface ClassTransfer {
  id: string;
  classSectionName: string;
  subjectName: string;
  originalTeacherName: string;
  substituteTeacherName: string;
  date: string; // YYYY-MM-DD
  periodTime?: string;
  reason?: string;
  isTemporary: boolean;
  transferredAt: string;
}

export interface SubstituteFaculty {
  id: string;
  name: string;
  department: string;
  designation?: string;
}
