import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'student' | 'teacher' | 'admin' | 'parent' | 'dev' | 'loading';
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
  isBypassUser: boolean;
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
      isBypassUser: false,
      _hasHydrated: false,
      isProfileSynced: false,
      profileExists: false,

      mustChangePassword: false,
      profileCompleted: false,
      institutionType: 'school',
      rollNoOrUSN: '',
      parentPhone: '',
      tenthPercentage: '',
      twelfthPercentage: '',

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
          isBypassUser: false,
          isProfileSynced: false,
          profileExists: false,
          mustChangePassword: false,
          profileCompleted: false,
          institutionType: 'school',
          rollNoOrUSN: '',
          parentPhone: '',
          tenthPercentage: '',
          twelfthPercentage: '',
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
      storage: createJSONStorage(() => AsyncStorage),
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
        isBypassUser: state.isBypassUser,
        mustChangePassword: state.mustChangePassword,
        profileCompleted: state.profileCompleted,
        institutionType: state.institutionType,
        rollNoOrUSN: state.rollNoOrUSN,
        parentPhone: state.parentPhone,
        tenthPercentage: state.tenthPercentage,
        twelfthPercentage: state.twelfthPercentage,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
