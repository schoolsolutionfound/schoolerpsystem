import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ConfigState {
  maintenance: {
    enabled: boolean;
    minVersion: string;
  };
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      maintenance: {
        enabled: false,
        minVersion: '0.0.0',
      },
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),
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
