# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical: Expo SDK version

This project is on **Expo SDK 57 / React Native 0.86 / React 19**. Expo APIs change between
major versions — consult the versioned docs at https://docs.expo.dev/versions/v57.0.0/ before
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

Native modules (`react-native-mmkv`, `react-native-notify-kit`, `react-native-nitro-modules`,
sensors) **do not work in Expo Go** — use the dev client.
See `README.md` for the full build/EAS/OTA/Sentry workflow.

### Quran audio (expo-audio)

The Quran player uses `expo-audio` via a module-level singleton wrapped in
`src/services/quranAudioService.ts` — the only file that may import expo-audio playback APIs
(components/hooks go through the service; `useAudioPlayerStatus` in `quran-tab.tsx` is the one
exception, fed by `getQuranPlayer()`). Lock-screen/notification controls are handled natively
(no JS playback service); the media notification offers play/pause only — no Stop button.
Background playback needs the `expo-audio` config plugin with `enableBackgroundPlayback: true`
in `app.json` and `setActiveForLockScreen` (called in `playSurah`), otherwise Android kills
audio after ~3 min in background.

- `isSwitching` in `quranAudioStore` is released by the **status listener** in `useQuranSetup`
  (first *loaded* playing / error / finish tick), not by the tab handlers — releasing it earlier
  flickers the row's progress bar while stale duration ticks arrive. The `isLoaded` half matters:
  during a switch ExoPlayer reports `playing: true` for the OLD surah for the whole download
  (`playing` is the *intended* state while `STATE_BUFFERING`), so a bare `status.playing` check
  releases the lock and kills the spinner. Only visible on slow connections.
- **Known regression vs RNTP — investigated Aug 2026, accepted, not being chased.** Swiping the
  app from recents is **not consistent**: the first kill in a session tears down audio and the
  notification, a later kill leaves both running. Stopping from the tray then reopening shows a
  stale "playing" icon that pressing stop clears — low frequency, no data loss, hence parked.
  **The JS runtime is not dead** — the media foreground service keeps the process alive, so
  `quranAudioStore` (not persisted) is never reset and freezes at the last tick received. Do not
  assume a dead process here; a JS-side *recovery* is possible. What was ruled out and found:
  - expo-audio 57.0.4 / expo 57.0.15 — the fix for expo#46137 shipped as expo#46147 in 56.0.10
    and is already in our copy. **Upgrading is not the answer.**
  - `AudioControlsService.setPlayerOptions` branches on player identity: the first activation
    calls `startForeground()`, later activations with the *same* player only call `notify()`.
    With a module-singleton player, a second `playSurah` in a surviving runtime always takes the
    weaker branch.
  - `stopPlayback()` → `clearLockScreenControls()` → `unregisterPlayer()` calls
    `stopForeground(STOP_FOREGROUND_REMOVE)` but never unbinds, and media3 treats `stopSelf` as a
    no-op while a controller is still bound.
  - `AudioControlsService` has no `onTaskRemoved` handler (RNTP used
    `AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification`), so *clearing the notification*
    still needs native work. Upstream: androidx/media#805 — `onTaskRemoved` not called on recents
    dismissal, OEM-conditional.
  - Starting point if a frozen-state report ever comes in: `player.currentStatus` is a
    synchronous property read that needs no live subscription.

## Path aliases

- `@/*` → `src/*`
- `@/assets/*` → `assets/*`

## Architecture

Detailed architecture (stores table, sync-hook responsibilities, external APIs, prayer-method
selection, notification types) lives in `README.md` under "Architecture" — read it before
making cross-cutting changes. Key points to internalize:

- **Routing** is Expo Router (file-based). `src/app/_layout.tsx` gates the app behind
  `onboardingStore.onboardingComplete` using `<Stack.Protected>`. Route groups: `(tabs)`,
  `(modals)` (transparent bottom sheets), `(onboarding)`, plus `extras/` and `quran/`.

- **State** is Zustand. Stores in `src/store/` are persisted to **MMKV** via the `persist`
  middleware + the shared `mmkvStorage` adapter in `src/store/storage.ts`. MMKV is synchronous,
  so stores are readable at startup. `deviceSettingsStore` and `modalStore` are *not* persisted.

- **Sync hooks** (`src/hooks/use*Sync.ts`, `useQuranSetup`) are all invoked once in `RootLayout`
  and own the side effects (reschedule notifications, reload prayer times, load Quran JSON,
  track theme/permissions). Put cross-cutting reactive effects here, not in screens.

- **Service layer** (`src/services/`) wraps external APIs and device/native modules
  (prayers/aladhan, quran/alquran.cloud, location, notifications, sound, holidays). Stores call
  services; components call stores.

- **`index.ts`** registers the background handler that runs when the app is killed:
  `notifee.onBackgroundEvent` (notification delivery → `syncNotificationsInBackground`,
  "done" action → mark prayer prayed). It calls `useStore.getState()` directly (not hooks)
  to **avoid the store ↔ service circular dependency** — preserve that pattern when adding
  background logic.

- **i18n**: `languageStore` holds the active language; strings live in `src/constants/translations/`
  per feature and language (en/de/fr/sq/bs/mk/tr/ar). Supported: English, German, French, Albanian,
  Bosnian, Macedonian, Turkish, Arabic.

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

Sentry is initialized in `src/app/_layout.tsx` (`enabled: !__DEV__`, so it's off in dev), which
also wraps the root component with `Sentry.wrap`. The background handlers in `index.ts`
deliberately use **no** Sentry: an `await Sentry.flush()` there delayed notification actions,
and killed-app captures were noise. They log with `console.error` only — keep it that way for
new background error paths. Sentry calls in stores/services (e.g.
`syncNotificationsInBackground`) only reach Sentry when the app process has evaluated
`_layout.tsx` (i.e. backgrounded, not killed); in the headless killed-app path they no-op.
