import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Medicine, MedicationLog, AdherenceStats } from '../types';

/**
 * Medication store interface
 */
interface MedicationStore {
  medicines: Medicine[];
  selectedMedicine: Medicine | null;
  isLoading: boolean;
  setMedicines: (medicines: Medicine[]) => void;
  setSelectedMedicine: (medicine: Medicine | null) => void;
  addMedicine: (medicine: Medicine) => void;
  updateMedicine: (medicine: Medicine) => void;
  removeMedicine: (id: string) => void;
  setIsLoading: (loading: boolean) => void;
}

/**
 * Medication state management using Zustand
 * Handles medicine data and selection state
 */
export const useMedicationStore = create<MedicationStore>()(
  persist(
    (set) => ({
      medicines: [],
      selectedMedicine: null,
      isLoading: false,

      setMedicines: (medicines) => set({ medicines }),

      setSelectedMedicine: (medicine) => set({ selectedMedicine: medicine }),

      addMedicine: (medicine) => set((state) => ({
        medicines: [...state.medicines, medicine],
      })),

      updateMedicine: (medicine) => set((state) => ({
        medicines: state.medicines.map((m) =>
          m.id === medicine.id ? medicine : m
        ),
      })),

      removeMedicine: (id) => set((state) => ({
        medicines: state.medicines.filter((m) => m.id !== id),
        selectedMedicine: state.selectedMedicine?.id === id ? null : state.selectedMedicine,
      })),

      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'medi-pulse-medications-storage',
    }
  )
);
