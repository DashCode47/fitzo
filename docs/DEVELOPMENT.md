# Iron Body - Documentation Technical Guide

Welcome to the **Iron Body** frontend documentation. This project is a mobile application built with **Expo** and **React Native**, designed to integrate directly with **Supabase** for authentication and data management.

## 🚀 Tech Stack

- **Framework**: [Expo](https://expo.dev/) (SDK 54)
- **Language**: TypeScript
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Database & Auth**: [Supabase](https://supabase.com/)
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
│   ├── _layout.tsx  # Root layout, Providers
│   ├── profile.tsx  # User Profile & Settings
│   └── login.tsx    # Auth entry point
├── components/      # UI components
│   ├── home/        # Home-screen complex pieces (PromoCarousel, etc.)
│   └── ui/          # Shared components
├── constants/       # Mocks, Theme (Colors), Routes
├── hooks/           # Custom hooks (Navigation, Store helpers)
├── lib/             # Client initializations (Supabase)
├── store/           # Zustand global state (useAppStore.ts)
└── utils/           # Async helpers, timeouts
```

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

> [!IMPORTANT]
> Always use the `EXPO_PUBLIC_` prefix for variables to be accessible in client-side code during builds.
