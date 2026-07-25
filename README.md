# HelpRest Monorepo — Software Architecture & Orchestration Guide

Platform for discovering establishments based on dietary restrictions and accessibility requirements. Built as a monorepo containing a Bun-powered REST API and an Expo React Native mobile application.

---

## 1. Project Architecture

```
helprest-monorepo/
├── helprest-api/      # Backend — Bun runtime + TypeScript (Clean Architecture + DDD)
├── helprest-app/      # Mobile — React Native 0.79 + Expo SDK 53 (Expo Router v5)
├── agent-helprest/    # Engineering Agent Slot & System Memory
├── resources/         # Canonical documentation, API tests, assets & roadmap
├── docker-compose.yml     # Local Development Infrastructure (MongoDB + Redis + API)
├── docker-compose.prd.yml # Local Production Simulation (Dockerfile Build)
└── README.md              # Project Architecture & Orchestration Guide
```

---

## 2. Prerequisites & Environment Setup

### Required Tooling
- **Bun**: `v1.2+` (`curl -fsSL https://bun.sh/install | bash`)
- **Node.js**: `v20+` (Required for Expo CLI tooling)
- **Docker & Docker Compose**: `v20+` / `v2.0+`
- **Android Studio / Android SDK & JDK 17+**: Required for local Linux Android APK compilation.

### Environment File Configuration (`.env`)

Copy the template from `.env.example`:
```bash
cp .env.example .env
```

#### Local Development Mode (`.env`):
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://root:password@localhost:27017/helprest?authSource=admin
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-32-character-secret-key-goes-here
JWT_REFRESH_SECRET=your-32-character-refresh-secret-key
GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id
CORS_ORIGINS=*
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```
> **Note for Mobile API URL**: Use `http://10.0.2.2:3000` for Android Emulator or `http://localhost:3000` for iOS Simulator / Web.

#### Production Mode (Render & MongoDB Atlas):
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/helprest?retryWrites=true&w=majority
REDIS_URL=rediss://default:<password>@<redis-host>:6379
EXPO_PUBLIC_API_URL=https://helprest-api.onrender.com
```

---

## 3. High-Level Orchestration Commands

All commands can be run directly from the **monorepo root directory**:

### Infrastructure & Docker
| Command | Description |
|---|---|
| `bun run dev:infra` | Start local MongoDB & Redis containers |
| `bun run dev:up` | Start full dev stack (MongoDB + Redis + API with hot reload) |
| `bun run dev:logs` | Tail API logs in Docker |
| `bun run dev:down` | Stop dev containers |
| `bun run prd:up` | Build & run production Docker image locally |
| `bun run prd:down` | Stop production test containers |

### API Management (`helprest-api`)
| Command | Description |
|---|---|
| `bun run api:dev` | Run API locally with hot-reload (`bun run --hot`) |
| `bun run api:start` | Run API in production mode |
| `bun run api:seed` | Seed database locally |
| `bun run api:seed:docker` | Seed database inside Docker container |
| `bun run api:test` | Run API test suite |

### App Management (`helprest-app`)
| Command | Description |
|---|---|
| `bun run app:start` | Start Expo dev server |
| `bun run app:start:clear` | Start Expo dev server with cleared cache |
| `bun run app:android` | Run Android app on connected device/emulator |
| `bun run app:android:clean` | Run Android app bypassing build cache |
| `bun run app:android:nuke` | Clean gradle, nuke cache, prebuild & patch native signing |

---

## 4. Code Quality & Verification

Run strict typechecking and linting globally or per workspace:

```bash
# Global Verification (API + App)
bun run typecheck
bun run lint

# Individual Verification
bun run typecheck:api
bun run typecheck:app
bun run lint:api
bun run lint:app
```

---

## 5. Building Local Android APK on Linux (Without EAS)

You can compile standalone `.apk` files directly on Linux using Gradle without waiting for EAS cloud queues.

### Build Commands
```bash
# Build Debug APK
bun run app:build:apk:debug

# Build Signed Release APK
bun run app:build:apk:release
```

### Generated APK Locations
- **Debug APK**: `helprest-app/android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK**: `helprest-app/android/app/build/outputs/apk/release/app-release.apk`

### Automated Prebuild & Signing Patch
Running `build:apk:*` automatically triggers `prebuild:android`, which executes `scripts/patch-android-signing.js` to:
1. Link project keystore (`keys/keystore.jks`) so SHA-1 matches Google Sign-In registration.
2. Patch `styles.xml` with `Theme.EdgeToEdge` style.

### Cloud EAS Builds (Optional)
```bash
bun run app:eas:build-apk-cloud   # EAS Preview APK in Cloud
bun run app:eas:build-aab         # EAS Production AAB for Google Play
```

---

## 6. Standalone Execution (Subproject Independence)

Both subprojects can operate independently inside their respective directories:

### `helprest-api/`
```bash
cd helprest-api
bun run dev          # Hot-reload dev server
bun run start        # Production start
bun run seed         # Database seed
bun run test         # Bun test runner
bun run typecheck    # TypeScript strict check
bun run lint         # ESLint check
```

### `helprest-app/`
```bash
cd helprest-app
bun run start        # Expo start
bun run android      # Expo run:android
bun run nuke         # Reset native android project
bun run build:apk:release # Local APK build
bun run typecheck    # TypeScript strict check
bun run lint         # Expo lint
```

---

## 7. Render Deployment Specification

The backend `helprest-api` is configured for zero-friction deployment on Render:

1. Connect `helprest-monorepo` on Render.
2. Set Root Directory to `helprest-api`.
3. Build & Runtime selection: **Docker** (Render detects `helprest-api/Dockerfile`).
4. `Dockerfile` features:
   - Multi-stage build (prunes devDependencies).
   - Listens on Render's dynamic `$PORT`.
   - Runs under non-root `bun` user security.
   - Built-in HEALTHCHECK on `/api/health`.
