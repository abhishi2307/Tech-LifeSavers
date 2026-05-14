import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { FamilyMember } from '../types';
import { secureStorage } from './storage';

interface FamilyStore {
  members: FamilyMember[];
  isLoading: boolean;
  setMembers: (members: FamilyMember[]) => void;
  addMember: (member: FamilyMember) => void;
  updateMember: (member: FamilyMember) => void;
  removeMember: (id: string) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useFamilyStore = create<FamilyStore>()(
  persist(
    (set) => ({
      members: [
        {
          id: 'fam-1',
          name: 'Om',
          relationship: 'Sibling',
          phoneNumber: '+91 9876543210',
          email: 'om@family.ai',
          bloodGroup: 'O+',
          isCaregiver: false,
          emergencyContact: true,
        },
        {
          id: 'fam-2',
          name: 'Aarti',
          relationship: 'Spouse',
          phoneNumber: '+91 9876543211',
          email: 'aarti@family.ai',
          bloodGroup: 'B+',
          isCaregiver: true,
          emergencyContact: true,
        }
      ],
      isLoading: false,
      setMembers: (members) => set({ members }),
      addMember: (member) => set((state) => ({ members: [...state.members, member] })),
      updateMember: (member) =>
        set((state) => ({
          members: state.members.map((m) => (m.id === member.id ? member : m)),
        })),
      removeMember: (id) =>
        set((state) => ({ members: state.members.filter((m) => m.id !== id) })),
      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'medi-pulse-family-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
