# HelpRest Frontend — Architecture & Patterns

## Overview

The HelpRest mobile app is built with **React Native 0.79** + **Expo SDK 53** using **Expo Router v5** for file-based navigation and **TypeScript** throughout.

**Dev command:** `npx expo start`  
**Android build:** `npx expo run:android`

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | React Native 0.79 + Expo SDK 53 |
| Navigation | Expo Router v5 (file-based) |
| Server State | TanStack Query v5 |
| Local Storage | MMKV (react-native-mmkv) |
| Maps | react-native-maps + expo-maps |
| Auth | expo-auth-session (Google OAuth2) |
| Images | expo-image |
| Animations | react-native-reanimated |
| Icons | @expo/vector-icons (MaterialCommunityIcons) |

---

## Directory Structure

```
helprest-app-dev/
├── app/                    → Expo Router file-based routes
│   ├── _layout.tsx         → Root layout (QueryClient, auth guard)
│   ├── (auth)/             → Authentication routes (unauthenticated)
│   │   ├── home.tsx        → Login screen (Google / email)
│   │   └── register/      → Onboarding steps (step1-step4)
│   └── (app)/              → Authenticated routes
│       ├── (tabs)/         → Tab bar (Home, Places, Social)
│       └── details/        → Establishment detail screens
├── components/             → Reusable UI components
│   ├── atoms/              → Smallest units (MiddleDot, TextDistance)
│   ├── ui/                 → UI primitives (Card, StarReview, UserBar, etc.)
│   └── login/              → Login/register components (Container, LoginOption, etc.)
├── services/               → API and auth service layer
│   ├── api.ts              → Centralized HTTP client with auto-refresh
│   └── auth.ts             → Google OAuth2 sign-in hook
├── storage/                → MMKV persistence
│   ├── authTokens.ts       → JWT tokens + Google user info
│   └── userLoginStatus.ts  → Legacy login status (deprecated)
├── utils/                  → Utility functions
│   ├── saveUserRegisterInfo.ts → MMKV helpers for registration data
│   ├── saveUserLocation.ts → Location persistence
│   └── useHarvesineDistance.ts → Distance calculation
├── hooks/                  → React hooks
│   └── queries/            → TanStack Query hooks
├── constants/              → App constants (Colors, etc.)
├── styles/                 → Global styles
└── assets/                 → Images, icons, fonts
```

---

## Authentication Flow

### Google OAuth2

1. **App starts** → `_layout.tsx` checks for stored JWT tokens in MMKV
2. **Has tokens** → redirect to `/(app)/(tabs)/(home)`
3. **No tokens** → redirect to `/(auth)/home` (login screen)
4. **User taps "Continuar com o Google"** → `expo-auth-session` triggers Google consent
5. **Google returns ID Token** → sent to `POST /api/auth/google` on backend
6. **Backend verifies** → returns HelpRest JWT pair + `isNewUser` flag + user data
7. **New user** → navigate to onboarding (steps 1-4)
8. **Returning user** → navigate directly to home

### Onboarding Steps (Google users: 4 steps)

| Step | Collects | MMKV Key |
|---|---|---|
| Step 1 | Name (pre-populated from Google) | `userName` |
| Step 2 | Birth date | `userBirthDate` |
| Step 3 | Default location/address | `userDefaultLocation` |
| Step 4 | Dietary flags selection | *(sends directly to API)* |

Step 4 finalizes registration by calling `PATCH /api/users/me` with all collected data, then navigates to home.

---

## Services Layer

### `services/api.ts`

Centralized API client:
- Base URL from `EXPO_PUBLIC_API_URL` env variable
- `api.get()`, `api.post()`, `api.patch()`, etc.
- Automatic `Authorization: Bearer <token>` injection when `authenticated: true`
- Auto-refresh: on 401 response, calls `POST /api/auth/refresh` with stored refresh token, retries request

### `services/auth.ts`

Google sign-in hook using `expo-auth-session/providers/google`:
- `useGoogleAuth()` returns `{ signInWithGoogle, isReady }`
- `signInWithGoogle()` → triggers Google popup → sends ID token to API → saves tokens in MMKV → returns `{ success, isNewUser, user }`

---

## Storage Layer (MMKV)

### `storage/authTokens.ts`

- `saveTokens(accessToken, refreshToken)` / `loadTokens()` / `clearTokens()`
- `saveGoogleUserInfo(user)` / `loadGoogleUserInfo()` / `clearGoogleUserInfo()`
- `isAuthenticated()` → checks if tokens exist

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `GOOGLE_MAPS_ANDROID_API_KEY` | Google Maps API key for Android |
| `GOOGLE_OAUTH_CLIENT_ID` | Google OAuth2 client ID |
| `EXPO_PUBLIC_API_URL` | Backend API base URL (default: `http://10.0.2.2:3000`) |
