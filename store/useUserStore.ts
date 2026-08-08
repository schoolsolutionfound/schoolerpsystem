import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorage } from './secureStorage';

export type UserRole = 'student' | 'teacher' | 'admin' | 'parent' | 'dev' | 'principal' | 'accountant' | 'hod' | 'librarian' | 'maintainer' | 'institution admin' | 'loading';
export type InstitutionType = 'school' | 'college';

interface UserState {
  fullName: string;
  email: string;
  phone: string;
  institutionId: string;
  institutionName: string;
  institutionCode: string;
  schoolId?: string;
  schoolName?: string;
  profilePic: string;
  language: 'en' | 'hi' | 'kn';
  userRole: UserRole;
  isEmailVerified: boolean;
  _hasHydrated: boolean;
  isProfileSynced: boolean;
  profileExists: boolean;

  mustChangePassword: boolean;
  profileCompleted: boolean;
  institutionType: InstitutionType;
  rollNoOrUSN: string;
  parentPhone: string;
  tenthPercentage: string;
  twelfthPercentage: string;
  employeeId: string;
  department: string;
  linkedStudentUSN: string;
  relation: string;
  qualification: string;
  experience: string;
  libraryBadgeId: string;
  designation: string;

  setUserProfile: (data: Partial<UserState>) => void;
  setIsProfileSynced: (state: boolean) => void;
  setProfileExists: (state: boolean) => void;
  resetUser: () => void;
  setHasHydrated: (state: boolean) => void;
  setSelectedInstitution: (id: string, name: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      fullName: '',
      email: '',
      phone: '',
      institutionId: '',
      institutionName: '',
      institutionCode: '',
      schoolId: '',
      schoolName: '',
      profilePic: '',
      language: 'en',
      userRole: 'loading',
      isEmailVerified: false,
      _hasHydrated: false,
      isProfileSynced: false,
      profileExists: false,

      mustChangePassword: false,
      profileCompleted: false,
      institutionType: 'college',
      rollNoOrUSN: '',
      parentPhone: '',
      tenthPercentage: '',
      twelfthPercentage: '',
      employeeId: '',
      department: '',
      linkedStudentUSN: '',
      relation: '',
      qualification: '',
      experience: '',
      libraryBadgeId: '',
      designation: '',

      setUserProfile: (data) =>
        set((state) => ({
          ...state,
          ...data,
          schoolId: data.institutionId ?? data.schoolId ?? state.schoolId,
          schoolName: data.institutionName ?? data.schoolName ?? state.schoolName,
          institutionId: data.institutionId ?? data.schoolId ?? state.institutionId,
          institutionName: data.institutionName ?? data.schoolName ?? state.institutionName,
        })),
      setIsProfileSynced: (state) => set({ isProfileSynced: state }),
      setProfileExists: (state) => set({ profileExists: state }),

      resetUser: () =>
        set({
          fullName: '',
          email: '',
          phone: '',
          institutionId: '',
          institutionName: '',
          institutionCode: '',
          schoolId: '',
          schoolName: '',
          profilePic: '',
          language: 'en',
          userRole: 'loading',
          isEmailVerified: false,
          isProfileSynced: false,
          profileExists: false,
          mustChangePassword: false,
          profileCompleted: false,
          institutionType: 'college',
          rollNoOrUSN: '',
          parentPhone: '',
          tenthPercentage: '',
          twelfthPercentage: '',
          employeeId: '',
          department: '',
          linkedStudentUSN: '',
          relation: '',
          qualification: '',
          experience: '',
          libraryBadgeId: '',
          designation: '',
        }),

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      setSelectedInstitution: (id: string, name: string) =>
        set({
          institutionId: id,
          institutionName: name,
          schoolId: id,
          schoolName: name,
        }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        fullName: state.fullName,
        email: state.email,
        phone: state.phone,
        institutionId: state.institutionId,
        institutionName: state.institutionName,
        institutionCode: state.institutionCode,
        schoolId: state.schoolId,
        schoolName: state.schoolName,
        profilePic: state.profilePic,
        language: state.language,
        mustChangePassword: state.mustChangePassword,
        profileCompleted: state.profileCompleted,
        rollNoOrUSN: state.rollNoOrUSN,
        parentPhone: state.parentPhone,
        tenthPercentage: state.tenthPercentage,
        twelfthPercentage: state.twelfthPercentage,
        employeeId: state.employeeId,
        department: state.department,
        linkedStudentUSN: state.linkedStudentUSN,
        relation: state.relation,
        qualification: state.qualification,
        experience: state.experience,
        libraryBadgeId: state.libraryBadgeId,
        designation: state.designation,
      }),
      version: 2,
      migrate: (persisted: any, version: number) => {
        if (version < 1) {
          if (persisted?.institutionType && persisted.institutionType !== 'school' && persisted.institutionType !== 'college') {
            persisted.institutionType = 'college';
          }
        }
        return persisted;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
