# Nejon Prayer — Developer Guide

## What This App Does

Nejon Prayer is a React Native / Expo app for Muslim daily practice. Its main features:

- **Prayer times** — fetched once per year from [aladhan.com](https://aladhan.com/prayer-times-api) and cached locally. The calculation method is auto-selected by latitude (Balkans/Turkey vs global fallback).
- **Prayer notifications** — per-prayer scheduling via `react-native-notify-kit`. Each prayer supports enable/disable, time offset (early/late), and custom azan sound. Special notifications for Friday Jumu'ah and daily quotes.
- **Prayer tracking** — mark each prayer as prayed, 30-day rolling history.
- **Quran reader** — Arabic text with transliteration loaded locally from a bundled JSON. Translations fetched per-surah from [alquran.cloud](https://alquran.cloud/api). Audio playback via `expo-audio`.
- **Qibla compass** — bearing to Mecca using `expo-sensors`.
- **Tesbih (dhikr counter)** — digital prayer bead counter with configurable target and lap tracking.
- **Islamic holidays** — yearly Islamic holiday dates (Hijri-based) with a next-holiday card on the home screen, a full list screen, and optional reminders for the four major holidays.
- **Guides** — step-by-step Wudu (abdest) and Salah (namaz) guides, Ramadan tips.
- **Settings** — language, theme, notification volume, sounds, location refresh.

**Supported languages:** English, German (`de`), French (`fr`), Albanian (`sq`), Bosnian (`bs`), Macedonian (`mk`), Turkish (`tr`), Arabic (`ar`)

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
│   ├── extras/            # Wudu guide, Tesbih, Ramadan, Quotes, Islamic holidays, About
│   │   └── namazi/        # Salah guide (namazi-guide.tsx) + namazi-plus placeholder
│   ├── quran/             # Ayahs screen, Bookmarked Ayahs (ayahs-fav.tsx)
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
| `holidaysStore` | Yearly Islamic holiday dates cache (fetched once per year) |
| `themeStore` | Light / dark / system theme |
| `languageStore` | Active language + translation strings |
| `deviceSettingsStore` | Live device permission/connectivity flags (not persisted) |
| `tesbihStore` | Counter value, lap count, target |
| `autoModalsStore` | State of the 4 auto modals (Store update, Notif reminder, Store review, Feedback): next-show time, last show, show count, done |
| `modalStore` | Global bottom-sheet modal visibility |

### Sync Hooks (run once at root layout)

| Hook | Responsibility |
|---|---|
| `useDeviceSettingsSync` | Polls permissions and network state |
| `useLocationChangeSync` | On start and every return to the app, checks if you moved 50 km+ from the saved location (throttled) |
| `usePrayerTimesSync` | Triggers prayer times reload on location/date change |
| `useNotificationsSync` | Creates notification channels, reschedules on prayer times or settings change |
| `useHolidaysSync` | Fetches Islamic holiday dates once per year (after device settings are ready) |
| `useQuranSync` | Loads the bundled Quran JSON into `quranStore`, sets the audio mode, syncs player status into `quranAudioStore` |
| `useSystemThemeSync` | Listens to `Appearance` changes for system theme |
| `useAutoModalsSync` | Startup check: store update check, then at most one auto modal (Store update → Notif reminder → Feedback); notif reminder resets |
| `useOtaUpdatesSync` | Downloads an OTA (expo-updates) update on launch and reloads |
| `useAdsSync` | Gathers UMP consent, then initializes the Mobile Ads SDK |

### External APIs

| API | Used For | Call Frequency |
|---|---|---|
| `api.aladhan.com/v1/calendar/{year}` | Yearly prayer times by GPS coordinates | Once per year per location |
| `api.aladhan.com/v1/islamicHolidaysByHijriYear/{year}` (+ `gToH`) | Islamic holiday dates | Once per year |
| `api.alquran.cloud/v1/surah/{id}/{edition}` | Quran translation text | Per surah, on demand |

Prayer calculation method is auto-selected by **country** — the ISO country code from the
device's reverse-geocoded location is mapped (via `COUNTRY_METHOD_MAP` in `prayersService.ts`)
to the closest local authority's method (e.g. Diyanet/13 for Turkey & the Balkans, Egyptian/5
for Egypt, ISNA/2 for US/Canada), falling back to **MWL (method 3)** for unlisted countries.
A **One-Seventh of the Night** latitude adjustment is always applied so high-latitude Fajr/Isha
stay reasonable in summer.

### Notifications

Powered by `react-native-notify-kit` (Notifee fork). Notifications are exact-alarm scheduled (Android 12+ `USE_EXACT_ALARM` permission required). Each scheduling run cancels all existing notifications and reschedules them fresh.

Three notification types:
- **Prayer notifications** — Fajr, Dhuhr, Asr, Maghrib, Isha (each configurable)
- **Event notifications** — Imsak (pre-dawn), Sunrise (optional)
- **Special notifications** — Friday Jumu'ah reminder, daily Islamic quote

### Audio

Two audio systems are used:
- `react-native-sound` — for azan notification sounds played inside the notification
- `expo-audio` — for the in-app Quran audio player (background-capable, lock-screen controls; singleton wrapped in `src/services/quranAudioService.ts`)

### Auto modals

Four modals open on their own. Their state lives in `autoModalsStore`; the waits are constants at the
top of that file, and the rules (`canShowStoreUpdate`, `canShowNotifReminder`, `canShowStoreReview`, `canShowFeedback`)
live in `src/hooks/useAutoModalsSync.ts`. Each `show…Modal()` in `src/components/*Modal.tsx` only shows the
modal and records the show.

| Modal | First wait | After closing / "Later" | Stops for good |
|---|---|---|---|
| Store update | none | next launch, next launch, then every 3 days | never |
| Enable notifications | 3 days | 7 days, then 14 | after 3 shows |
| Store review (Android only) | none | 7 days | after 3 shows, "Open Store", or "Already rated" |
| Feedback | 7 days | 30 days | after 3 shows, sent, or "Don't ask again" |

Store review and Feedback are always at least 7 days apart. No auto modal opens while another modal is open.

**Launch order** (`checkAutoModalsOnStart`, once per launch after onboarding and the first device-settings
sync) — at most one of:
1. **Store update** — if the store check (`checkForStoreUpdate` in `src/services/storeUpdateService.ts`, also used by
   Settings → "Check for update"; 5 s timeout, release builds only) reports
   an update and it's due. "No update" while online resets its cycle; offline, a failed check (sideloaded
   build, iOS without an AppStoreID) or a timeout change nothing.
