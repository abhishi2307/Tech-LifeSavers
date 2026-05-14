import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Appointment } from '../types';
import { secureStorage } from './storage';

interface AppointmentStore {
  appointments: Appointment[];
  isLoading: boolean;
  setAppointments: (appointments: Appointment[]) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (appointment: Appointment) => void;
  removeAppointment: (id: string) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useAppointmentStore = create<AppointmentStore>()(
  persist(
    (set) => ({
      appointments: [],
      isLoading: false,
      setAppointments: (appointments) => set({ appointments }),
      addAppointment: (appointment) =>
        set((state) => ({ appointments: [...state.appointments, appointment] })),
      updateAppointment: (appointment) =>
        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === appointment.id ? appointment : a
          ),
        })),
      removeAppointment: (id) =>
        set((state) => ({
          appointments: state.appointments.filter((a) => a.id !== id),
        })),
      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    { name: 'medi-pulse-appointments-storage', storage: createJSONStorage(() => secureStorage) }
  )
);
