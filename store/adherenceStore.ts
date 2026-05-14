import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MedicationLog, AdherenceStats } from '../types';
import { secureStorage } from './storage';

interface AdherenceStore {
  logs: MedicationLog[];
  stats: AdherenceStats | null;
  isLoading: boolean;
  setLogs: (logs: MedicationLog[]) => void;
  setStats: (stats: AdherenceStats) => void;
  addLog: (log: MedicationLog) => void;
  updateLog: (log: MedicationLog) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useAdherenceStore = create<AdherenceStore>()(
  persist(
    (set) => ({
      logs: [],
      stats: {
        totalDoses: 100,
        totalTaken: 94,
        totalMissed: 6,
        adherencePercentage: 94,
        streakDays: 12,
      } as any,
      isLoading: false,

      setLogs: (logs) => set({ logs }),

      setStats: (stats) => set({ stats }),

      addLog: (log) => set((state) => ({
        logs: [...state.logs, log],
      })),

      updateLog: (log) => set((state) => ({
        logs: state.logs.map((l) =>
          l.id === log.id ? log : l
        ),
      })),

      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'medi-pulse-adherence-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