2. **Enable notifications** — if due. Granting resets it; turning notifications off again starts the
   3-day wait.
3. **Feedback** — if due. Its first show is set to 7 days after onboarding, once, at the top of `checkAutoModalsOnStart`.

**Store review** keeps its own triggers — the 3rd prayer marked on Home or in the calendar, and Quran reading
reaching ayah 20 — and opens there when `canShowStoreReview()`. It also waits for a later session when
Store update or Enable notifications already showed in this one.

**Manual opens** skip the checks and aren't recorded: Store review and Feedback from About (`fromAbout`), and
Settings → "Check for update" (`showStoreUpdateModal(true)`). The debug panel previews count like a real show.

### Ads (AdMob)

A single dismissible banner sits above the tab bar, injected via the `tabBar` prop in
`src/app/(tabs)/_layout.tsx`. `BottomTabBar` is imported from **`expo-router/js-tabs`** —
Expo Router v56 decoupled from React Navigation, so `@react-navigation/bottom-tabs` is not a
dependency and must not be installed (a second copy would break theming). See the
[SDK 55→56 migration mapping](https://docs.expo.dev/router/migrate/sdk-55-to-56/).

Flow: `useAdsSync` → `adsStore.initializeAds()` → `adsService.gatherConsentAndInitialize()`.
UMP consent is gathered **before** `mobileAds().initialize()`, since ads can preload the moment
initialize is called. If `gatherConsent` throws, `canRequestAds` is still read — UMP falls back to
the previous session's status. Consent status is **never persisted**; it is re-evaluated every launch.
`AdBanner` renders `null` unless `canRequestAds` is true, so a consent failure means no ads rather
than ungated ads.

Four things to know:

- **`iosAppId` in `app.json` is Google's TEST App ID** (`ca-app-pub-3940256099942544~1458002511`).
  No iOS app is registered in AdMob yet. **Replace it with a real iOS App ID before any App Store
  release.** It cannot simply be omitted — the native SDK reads it from `Info.plist` at init and
  crashes on iOS without it. For the same reason `AdBanner` keeps iOS on `TestIds`: the live unit
  is an Android unit and would never fill on iOS.
- **Release builds serve the live unit.** `AdBanner` falls back to `TestIds` only when `__DEV__`
  (and always on iOS), so a local release APK shows real ads — don't tap them during QA. To test
  a release build safely, register the device via
  `setRequestConfiguration({ testDeviceIdentifiers: [...] })`, which returns test ads even from
  the live unit.
- **A GDPR message must be published in the AdMob console** (Privacy & messaging → European
  regulations, targeting EEA/UK/CH) and attached to the app. Without it `gatherConsent` throws
  *"no form(s) configured for the input app ID"*, `canRequestAds` stays false, and the banner
  silently renders nothing. Publishing a *draft* is not enough.
- **`react-native-google-mobile-ads` is pinned to `16.3.4` exact — do not add a caret.** 16.4.0+
  pulls `play-services-ads` 25.3+, which embeds Kotlin 2.3 metadata that RN 0.86's Kotlin 2.1.20
  compiler cannot read. See Common Build Errors below.
- **ATT is not configured for iOS.** UMP can present Apple's App Tracking Transparency prompt,
  which needs `NSUserTrackingUsageDescription` — available as the plugin's
  `userTrackingUsageDescription` option. Add it before an iOS release.

`delayAppMeasurementInit` is **enabled** in the plugin config (writes `DELAY_APP_MEASUREMENT_INIT`
on Android and `GADDelayAppMeasurementInit` on iOS). It postpones Google's app measurement so
nothing is tracked before the consent form is answered — the same reason consent runs before
`initialize()`. Never hand-edit `AndroidManifest.xml` for this — `prebuild --clean` wipes it.

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

### 3. Local Release Build (signed, same as EAS)

Signed with the upload key from `credentials.json` (see [Local Signing](#local-signing)).

**Signed APK**, installed on the device (`expo run` loads `.env.local`, so the Sentry upload works):

```bash
npx expo prebuild --clean
npx expo run:android --variant release
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

**Signed AAB** for Play upload (Gradle directly, so the Sentry token must be exported first):

```bash
npx expo prebuild --clean
export SENTRY_AUTH_TOKEN="$(grep '^SENTRY_AUTH_TOKEN=' .env.local | cut -d= -f2- | tr -d '\r')"
cd android && ./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

> ❌ No hot reload — ✅ Useful for testing production behavior

> ⚠️ The dev client is signed with the debug key, release builds with the upload key. Android
> won't update an app with a build signed by a different key, so switching the same phone between
> them needs `adb uninstall com.nejon.nejonprayer` first (clears app data). The Play version is
> signed by Google, so it needs an uninstall too.

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
| Release APK/AAB | ❌ | ✅ | QA / Play upload (signed) |
| EAS Build | ❌ | ✅ | Store submission |

**Tip:** Enable **Quick Boot** in AVD Manager and store AVDs on an SSD for faster emulator startup.

---

## Local Signing

Local release builds are signed with the same **upload key** EAS uses, so Play accepts AABs built
on this PC. The key exists in three places: Expo's servers (used by `eas build`), this project
folder (used by local builds), and a personal backup.

| File | Content | Git |
|---|---|---|
| `credentials.json` | keystore path, alias, passwords | ignored |
| `credentials/android/keystore.jks` | the upload key | ignored |

**One-time setup** (interactive, run in a terminal):

```bash
eas credentials -p android
# → production → "credentials.json: Upload/Download credentials between EAS servers and your local json"
# → "Download credentials from EAS to credentials.json"
```

**How it works:** `src/plugins/withReleaseSigning.js` appends a block to the generated
`android/app/build.gradle` that reads `credentials.json` at build time, so no password is copied
into generated files. Without the file (e.g. on EAS), nothing changes and EAS signs as before.
`eas.json` keeps the default `credentialsSource: "remote"`.

**Check a build's signature:**

```bash
keytool -printcert -jarfile android/app/build/outputs/bundle/release/app-release.aab
```

The SHA-1 must match Play Console → **Test and release → App integrity → Upload key certificate**
(not the App signing key, which is Google's).

**Rules:**
- Never commit `credentials.json` or the `.jks`. Keep a backup in a password manager.
- If the upload key is ever reset, update **both** copies: the local files, and EAS via
  `eas credentials` → "Upload credentials from credentials.json to EAS".
- A lost upload key is recoverable: Play App Signing lets Google reset it (72 h wait).

---

## Testing

The project uses **Jest** with the `jest-expo` preset and **@testing-library/react-native**. The `__tests__/` directory mirrors `src/` and covers utils, stores, services, hooks, components, and screens.

```bash
npm test
```

When adding a store, service, hook, component, or screen, add the matching test under the parallel `__tests__/` path.

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

### `Module was compiled with an incompatible version of Kotlin` (AdMob)

**Symptom:**
```
Task :react-native-google-mobile-ads:compileDebugKotlin FAILED
e: ...play-services-ads-25.4.0-api.jar!/META-INF/....kotlin_module
   Module was compiled with an incompatible version of Kotlin.
   The binary version of its metadata is 2.3.0, expected version is 2.1.0.
```

**Cause:** `react-native-google-mobile-ads` 16.4.0+ pulls `play-services-ads` 25.3+, which embeds
Kotlin 2.3 metadata even though the module only consumes its public Java API. RN 0.86 pins Kotlin
**2.1.20**, and Kotlin metadata is backward-readable only — a 2.1 compiler cannot read 2.3 metadata.

**Fix:** stay pinned to `16.3.4` **exact** (pulls `play-services-ads` 25.0.0). A caret range
resolves back to 16.5.0 and reintroduces the failure on any fresh `npm install` or CI checkout.

```bash
npx expo install react-native-google-mobile-ads@16.3.4 -- --save-exact
```

Upstream: [invertase#863](https://github.com/invertase/react-native-google-mobile-ads/issues/863)
(open) and [invertase#866](https://github.com/invertase/react-native-google-mobile-ads/pull/866),
which adds `-Xskip-metadata-version-check` for Kotlin < 2.3 — approved but blocked on a CLA, so
there is no released fix yet. Re-check before unpinning.

> Bumping the project's Kotlin via `expo-build-properties.android.kotlinVersion` is **not** the
> fix — see [expo/expo#22464](https://github.com/expo/expo/issues/22464) for why it doesn't
> reliably apply through prebuild.

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

Local builds read the same token from `.env.local` (gitignored): `npx expo run:android` loads it
automatically, while a direct `./gradlew` call needs it exported first (see Local Release Build).

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
