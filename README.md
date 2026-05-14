# MediPulse AI

A modern healthcare companion app built with Expo Router, React Native, and TypeScript.

## Tech Stack

- **Framework**: Expo Router (file-based routing)
- **UI Library**: React Native Paper (Material Design 3)
- **State Management**: Zustand
- **Database**: SQLite (expo-sqlite) for offline storage
- **Backend**: Supabase (authentication and cloud database)
- **Language**: TypeScript
- **Animations**: React Native Reanimated

## Project Structure

```
MediPulseAI/
├── app/                    # Expo Router routes
│   ├── _layout.tsx        # Root layout with theme provider
│   ├── index.tsx          # Welcome screen
│   ├── auth/              # Authentication screens
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── dashboard/         # Dashboard screen
│       └── index.tsx
├── components/            # Reusable UI components
│   └── LoadingScreen.tsx
├── features/              # Feature-specific modules
├── services/              # External service integrations
│   └── supabaseClient.ts
├── database/              # Database services
│   └── sqliteService.ts
├── hooks/                 # Custom React hooks
├── store/                 # Zustand global state
│   ├── authStore.ts
│   ├── onboardingStore.ts
│   └── index.ts
├── utils/                 # Utility functions
│   └── validation.ts
├── constants/             # App constants
│   └── theme.ts
├── types/                 # TypeScript type definitions
│   └── index.ts
└── assets/                # Images, fonts, etc.
```

## Features

- **Authentication**: Email/password login and registration
- **Dashboard**: Overview of medications, reminders, and quick actions
- **Theme**: Dark blue healthcare palette with accessibility-friendly colors
- **Offline Support**: SQLite database for local medication storage
- **Modular Architecture**: Scalable structure for future features

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Expo Go app (for testing on mobile)
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running the App

```bash
# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

## Architecture

### State Management

- **Zustand** is used for global state management
- `authStore`: Handles authentication state and user profile
- `onboardingStore`: Tracks onboarding progress

### Database

- **SQLite** (expo-sqlite) for offline medication storage
- **Supabase** for cloud database and authentication
- Database service layer provides clean abstraction

### Navigation

- **Expo Router** for file-based routing
- Loading-safe navigation structure
- Protected routes for authenticated users

### Theme

- **React Native Paper** with Material Design 3
- Custom healthcare color palette
- Accessibility-friendly contrast ratios
- Modern rounded UI components

## Future Features

- Medication reminders with notifications
- Family member management
- OCR for prescription scanning
- AI-powered health insights
- Offline sync with cloud
- Medication adherence tracking
- Caregiver dashboard

## Expo Go Compatibility

This project is fully compatible with Expo Go for development and testing.

## License

Proprietary - All rights reserved
