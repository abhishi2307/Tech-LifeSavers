import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorage } from './storage';

/**
 * Sync store interface
 */
interface SyncStore {
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingItems: number;
  syncErrors: number;
  setIsSyncing: (syncing: boolean) => void;
  setLastSyncTime: (time: string) => void;
  setPendingItems: (count: number) => void;
  setSyncErrors: (count: number) => void;
  incrementSyncErrors: () => void;
}

/**
 * Sync state management using Zustand
 * Handles synchronization status and metrics
 */
export const useSyncStore = create<SyncStore>()(
  persist(
    (set) => ({
      isSyncing: false,
      lastSyncTime: null,
      pendingItems: 0,
      syncErrors: 0,

      setIsSyncing: (syncing) => set({ isSyncing: syncing }),

      setLastSyncTime: (time) => set({ lastSyncTime: time }),

      setPendingItems: (count) => set({ pendingItems: count }),

      setSyncErrors: (count) => set({ syncErrors: count }),

      incrementSyncErrors: () => set((state) => ({
        syncErrors: state.syncErrors + 1,
      })),
    }),
    {
      name: 'medi-pulse-sync-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
