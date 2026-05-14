import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MedicationLog, AdherenceStats } from '../types';

/**
 * Adherence store interface
 */
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

/**
 * Adherence state management using Zustand
 * Handles medication logs and adherence statistics
 */
export const useAdherenceStore = create<AdherenceStore>()(
  persist(
    (set) => ({
      logs: [],
      stats: null,
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
    }
  )
);
