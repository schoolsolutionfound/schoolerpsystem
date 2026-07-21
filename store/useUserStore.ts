import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserRole = 'student' | 'teacher' | 'admin' | 'parent' | 'dev' | 'loading';

interface UserState {
  fullName: string;
  email: string;
  phone: string;
  schoolId: string;
  schoolName: string;
  profilePic: string;
  language: 'en' | 'hi' | 'kn';
  userRole: UserRole;
  isEmailVerified: boolean;
  isBypassUser: boolean;
  _hasHydrated: boolean;
  isProfileSynced: boolean;
  profileExists: boolean;

  setUserProfile: (data: Partial<UserState>) => void;
  setIsProfileSynced: (state: boolean) => void;
  setProfileExists: (state: boolean) => void;
  resetUser: () => void;
  setHasHydrated: (state: boolean) => void;
  setSelectedSchool: (id: string, name: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      fullName: '',
      email: '',
      phone: '',
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

      setUserProfile: (data) => set((state) => ({ ...state, ...data })),
      setIsProfileSynced: (state) => set({ isProfileSynced: state }),
      setProfileExists: (state) => set({ profileExists: state }),

      resetUser: () => set({
        fullName: '',
        email: '',
        phone: '',
        schoolId: '',
        schoolName: '',
        profilePic: '',
        language: 'en',
        userRole: 'loading',
        isEmailVerified: false,
        isBypassUser: false,
        isProfileSynced: false,
        profileExists: false,
      }),

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      setSelectedSchool: (id: string, name: string) => set({
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
        schoolId: state.schoolId,
        schoolName: state.schoolName,
        profilePic: state.profilePic,
        language: state.language,
        isBypassUser: state.isBypassUser,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
