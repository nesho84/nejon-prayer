# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical: Expo SDK version

This project is on **Expo SDK 56 / React Native 0.85 / React 19**. Expo APIs change between
major versions — consult the versioned docs at https://docs.expo.dev/versions/v56.0.0/ before
writing any Expo/RN code (see `AGENTS.md`). Do not assume APIs from other SDK versions.

## Commands

```bash
npm test                                    # run full Jest suite
npx jest __tests__/utils/datetime-test.ts   # run a single test file
npx jest -t "marks prayer as prayed"        # run tests matching a name
npm run lint                                 # expo lint (eslint-config-expo, flat config)
npx tsc --noEmit                             # typecheck (strict mode is on)

npx expo start                               # Metro for Expo Go (JS-only, no native modules)
npx expo run:android                         # build + install dev-client APK (needed for native modules)
npx expo prebuild --clean                    # regenerate android/ after native config changes
```

Native modules (`react-native-mmkv`, `react-native-notify-kit`, `react-native-track-player`,
`react-native-nitro-modules`, sensors) **do not work in Expo Go** — use the dev client.
See `README.md` for the full build/EAS/OTA/Sentry workflow.

### Do not bump `react-native-track-player`

It is held at `^5.0.0-alpha0` (resolving to the `5.0.0-alpha0-nightly-cad7f4b0...` build), and
`react-native-track-player` is intentionally listed under `expo.doctor.reactNativeDirectoryCheck.exclude`.
This is **not** an old/legacy version: it is the last **Apache-2.0 (free)** build of the v5
New-Architecture rewrite (TurboModule + JSI, Media3 on Android), frozen right before the project
was renamed to `@rntp/player` and relicensed as commercial. So we already have the New-Arch engine
for free, and the doctor exclusion is expected (the pinned nightly isn't in the RN directory).

- **Don't "upgrade" it.** `@rntp/player` v5.x is the same engine but requires a **paid commercial
  license** to ship to end users (distributing an app — even free — is "commercial use" per
  rntp.dev/terms). Downgrading to stable v4.x is a **regression**: legacy ExoPlayer2 bridge
  instead of Media3/New-Arch, and its `State` enum differs enough to break the switch in
  `src/hooks/useQuranSetup.ts`.
- **If the pinned build ever breaks on a newer SDK**, the migration to `@rntp/player` is a ~1:1
  import rename (the v5 API matches what we already call): swap `'react-native-track-player'` →
  `'@rntp/player'` in `index.ts`, `src/hooks/useQuranSetup.ts`, `src/app/(tabs)/quran-tab.tsx`,
  `src/services/resetAppService.ts`, and the two test mocks; then buy a license and re-test
  background/lock-screen playback on the dev client.

## Path aliases

- `@/*` → `src/*`
- `@/assets/*` → `assets/*`

## Architecture

Detailed architecture (stores table, sync-hook responsibilities, external APIs, prayer-method
selection, notification types) lives in `README.md` under "Architecture" — read it before
making cross-cutting changes. Key points to internalize:

- **Routing** is Expo Router (file-based). `src/app/_layout.tsx` gates the app behind
  `onboardingStore.onboardingComplete` using `<Stack.Protected>`. Route groups: `(tabs)`,
  `(modals)` (transparent bottom sheets), `(onboarding)`, `(shared)`, plus `extras/` and `quran/`.

- **State** is Zustand. Stores in `src/store/` are persisted to **MMKV** via the `persist`
  middleware + the shared `mmkvStorage` adapter in `src/store/storage.ts`. MMKV is synchronous,
  so stores are readable at startup. `deviceSettingsStore` and `modalStore` are *not* persisted.

- **Sync hooks** (`src/hooks/use*Sync.ts`, `useQuranSetup`) are all invoked once in `RootLayout`
  and own the side effects (reschedule notifications, reload prayer times, load Quran JSON,
  track theme/permissions). Put cross-cutting reactive effects here, not in screens.

- **Service layer** (`src/services/`) wraps external APIs and device/native modules
  (prayers/aladhan, quran/alquran.cloud, location, notifications, sound, holidays). Stores call
  services; components call stores.

- **`index.js`** registers background handlers that run when the app is killed:
  `TrackPlayer` remote playback events and `notifee.onBackgroundEvent` (notification delivery →
  `syncNotificationsInBackground`, "done" action → mark prayer prayed). These call
  `useStore.getState()` directly (not hooks) to **avoid the store ↔ service circular dependency** —
  preserve that pattern when adding background logic.

- **i18n**: `languageStore` holds the active language; strings live in `src/constants/translations/`
  per feature and language (en/de/sq/tr). Supported: English, German, Albanian, Turkish.

- **`src/debug/notificationsTests.ts`** duplicates the notification payload shapes built in
  `src/services/notificationsService.ts` (used by the debug panel to fire test notifications).
  It is **not** imported by or derived from that file — the two are hand-kept in sync. Any change
  to a notification's `data`/`android`/`ios` payload (channels, categories, actions, fields) must
  be mirrored in both files, or the debug tool will silently test a stale shape.

## Refactoring checklist

Before calling a rename/removal done, `grep` the **whole repo** for every removed/renamed
symbol, string, or id (not just the file you were editing) — this codebase has more than one
place that duplicates a payload/shape by hand (see `notificationsTests.ts` above), and a
same-directory or even same-file check will miss those siblings.

## Testing

`__tests__/` mirrors `src/` and covers utils, stores, services, hooks, components, and screens
(`jest-expo` preset, `@testing-library/react-native`). When adding a store/service/hook/component,
add the matching test under the parallel `__tests__/` path. `jest` runs in `silent` mode (configured in
`package.json`). Keep `react-test-renderer` pinned to the exact `react` version.

## Error tracking

Sentry is initialized in `src/app/_layout.tsx` (`enabled: !__DEV__`, so it's off in dev) and the
root component is wrapped with `Sentry.wrap`. Background handlers in `index.js` call
`Sentry.captureException` in their catch blocks — follow that for new background error paths.
