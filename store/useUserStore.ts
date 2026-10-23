import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorage } from './secureStorage';

export type UserRole = 'student' | 'teacher' | 'admin' | 'parent' | 'dev' | 'principal' | 'accountant' | 'hod' | 'librarian' | 'driver' | 'admission_officer' | 'institution admin' | 'loading';
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
  roles: string[];
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
  childId: string;
  childName: string;
  qualification: string;
  experience: string;
  libraryBadgeId: string;
  designation: string;
  accessibleModules: string[];

  setUserProfile: (data: Partial<UserState>) => void;
  switchRole: (newRole: UserRole) => void;
  setIsProfileSynced: (state: boolean) => void;
  setProfileExists: (state: boolean) => void;
  resetUser: () => void;
  setHasHydrated: (state: boolean) => void;
  setSelectedInstitution: (id: string, name: string) => void;
  hasModuleAccess: (moduleKey: string) => boolean;
  grantModuleAccess: (moduleKey: string) => void;
  revokeModuleAccess: (moduleKey: string) => void;
  toggleModuleAccess: (moduleKey: string) => void;
  setAccessibleModules: (modules: string[]) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
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
      roles: [] as string[],
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
      childId: '',
      childName: '',
      qualification: '',
      experience: '',
      libraryBadgeId: '',
      designation: '',
      accessibleModules: ['leaves', 'document_requests', 'reviews'],

      setUserProfile: (data) =>
        set((state) => ({
          ...state,
          ...data,
          roles: data.roles ?? (data.userRole ? [data.userRole] : state.roles),
          schoolId: data.institutionId ?? data.schoolId ?? state.schoolId,
          schoolName: data.institutionName ?? data.schoolName ?? state.schoolName,
          institutionId: data.institutionId ?? data.schoolId ?? state.institutionId,
          institutionName: data.institutionName ?? data.schoolName ?? state.institutionName,
          accessibleModules: data.accessibleModules ?? state.accessibleModules ?? ['leaves', 'document_requests', 'reviews'],
        })),
      switchRole: (newRole) =>
        set((state) => ({
          ...state,
          userRole: newRole,
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
          accessibleModules: ['leaves', 'document_requests', 'reviews'],
        }),

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      setSelectedInstitution: (id: string, name: string) =>
        set({
          institutionId: id,
          institutionName: name,
          schoolId: id,
          schoolName: name,
        }),

      hasModuleAccess: (moduleKey: string) => {
        // Universal core tabs
        const CORE_MODULES = [
          'dashboard',
          'homerooms',
          'fees',
          'staff',
          'timetable',
          'events',
          'notices',
          'schedule',
          'mark_attendance',
          'marks',
          'homework',
          'profile',
          'courses',
          'faculty',
          'eligibility',
          'attendance',
          'home',
          'locate',
          'chat',
          'reports',
        ];
        if (CORE_MODULES.includes(moduleKey)) return true;

        const currentStore = get();
        const modules = currentStore.accessibleModules;

        // If modules list exists, check inclusion
        if (Array.isArray(modules)) {
          return modules.includes(moduleKey);
        }

        // Executive fallback
        const role = currentStore.userRole;
        if (role === 'principal' || role === 'hod' || role === 'admin' || role === 'institution admin') {
          return true;
        }
        return false;
      },

      grantModuleAccess: (moduleKey: string) => {
        set((state) => {
          const current = state.accessibleModules || [];
          if (!current.includes(moduleKey)) {
            return { accessibleModules: [...current, moduleKey] };
          }
          return state;
        });
      },

      revokeModuleAccess: (moduleKey: string) => {
        set((state) => ({
          accessibleModules: (state.accessibleModules || []).filter((m) => m !== moduleKey),
        }));
      },

      toggleModuleAccess: (moduleKey: string) => {
        set((state) => {
          const current = state.accessibleModules || [];
          const has = current.includes(moduleKey);
          return {
            accessibleModules: has ? current.filter((m) => m !== moduleKey) : [...current, moduleKey],
          };
        });
      },

      setAccessibleModules: (modules: string[]) => set({ accessibleModules: modules }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        fullName: state.fullName,
        email: state.email,
        phone: state.phone,
        userRole: state.userRole,
        roles: state.roles,
        accessibleModules: state.accessibleModules,
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
        childId: state.childId,
        childName: state.childName,
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
