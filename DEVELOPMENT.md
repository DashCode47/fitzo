# Iron Body - Documentation Technical Guide

Welcome to the **Iron Body** frontend documentation. This project is a mobile application built with **Expo** and **React Native**, designed to integrate directly with **Supabase** for authentication and data management, and **Radar** for geofencing.

## 🚀 Tech Stack

- **Framework**: [Expo](https://expo.dev/) (SDK 54)
- **Language**: TypeScript
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Geofencing**: [Radar](https://radar.com/)
- **State Management**: React Hooks & [Zustand](https://github.com/pmndrs/zustand) (with Persistence)
- **Icons**: @expo/vector-icons (Ionicons, MaterialIcons)
- **Styling**: React Native StyleSheet + Expo Linear Gradient
- **Storage**: Expo SecureStore (for JWT management)

---

## 📂 Project Structure

```text
├── api/             # Supabase data fetching (Auth, User, Content, Nutrition, Banners)
├── app/             # Expo Router screens
│   ├── (tabs)/      # Bottom tab navigation (Home, Nutrition, Rankings, Store)
│   ├── _layout.tsx  # Root layout, Radar init, Providers
│   ├── profile.tsx  # User Profile & Settings
│   └── login.tsx    # Auth entry point
├── components/      # UI components
│   ├── home/        # Home-screen complex pieces (PromoCarousel, etc.)
│   └── ui/          # Shared components
├── constants/       # Mocks, Theme (Colors), Routes
├── hooks/           # Custom hooks (Navigation, Store helpers)
├── lib/             # Client initializations (Supabase, Radar)
├── store/           # Zustand global state (useAppStore.ts)
└── utils/           # Async helpers, timeouts
```

---

## 📡 Geofencing (Radar Integration)

The app uses **Radar** to detect when users enter the gym automatically:
- **Initialization**: Handled in `app/_layout.tsx` via `RadarService`.
- **Flow**: When a user logs in, Radar identifies them (`userId`).
- **Permissions**: A custom screen `location-permission.tsx` manages the "Always Allow" location requirement.
- **Background**: Configured to run in the background to detect arrives even when the app is closed.

---

## 🥗 Nutrition & Diet Plans

Nutrition is a core feature that syncs local state with remote plans:
- **State**: The `activeDiet` is managed in the Zustand store.
- **Logic**: If a user has a plan in the database, it shows their macros. If not, it prompts them to create one.
- **Mocks**: Uses fallback `MOCK_NUTRITION` if the network fails.

---

## 🏆 Gamification & Rankings

The "Iron Legends" system rewards users:
- **Points**: Users earn points via gym visits and activities (stored in `profiles.total_points`).
- **Leaderboard**: Fetched via `LeaderboardAPI`.
- **Scanner**: `app/scanner.tsx` allows users to scan QR codes for attendance/events.

---

## 🔐 Authentication Flow

The app uses a custom **Login by Cedula** flow:
1.  **Email Lookup**: `AuthAPI.get_email_by_national_id` finds the record.
2.  **OTP**: `AuthAPI.signInWithOtp` sends the code.
3.  **Persistence**: Sessions are managed by Superbase and recovered automatically on app start.

---

## 💅 Design System

- **Primary Colors**: Gold (`#C5A356`), Dark BG (`#000000`).
- **Typography**: Uses modern sans-serif fonts via Expo.
- **Glassmorphism**: Subtle usage in overlays and podium components.

---

## 🛠️ Adding New Features

### 1. New API Endpoint
Add it to `api/` using the base `supabase` client. Always include `.catch()` or try-catch blocks for mobile stability.

### 2. Global State
Use `useAppStore.ts`. Data in the store is persisted in `AsyncStorage` automatically.

### 3. Navigation
Update `hooks/useAppNavigation.ts` to expose new route methods.

---

## ⚙️ Environment Variables

Managed in `env.ts` and `.env`:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_RADAR_PUBLISHABLE_KEY`

> [!IMPORTANT]
> Always use the `EXPO_PUBLIC_` prefix for variables to be accessible in client-side code during builds.
