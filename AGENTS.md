# Repository Guidelines

## Project Overview

MediPulseAI is a React Native medication management app built with Expo SDK 52. It uses file-based routing via Expo Router, Zustand for state, SQLite for offline storage, and Supabase for cloud auth and data sync.

## Build & Development Commands

```bash
npm start          # Start Expo dev server (scan QR with Expo Go)
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run in browser
```

No test runner or linter is configured. TypeScript is the sole static check.

## Project Structure & Module Organization

```
app/               # Expo Router file-based routes (screens)
  _layout.tsx      # Root layout — PaperProvider, auth guard, session init
  index.tsx        # Entry/welcome screen
  auth/            # Login, register, forgot-password screens
  onboarding/      # Role selection and profile setup
  medications/     # List, add, edit, details screens
  dashboard/       # Dashboard screen
  adherence/       # Adherence tracking screen
components/        # Reusable RN Paper UI components (Button, Card, Input, etc.)
services/          # External integrations — all re-exported from services/index.ts
  supabaseClient   # Supabase client singleton
  authService      # Supabase auth helpers
  medicationService
  notificationService
  syncService      # Cloud sync logic
database/          # SQLite abstraction layer (separate from services/)
  sqliteService.ts # SQLiteService class — openDatabaseAsync, WAL mode, table creation
  medicationRepository.ts
store/             # Zustand stores — all re-exported from store/index.ts
  authStore        # Persisted to expo-secure-store via secureStorage
  medicationStore
  adherenceStore
  onboardingStore
  syncStore
  storage.ts       # Custom Zustand storage adapter using expo-secure-store
hooks/             # Custom hooks (useReminderScheduler, useStockMonitor)
constants/
  theme.ts         # React Native Paper custom theme (healthcare color palette)
types/index.ts     # All shared TypeScript types
utils/
  validation.ts    # Zod validation schemas
```

**Key architecture facts:**

- `app/_layout.tsx` is the single auth gate: it calls `getSession()` on mount, subscribes to `onAuthStateChange`, and shows `LoadingScreen` until `isLoading` resolves.
- Auth state is persisted across restarts via Zustand's `persist` middleware backed by `expo-secure-store` (see `store/storage.ts`).
- The app has a **dual-storage strategy**: `database/` (SQLite) handles offline-first local data; `services/syncService` syncs to Supabase when online.
- Services and stores each have a barrel `index.ts` — import from there, not from individual files.
- Notifications are initialized and scheduled through `useReminderScheduler` hook, which calls `notificationService` (not scheduled directly in screens).

## Coding Style & Naming Conventions

- **TypeScript strict mode** is enabled (`tsconfig.json`).
- Component files use PascalCase; hooks use `useCamelCase`; service/store files use camelCase.
- Stores expose a single `useXxxStore` hook created with `zustand/create`.
- No ESLint or Prettier config is present — follow existing file formatting.

## Environment Variables

Required in `.env` (not committed):

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Variables must be prefixed `EXPO_PUBLIC_` to be accessible in the bundle.
