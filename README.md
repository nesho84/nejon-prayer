# Nejon Prayer — Developer Guide

## What This App Does

Nejon Prayer is a React Native / Expo app for Muslim daily practice. Its main features:

- **Prayer times** — fetched once per year from [aladhan.com](https://aladhan.com/prayer-times-api) and cached locally. The calculation method is auto-selected by latitude (Balkans/Turkey vs global fallback).
- **Prayer notifications** — per-prayer scheduling via `react-native-notify-kit`. Each prayer supports enable/disable, time offset (early/late), and custom azan sound. Special notifications for Friday Jumu'ah and daily quotes.
- **Prayer tracking** — mark each prayer as prayed, 30-day rolling history.
- **Quran reader** — Arabic text with transliteration loaded locally from a bundled JSON. Translations fetched per-surah from [alquran.cloud](https://alquran.cloud/api). Audio playback via `react-native-track-player`.
- **Qibla compass** — bearing to Mecca using `expo-sensors`.
- **Tesbih (dhikr counter)** — digital prayer bead counter with configurable target and lap tracking.
- **Guides** — step-by-step Wudu (abdest) and Salah (namaz) guides, Ramadan tips.
- **Settings** — language, theme, notification volume, sounds, location refresh.

**Supported languages:** English, German (`de`), Albanian (`sq`), Turkish (`tr`)

---

## Prerequisites
- **Node.js** and **npm** installed
- **Android Studio** with SDK & emulator configured
- **Java JDK 17**+ installed
- **Virtualization enabled** in BIOS/UEFI
- **ADB** accessible from terminal (`adb devices`)

---

## Quick Start

```bash
npm install
npx expo start
```

Press `a` to open on Android emulator, or `i` for iOS simulator.

---

## Project Structure

```
src/
├── app/                   # Expo Router screens
│   ├── (tabs)/            # Main tab bar: Home, Quran, Qibla, Extras, Settings
│   ├── (extras)/          # Wudu guide, Salah guide, Tesbih, Ramadan, About, Notifications
│   ├── (quran)/           # Ayahs screen (per-surah verse list)
│   ├── (modals)/          # Bottom-sheet modals: prayer config, timings, Quran settings
│   └── (onboarding)/      # First-launch location setup
├── components/            # Shared UI components
├── constants/             # Colors, sounds list, quotes, translations (i18n strings)
├── hooks/                 # Sync hooks run at root layout level
├── services/              # API + device service layer
├── store/                 # Zustand stores (all persisted via MMKV)
├── types/                 # TypeScript interfaces
└── utils/                 # Pure utility functions (date, time, calendar, prayer tracking)
__tests__/
└── utils/                 # Unit tests for all utility functions
assets/
├── data/                  # quran_transliteration.json (bundled, ~3 MB)
├── fonts/
├── sounds/                # Azan MP3 files
└── images/
```

---

## Architecture

### Routing — Expo Router

File-based routing. The root layout (`src/app/_layout.tsx`) uses `Stack.Protected` to gate the main app behind `onboardingComplete`. Until onboarding is done, only the onboarding screen is accessible.

### State Management — Zustand + MMKV

All stores are persisted to [MMKV](https://github.com/mrousavy/react-native-mmkv) via Zustand's `persist` middleware. MMKV is significantly faster than AsyncStorage for synchronous reads at startup.

| Store | Purpose |
|---|---|
| `onboardingStore` | First-launch gate (`onboardingComplete` flag) |
| `locationStore` | GPS coordinates, full address, timezone |
| `prayersStore` | Yearly prayer times cache, today's times, load/reload actions |
| `prayersTrackingStore` | Per-prayer mark-as-prayed, rolling 30-day history |
| `notificationsStore` | Per-prayer notification config, scheduling, background sync |
| `quranStore` | Full Quran data, ayahs cache, reading position, player state, settings |
| `themeStore` | Light / dark / system theme |
| `languageStore` | Active language + translation strings |
| `deviceSettingsStore` | Live device permission/connectivity flags (not persisted) |
| `tesbihStore` | Counter value, lap count, target |
| `modalStore` | Global bottom-sheet modal visibility |

### Sync Hooks (run once at root layout)

| Hook | Responsibility |
|---|---|
| `useDeviceSettingsSync` | Polls permissions and network state |
| `usePrayerTimesSync` | Triggers prayer times reload on location/date change |
| `useNotificationsSync` | Creates notification channels, reschedules on prayer times or settings change |
| `useQuranSetup` | Loads the bundled Quran JSON into `quranStore` |
| `useSystemThemeSync` | Listens to `Appearance` changes for system theme |

### External APIs

| API | Used For | Call Frequency |
|---|---|---|
| `api.aladhan.com/v1/calendar/{year}` | Yearly prayer times by GPS coordinates | Once per year per location |
| `api.alquran.cloud/v1/surah/{id}/{edition}` | Quran translation text | Per surah, on demand |

Prayer calculation method is auto-selected by latitude:
- **41–44° N** (Albania, Kosovo, N. Macedonia, Bosnia) → Custom angle method (Fajr 15°, Isha 17°)
- **44–50° N** (Turkey, Central Europe) → Turkish Diyanet method (method 13)
- **Elsewhere** → ISNA (method 2)

### Notifications

Powered by `react-native-notify-kit` (Notifee fork). Notifications are exact-alarm scheduled (Android 12+ `USE_EXACT_ALARM` permission required). Each scheduling run cancels all existing notifications and reschedules them fresh.

Three notification types:
- **Prayer notifications** — Fajr, Dhuhr, Asr, Maghrib, Isha (each configurable)
- **Event notifications** — Imsak (pre-dawn), Sunrise (optional)
- **Special notifications** — Friday Jumu'ah reminder, daily Islamic quote

### Audio

Two audio systems are used:
- `react-native-sound` — for azan notification sounds played inside the notification
- `react-native-track-player` — for the in-app Quran audio player (background-capable)

---

### 1. Expo Go (JS-only, no native modules)

```bash
npx expo start
# Press 'a'
```

> ❌ Cannot use custom native modules

---

### 2. Dev Client (custom native modules + hot reload)

```bash
npx expo prebuild --clean   # generate android/ and ios/
npx expo run:android        # build debug APK and install
npx expo start              # start Metro, then press 's' → 'a'
```

- Only rerun `npx expo run:android` when native code changes.
- Manual install: `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`

---

### 3. Local Release APK (QA / testing)

```bash
npx expo prebuild --clean
npx expo run:android --variant release
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

> ❌ No hot reload — ✅ Useful for testing production behavior

---

### 4. EAS Cloud Build (store submission)

```bash
npm install -g eas-cli
eas login
```

| Profile | Command | Output |
|---|---|---|
| Development APK | `eas build --profile development --platform android` | `.apk` |
| Release APK | `eas build --profile release-apk --platform android` | `.apk` |
| Preview (AAB) | `eas build --profile preview --platform android` | `.aab` |
| Production | `eas build --profile production --platform android` | `.aab` (store) |

---

## Key Points

| Mode | Hot Reload | Native Modules | Use Case |
|---|---|---|---|
| Expo Go | ✅ | ❌ | Quick JS testing |
| Dev Client | ✅ | ✅ | Active development |
| Release APK | ❌ | ✅ | QA / sharing |
| EAS Build | ❌ | ✅ | Store submission |

**Tip:** Enable **Quick Boot** in AVD Manager and store AVDs on an SSD for faster emulator startup.

---

## Testing

The project uses **Jest** with the `jest-expo` preset and **@testing-library/react-native**. Tests are scoped to pure utility functions — no component rendering or native module mocking required.

```bash
npm test
```

Tests cover date formatting, time comparisons, calendar grid generation, and prayer tracking logic. All test files live under `__tests__/`.

> **Note:** `react-test-renderer` is pinned in `devDependencies` to match the exact `react` version. Do not upgrade it independently — it must always match `react`.

---

## Android Permissions

| Permission | Why |
|---|---|
| `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` | GPS coordinates for prayer time calculation |
| `POST_NOTIFICATIONS` | Display prayer time notifications |
| `SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM` | Exact-time azan scheduling (Android 12+) |
| `FOREGROUND_SERVICE` / `FOREGROUND_SERVICE_MEDIA_PLAYBACK` | Quran audio player running in background |
| `WAKE_LOCK` | Keep the device awake while audio plays |
| `VIBRATE` | Notification vibration |
| `MODIFY_AUDIO_SETTINGS` | Notification volume control |
| `INTERNET` / `ACCESS_NETWORK_STATE` | Prayer times API + Quran translation API |

> **Battery Optimization:** The app checks if battery optimization is enabled for it (via `notifee.isBatteryOptimizationEnabled()`) and can prompt the user to disable it, which is required for reliable exact-alarm delivery on some OEMs.

---

### Android

```bash
adb logcat -c                                    # clear logs
adb logcat | grep -i "error\|exception\|fatal"   # filtered output
adb logcat -v time *:E *:F                       # timestamped errors
adb logcat > crash_log.txt                       # log to file (Ctrl+C to stop)
adb logcat *:S ReactNative:V ReactNativeJS:V     # React Native specific
```

### iOS

Xcode → **Window → Devices and Simulators → View Device Logs**

---

## Common Build Errors

### `Unable to delete file '...classes.jar'` (Windows file lock)

**Symptom:**
```
Execution failed for task ':expo-modules-core:bundleLibCompileToJarDebug'.
> Unable to delete file '...\classes.jar'
```

**Cause:** A Gradle daemon or Java process is holding a lock on a build artifact from a previous build.

**Fix:**
```bash
# 1. Stop all Gradle daemons
cd android && ./gradlew --stop && cd ..

# 2. Kill any remaining Java processes (run in a regular terminal, not Git Bash)
taskkill /F /IM java.exe

# 3. Retry the build
npx expo run:android
```

---

## OTA Updates (EAS Update)

This app uses **EAS Update** to ship JS/asset changes without a full store release.

### How It Works

- `expo-updates` checks `updates.url` on launch
- The app sends its `channel` and `runtimeVersion` to the server
- If a matching update exists, it downloads and applies it on next launch
- **Only JS and assets change** — native changes still require a full build

### Channels (configured in `app.json` + `eas.json`)

| Channel | Purpose |
|---|---|
| `production` | Live store builds |
| `preview` | Internal QA builds |
| `development` | Dev client builds |

### Publishing an Update

> Do **not** bump `version` or `versionCode` for OTA — those are for store releases only.

```bash
# All platforms
eas update --branch production --platform all --message "fix: description"

# Android only
eas update --branch production --platform android --message "fix: description"
```

### Rules

- OTA works only when `runtimeVersion` matches the installed build
- Native code changes (new packages, permissions, `android/` edits) require a full EAS build
- After a full EAS build, resume publishing OTA updates as normal

### Setup (one-time)

```bash
npm install -g eas-cli
eas login
npx expo install expo-updates
eas update:configure         # injects updates.url and runtimeVersion into app.json
eas channel:create production
```

---

## Error Monitoring (Sentry)

This app uses **Sentry** (`@sentry/react-native`) for crash reporting and error tracking.

### What It Does

- Automatically captures unhandled JS exceptions and native crashes
- Sends error reports to [sentry.io](https://sentry.io) with stack traces and device context
- Configured via the `@sentry/react-native/expo` plugin in `app.json`

### Configuration (`app.json`)

```json
["@sentry/react-native/expo", {
  "url": "https://sentry.io/",
  "project": "react-native",
  "organization": "nejonnet"
}]
```

### Required EAS Environment Variable

> ⚠️ **Critical:** EAS cloud builds will fail to upload source maps to Sentry without this secret.

In the [EAS dashboard](https://expo.dev) under **Project → Secrets**, add:

| Secret Name | Value |
|---|---|
| `SENTRY_AUTH_TOKEN` | Your Sentry auth token |

Generate the token at: **Sentry → Settings → Auth Tokens → Create New Token**
Required scopes: `project:releases`, `org:read`.

This token is also referenced in `android/sentry.properties` for local release builds.

---

## Dependency Update Workflow

### Workflow A — Careful (recommended for native-heavy projects)

```bash
# 0. Backup
git add . && git commit -m "Backup before update"

# 1. Check outdated
npx ncu --dep dev   # devDependencies only
npx ncu             # all packages

# 2. Update devDependencies (safe)
npx ncu --dep dev -u && npm install

# 3. Update native packages — patch/minor only
npm install @react-native-picker/picker@latest   # example

# 4. Clear caches and verify
rm -rf node_modules android package-lock.json
npm cache clean --force
npm install
npx expo-doctor
npx expo start -c
```

> If `SocketTimeoutException` on Metro connect: `npx expo start -c --tunnel`

### Workflow B — Expo-first (simpler)

```bash
# 0. Backup
git add . && git commit -m "Backup before update"

# 1. Update all packages
npx npm-check-updates -u && npm install

# 2. Let Expo fix compatibility
npx expo-doctor
npx expo install --check

# 3. Clear caches
rm -rf node_modules android package-lock.json
npm cache clean --force
npm install && npx expo start -c
```

If a package causes `expo-doctor` errors and you want to pin it, add to `package.json`:

```json
"expo": {
  "install": {
    "exclude": ["@react-native-picker/picker"]
  }
}
```

### Rules of Thumb

| Package Type | Update Rule |
|---|---|
| DevDependencies | Update freely |
| Pure JS packages | Update freely |
| Native/community packages | Minor/patch only — test builds |
| Expo SDK & core | `npx expo upgrade` only — never via npm |

### Monthly Checklist

1. Backup
2. Update devDependencies
3. Update JS-only runtime libs
4. Update native packages carefully (minor/patch)
5. Clear caches & run `expo-doctor`
6. Test dev client + release build
7. Upgrade Expo SDK when ready (`npx expo upgrade`)
