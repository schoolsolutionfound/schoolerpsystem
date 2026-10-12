export interface AdmissionApplication {
  id: string;
  parentId: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  schoolId: string;
  schoolName?: string;
  childFullName: string;
  childAge: number;
  childGender: 'male' | 'female' | 'other';
  previousSchool?: string;
  gradeApplyingFor: string;
  status: 'pending' | 'test_scheduled' | 'approved' | 'accepted' | 'rejected' | 'offer_declined';
  entranceTestDate?: string | null;
  entranceTestVenue?: string | null;
  entranceTestInstructions?: string | null;
  createdAt: string;
  updatedAt: string;
}
