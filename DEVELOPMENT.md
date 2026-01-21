# Iron Body - Documentation Technical Guide

Welcome to the **Iron Body** frontend documentation. This project is a mobile application built with **Expo** and **React Native**, designed to integrate directly with **Supabase** for authentication and data management.

## 🚀 Tech Stack

- **Framework**: [Expo](https://expo.dev/) (SDK 54)
- **Language**: TypeScript
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **State Management**: React Hooks & Context
- **Icons**: @expo/vector-icons (FontAwesome, MaterialIcons)
- **Styling**: React Native StyleSheet + Expo Linear Gradient
- **Storage**: Expo SecureStore (for JWT management)

---

## 📂 Project Structure

```text
├── api/             # Supabase data fetching modules (centralized logic)
├── app/             # Expo Router screens and layouts
│   ├── (tabs)/      # Bottom tab navigation screens
│   ├── _layout.tsx  # Root layout with SafeAreaProvider & Providers
│   └── index.tsx    # Login screen (Entry point)
├── components/      # Reusable UI components
│   ├── home/        # Home-screen specific sub-components
│   └── ui/          # Generic UI components (CustomModal, etc.)
├── constants/       # App-wide constants (Routes, Colors, Mocks)
├── hooks/           # Custom React hooks (Navigation, Theme)
├── lib/             # Third-party library initializations (Supabase client)
└── services/        # Legacy services (being phased out for api/ folder)
```

---

## 🔐 Authentication Flow

The app uses a custom **Login by Cedula** flow integrated with Supabase:

1.  **Email Lookup**: The user enters their National ID (Cedula). A Supabase RPC function `get_email_by_national_id` finds the corresponding email in the private auth schema.
2.  **OTP Generation**: `AuthAPI.signInWithOtp` sends a verification code to the found email.
3.  **OTP Verification**: The user enters the code, and `AuthAPI.verifyOtp` validates it and establishes a session.
4.  **Session Persistence**: The JWT access token is stored in `Expo.SecureStore` for session recovery.

### Registration
Registration is handled directly via `supabase.auth.signUp`. A database trigger (`handle_new_user`) in the Supabase backend automatically populates the `public.users` and `public.profiles` tables upon successful signup.

---

## 🗺️ Navigation & Routing

Navigation is centralized in `constants/routes.ts` and managed via a custom hook:

-   **Routes**: All paths are defined in `ROUTES` constant.
-   **Hook**: Use `useAppNavigation()` for common actions like `goToHome()`, `goToProfile()`, or `goBack()`. This ensures type safety and makes refactoring easier.

---

## 💅 Design System & Safe Areas

-   **Theme**: The app follows a premium dark theme with gold accents (`#C5A356`).
-   **Safe Areas**: Always wrap screen content with `SafeAreaView` from `react-native-safe-area-context` to handle device notches and status bars correctly across iOS and Android.

---

## 🛠️ Adding New Features

### 1. New API Endpoint
1.  Add the query logic to the relevant file in `api/` (e.g., `api/user.ts`).
2.  Use the `supabase` client from `@/lib/supabase`.

### 2. New Screen
1.  Create a new file in `app/`.
2.  Register the route in `constants/routes.ts`.
3.  Update `useAppNavigation.ts` if a named navigation method is needed.
4.  Configure the screen header/visibility in `app/_layout.tsx`.

### 3. New Component
1.  Create the component in `components/`.
2.  Keep it pure if possible, receiving data via props.

---

## ⚙️ Configuration

### Supabase
Ensure your `lib/supabase.ts` contains the correct `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

### RLS Policies
The database uses Row Level Security (RLS). Ensure any new tables have policies allowing access to `authenticated` users, typically using the `auth.uid()` check against the `id` column.
