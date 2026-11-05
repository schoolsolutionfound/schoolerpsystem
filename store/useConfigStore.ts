import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface InstitutionConfig {
  institutionCode: string;
  institutionName: string;
  institutionType: string;
  departments: string[];
  academicYears: string[];
  yearsOfStudy: string[];
  courses: string[];
  sections: string[];
}

const EMPTY_INSTITUTION_CONFIG: InstitutionConfig = {
  institutionCode: '',
  institutionName: '',
  institutionType: '',
  departments: [],
  academicYears: [],
  yearsOfStudy: [],
  courses: [],
  sections: [],
};

interface ConfigState {
  maintenance: {
    enabled: boolean;
    minVersion: string;
  };
  institution: InstitutionConfig;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setMaintenance: (enabled: boolean, minVersion: string) => void;
  setInstitutionConfig: (config: Partial<InstitutionConfig>) => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      maintenance: {
        enabled: false,
        minVersion: '0.0.0',
      },
      institution: EMPTY_INSTITUTION_CONFIG,
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setMaintenance: (enabled, minVersion) =>
        set({ maintenance: { enabled, minVersion } }),
      setInstitutionConfig: (config) =>
        set((state) => ({
          institution: {
            ...state.institution,
            ...config,
            departments: config.departments ?? state.institution.departments,
            academicYears: config.academicYears ?? state.institution.academicYears,
            yearsOfStudy: config.yearsOfStudy ?? state.institution.yearsOfStudy,
            courses: config.courses ?? state.institution.courses,
            sections: config.sections ?? state.institution.sections,
          },
        })),
    }),
    {
      name: 'config-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        maintenance: state.maintenance,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
