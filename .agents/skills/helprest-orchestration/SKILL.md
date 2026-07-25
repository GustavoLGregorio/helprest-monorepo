---
name: helprest-orchestration
description: High-level orchestration guide, Docker management, script execution, local Android APK builds, and environment setup for HelpRest monorepo. Trigger when running, building, testing, linting, or dockerizing helprest-api or helprest-app.
---

# HelpRest Monorepo Orchestration Skill

This skill provides AI agents with comprehensive instructions for running, testing, building, and dockerizing the HelpRest monorepo (`helprest-api` and `helprest-app`) from the root directory or within subworkspaces.

## Core Directives

1. **Root-Level Execution**: Prefer running scripts from the monorepo root directory (`/`) using `bun run <script>` rather than changing working directories to `helprest-app` or `helprest-api`.
2. **Subproject Autonomy**: Ensure `helprest-api` (Render Docker deployable) and `helprest-app` (Expo / Gradle buildable) maintain independent execution capabilities inside their respective folders.
3. **Single-Task Rule Compliance**: When working on tasks in `todo.plan.md`, focus exclusively on one pending item `[ ]` per session and run typechecks/lints before marking as `[x]`.

## Workflow & Commands Summary

### 1. Infrastructure & Docker
- `bun run dev:infra`: Start local MongoDB (`:27017`) and Redis (`:6379`) containers.
- `bun run dev:up`: Start full development stack (MongoDB + Redis + API with hot reload).
- `bun run dev:logs`: Tail API logs in Docker.
- `bun run dev:down`: Stop development containers.
- `bun run prd:up`: Build and run the production Docker image locally via `docker-compose.prd.yml`.
- `bun run prd:down`: Stop production test containers.

### 2. Quality & Verification
- `bun run typecheck`: Run strict TypeScript checks for both API and App.
- `bun run lint`: Run ESLint for API and Expo Lint for App.
- `bun run api:test`: Run backend unit and integration test suite.

### 3. API Commands (`helprest-api`)
- `bun run api:dev`: Run API on host machine with hot-reload (`bun run --hot`).
- `bun run api:start`: Run API in production mode.
- `bun run api:seed`: Seed database on host machine.
- `bun run api:seed:docker`: Seed database inside running Docker container.

### 4. App & Native Android Commands (`helprest-app`)
- `bun run app:start`: Start Expo dev server.
- `bun run app:start:clear`: Start Expo dev server clearing cache.
- `bun run app:android`: Run Android app on device or emulator.
- `bun run app:android:clean`: Run Android app without Gradle build cache.
- `bun run app:android:nuke`: Clean Gradle, clear cache, re-run `expo prebuild --clean`, and apply `scripts/patch-android-signing.js`.

### 5. Local Android APK Compilation (Linux)
- `bun run app:build:apk:debug`: Build debug APK at `helprest-app/android/app/build/outputs/apk/debug/app-debug.apk`.
- `bun run app:build:apk:release`: Build signed release APK at `helprest-app/android/app/build/outputs/apk/release/app-release.apk`.

## Build Cache & Environment Auto-Resolution

1. **Incremental JS/UI Changes (Fast Re-build)**:
   - When modifying React Native screens, components, hooks, or API services, Gradle's incremental build engine re-uses **100% of pre-compiled native C++/NDK libraries and AAR dependencies**.
   - Subsequent APK compilation takes **~20-30 seconds** instead of full native re-compilation.
2. **Native Re-build Trigger (`app:android:nuke`)**:
   - Only execute `bun run app:android:nuke` when adding new Expo native packages, modifying `app.json` native plugins, or upgrading Expo SDK versions.
3. **Automated Linux Environment Handling**:
   - `build-apk.sh` automatically detects JDK 21 (`/opt/android-studio/jbr`), sets `ANDROID_HOME`, creates an `npm` CLI shim if `npm` is missing in `PATH`, patches `local.properties` (`sdk.dir`), and sets `CI=1` to guarantee non-interactive execution.

## Reference Material

- For detailed script definitions, see [scripts-guide.md](file:///home/gustavo/Dev/helprest/helprest-monorepo/.agents/skills/helprest-orchestration/references/scripts-guide.md).
- For Docker & ENV templates, see [docker-compose-templates.md](file:///home/gustavo/Dev/helprest/helprest-monorepo/.agents/skills/helprest-orchestration/resources/docker-compose-templates.md) and [env-templates.md](file:///home/gustavo/Dev/helprest/helprest-monorepo/.agents/skills/helprest-orchestration/resources/env-templates.md).
