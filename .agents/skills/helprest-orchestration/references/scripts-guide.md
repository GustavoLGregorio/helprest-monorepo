# HelpRest Monorepo Scripts Reference

Detailed catalog of script definitions and targets across the monorepo workspaces.

## Root Level `package.json` Scripts

| Script Name | Command | Purpose |
|---|---|---|
| `dev:infra` | `docker compose up -d mongodb redis` | Spins up local DB & Redis infrastructure containers only. |
| `dev:up` | `docker compose up -d` | Spins up full development stack in Docker. |
| `dev:down` | `docker compose down` | Tears down local development containers. |
| `dev:logs` | `docker compose logs -f api` | Tails API container logs in real time. |
| `prd:up` | `docker compose -f docker-compose.prd.yml up -d --build` | Builds production API image and runs local production test stack. |
| `prd:down` | `docker compose -f docker-compose.prd.yml down` | Tears down production test containers. |
| `api:dev` | `cd helprest-api && bun run dev` | Runs API on host machine with hot-reloading (`--hot`). |
| `api:start` | `cd helprest-api && bun run start` | Runs API in production start mode on host machine. |
| `api:seed` | `cd helprest-api && bun run seed` | Runs database seed script on host machine. |
| `api:seed:docker` | `docker exec helprest-api bun run seed` | Runs database seed script inside the running API container. |
| `api:test` | `cd helprest-api && bun run test` | Executes Bun test runner for backend tests. |
| `app:start` | `cd helprest-app && bun run start` | Starts Expo development server for the mobile app. |
| `app:start:clear` | `cd helprest-app && bun run start:clear` | Starts Expo dev server clearing Metro & Expo cache. |
| `app:android` | `cd helprest-app && bun run android` | Launches Android app on connected device or emulator. |
| `app:android:clean` | `cd helprest-app && bun run android:clean` | Launches Android app bypassing Gradle build cache. |
| `app:android:nuke` | `cd helprest-app && bun run nuke` | Cleans gradle, clears cache, re-prebuilds native project, and applies signing patches. |
| `app:build:apk:debug` | `cd helprest-app && bun run build:apk:debug` | Compiles local debug APK via Gradle. |
| `app:build:apk:release` | `cd helprest-app && bun run build:apk:release` | Compiles signed release APK via Gradle. |
| `app:eas:login` | `cd helprest-app && bunx eas-cli login` | Logs in to EAS CLI for Expo Cloud builds. |
| `app:eas:build-apk-cloud` | `cd helprest-app && bunx eas-cli build --platform android --profile preview` | Builds preview APK in Expo Cloud. |
| `app:eas:build-apk-local` | `cd helprest-app && bunx eas-cli build --platform android --profile preview --local` | Builds preview APK locally via EAS CLI. |
| `app:eas:build-aab` | `cd helprest-app && bunx eas-cli build --platform android --profile production-aab` | Builds production AAB bundle for Google Play Store. |
| `typecheck` | `bun run typecheck:api && bun run typecheck:app` | Executes TypeScript strict typechecking on both subprojects. |
| `typecheck:api` | `cd helprest-api && bun run typecheck` | Executes TypeScript strict typechecking on the API. |
| `typecheck:app` | `cd helprest-app && bun run typecheck` | Executes TypeScript strict typechecking on the App. |
| `lint` | `bun run lint:api && bun run lint:app` | Executes ESLint (API) and Expo Lint (App) in sequence. |
| `lint:api` | `cd helprest-api && bun run lint` | Executes ESLint on backend source code. |
| `lint:app` | `cd helprest-app && bun run lint` | Executes Expo Lint on mobile app source code. |
