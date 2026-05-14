import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Medicine, MedicationLog, AdherenceStats } from '../types';
import { secureStorage } from './storage';

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
      medicines: [
        {
          id: 'mock-1',
          userId: 'mock-user',
          name: 'Amoxicillin',
          dosage: '500mg',
          medicineType: 'capsule',
          frequency: 'twice_daily',
          timings: ['08:00', '20:00'],
          stockCount: 24,
          refillThreshold: 5,
          startDate: new Date().toISOString(),
          isActive: true,
          instructions: 'Take after meal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'mock-2',
          userId: 'mock-user',
          name: 'Vitamin D3',
          dosage: '1000 IU',
          medicineType: 'tablet',
          frequency: 'once_daily',
          timings: ['09:00'],
          stockCount: 52,
          refillThreshold: 10,
          startDate: new Date().toISOString(),
          isActive: true,
          instructions: 'Take in the morning',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ],
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
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
