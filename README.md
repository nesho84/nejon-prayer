# Welcome to nejon-prayer app 👋

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.


---

# Build & Development Guide

# Project Build & Development Guide

## Prerequisites
- **Node.js** and **npm** installed
- **Android Studio** with SDK & emulator configured
- **Java JDK 11**+ installed
- **Virtualization enabled** in BIOS/UEFI
- **ADB** accessible from terminal (`adb devices`)

---

## 1. Using Expo Go (Managed Workflow)

### Purpose
- Run your app **without a custom dev client**
- Works only for **managed workflow projects** (no custom native code)
- Quick iteration with **hot reload**

### Steps
```bash
npx expo start
```
- Press:
```
a
```
- Opens the app in **Expo Go** on the emulator/device
- Hot reload works automatically

**Notes**
- ❌ Cannot use custom native modules
- ✅ Works for pure JS/React Native code

---

## 2. Local Development Build (Dev Client / Bare Workflow)

### Purpose
- Supports **custom native modules** and **hot reload**
- Installed on emulator or physical device for active development

### Steps

1. **Prepare Native Project**
```bash
npx expo prebuild --clean
```
- Creates or refreshes `android/` and `ios/` folders

2. **Build & Install Dev Client**
```bash
npx expo run:android
```
- Builds a **debug APK** (`android/app/build/outputs/apk/debug/app-debug.apk`)
- Installs it automatically on the **running emulator** or **connected device**

3. **Start Metro**
```bash
npx expo start
```
4. **Switch to Development Build**
- In Metro terminal, press:
```
s
```
- Tells Expo to use your **installed dev client** instead of Expo Go

5. **Launch App**
- Press:
```
a
```
- Opens the **dev client** on emulator/device
- Hot reload works immediately

**Optional: Manual Install**
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

**Notes**
- Only **debug/dev builds** support hot reload and custom native modules
- Rerun `npx expo run:android` if native code changes

---

## 3. Local Production Build (APK)

### Purpose
- For testing **release variant** on devices/emulators
- Can be shared for QA
- ❌ Not for Play Store (unsigned APK)

### Steps
```bash
npx expo prebuild --clean
npx expo run:android --variant release
```
- APK location:
```
android/app/build/outputs/apk/release/app-release.apk
```
- Install manually:
```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

**Notes**
- ❌ Release APK does **not support hot reload**
- ✅ Useful for testing production behavior or sharing

---

## 4. Cloud Build (EAS CLI)

### Purpose
- Generate **.aab** for Play Store or **.ipa** for App Store
- Handles signing, reproducible environment, store uploads

### Setup
```bash
npm install -g eas-cli
eas login
eas build:init
```

### Build Commands
- Android-only:
```bash
eas build --platform android
```
- Both platforms:
```bash
eas build --platform all
```
- Optional **local build using EAS**:
```bash
eas build --platform android --local
```

**Notes**
- Outputs `.aab` (Android) and `.ipa` (iOS)
- Suitable for submission to stores
- Cloud builds handle signing automatically

---

## 5. Quick Development Workflow Summary (Windows / Emulator)

### Option A: Expo Go (Managed Workflow)
```bash
npx expo start
# Press 'a' to launch in Expo Go
```

### Option B: Dev Client (Bare Workflow / Custom Native)
```bash
# 1. Prepare native project
npx expo prebuild --clean

# 2. Build & install dev client
npx expo run:android

# 3. Start Metro
npx expo start

# 4. In terminal:
s   # switch to development build
a   # launch on emulator
```

- Hot reload works after dev client is installed
- Only rerun `npx expo run:android` if native code changes

---

## ✅ Key Points
- **Expo Go** → quick JS-only testing, no native modules
- **Dev Client** → supports custom native code and hot reload
- **Release APK** → for QA/testing production, no hot reload
- **EAS build** → production-ready for store submission
- **Press `s`** after `npx expo start` to switch to development build
- **Press `a`** to launch on Android emulator

**Tip:** For faster emulator startup, enable **Quick Boot** in AVD Manager and store AVDs on an **SSD**.




# ---




# To Get Device Logs:

## Clear the logs first:
## Android:
## bash# Clear all logs
```bash
adb logcat -c
```

## Then start fresh logging
```bash
adb logcat | grep -i "error\|exception\|fatal"
Or use filtered logging with timestamp:
bash# Clear first
adb logcat -c
```

## Start logging with timestamp, filter for errors
```bash
adb logcat -v time *:E *:F
```

- *:E = Error level
- *:F = Fatal level
- Better: Log to a file
- bash# Clear logs
```bash
adb logcat -c
```

## Now reproduce the crash, logs go to file
```bash
adb logcat > crash_log.txt
```

## When it crashes, stop with Ctrl+C
## Then search the file for errors

## Or for React Native specific
```bash
adb logcat *:S ReactNative:V ReactNativeJS:V
```

## iOS:
- In Xcode: Window → Devices and Simulators → View Device Logs





# ---





# Expo Project Dependency Update Workflow

A safe, repeatable workflow for keeping your Expo project dependencies up-to-date while minimizing `expo-doctor` warnings and avoiding runtime/native issues.

---

## Step 0 — Backup
Always commit your code or make a backup before updates:
```bash
git add .
git commit -m "Backup before monthly dependency update"
```

---

## Step 1 — Check outdated packages
- DevDependencies only:
```bash
npx ncu --dep dev
```
- All dependencies:
```bash
npx ncu
```
- Review which ones are **minor/patch vs major**.

---

## Step 2 — Update devDependencies (safe)
```bash
npx ncu --dep dev -u
npm install
```
✅ Safe, won’t affect runtime.

---

## Step 3 — Update JS-only runtime packages (safe)
- For packages with no native code:
```bash
npm install axios@latest dayjs@latest redux@latest
```
- These **won’t trigger Expo native warnings**.

---

## Step 4 — Update native/Expo-managed packages selectively
- Only patch/minor updates (same major version) for packages like:
  - `@react-native-picker/picker`
  - `react-native-sound`
  - `react-native-gesture-handler`
- Example:
```bash
npm install @react-native-picker/picker@2.11.4 react-native-sound@0.11.3
```
- ⚠️ **Do not upgrade major versions** until Expo SDK supports them.

---

## Step 5 — Clear caches
After updates:
```bash
rm -rf node_modules android package-lock.json
npm install
npx expo-doctor
npx expo start -c
```
- Refreshes dependency map.
- Removes stale warnings.
- Ensures Metro and Expo caches are clean.

---

## Step 6 — Test thoroughly
- Development build:
```bash
npx expo start
```
- Android/iOS previews:
```bash
expo run:android
expo run:ios
```
- If using EAS for release builds, do a test build:
```bash
eas build --platform android --profile preview
eas build --platform ios --profile preview
```
- Verify the app doesn’t crash and native modules behave correctly.

---

## Step 7 — Ignore harmless Expo warnings
- If `expo-doctor` warns about **minor patch differences** for native modules you just tested, it’s safe to ignore.
- Warnings are **informational** — they indicate Expo hasn’t officially verified the version, but if it works, you’re fine.

---

## Step 8 — Optional: Upgrade Expo SDK
- Every few months, consider upgrading Expo SDK to reduce warnings permanently:
```bash
npx expo upgrade
```
- This bumps all supported packages in sync with the SDK.
- After upgrading, repeat steps 1–7 for any other packages.

---

## Rules of Thumb
| Package Type | Update Rule | Expo Warning? |
|-------------|-------------|---------------|
| DevDependencies | Update freely | Usually none |
| Pure JS | Update freely | Usually none |
| Community/native packages | Update minor/patch only, test builds | Can ignore warnings if tested |
| Expo SDK & core packages | Upgrade only via `expo upgrade` | Never update manually |

---

## Monthly Checklist
1. Backup
2. Update devDependencies
3. Update JS-only runtime libs
4. Update native packages carefully (minor/patch)
5. Clear caches & run `expo-doctor`
6. Test all builds
7. Ignore harmless warnings
8. Upgrade Expo SDK when possible


# ✅ Expo Dependency Update Workflow 1

A safe, repeatable workflow for keeping your Expo project dependencies up-to-date while minimizing `expo-doctor` warnings and avoiding runtime/native issues.

---

## Step 0 — Backup
Always commit your code or make a backup before updates:
```bash
git add .
git commit -m "Backup before monthly dependency update"
```

---

## Step 1 — Check outdated packages
- DevDependencies only:
```bash
npx ncu --dep dev
```
- All dependencies:
```bash
npx ncu
```
- Review which ones are **minor/patch vs major**.

---

## Step 2 — Update devDependencies (safe)
```bash
npx ncu --dep dev -u
npm install
```
✅ Safe, won’t affect runtime.

---

## Step 3 — Update JS-only runtime packages (safe)
- For packages with no native code:
```bash
npm install axios@latest dayjs@latest redux@latest
```
- These **won’t trigger Expo native warnings**.

---

## Step 4 — Update native/Expo-managed packages selectively
- Only patch/minor updates (same major version) for packages like:
  - `@react-native-picker/picker`
  - `react-native-sound`
  - `react-native-gesture-handler`
- Example:
```bash
npm install @react-native-picker/picker@2.11.4 react-native-sound@0.11.3
```
- ⚠️ **Do not upgrade major versions** until Expo SDK supports them.

---

## Step 5 — Clear caches
After updates:
```bash
rm -rf node_modules android package-lock.json
npm install
npx expo-doctor
npx expo start -c
```
- Refreshes dependency map.
- Removes stale warnings.
- Ensures Metro and Expo caches are clean.

---

## Step 6 — Test thoroughly
- Development build:
```bash
npx expo start
```
- Android/iOS previews:
```bash
expo run:android
expo run:ios
```
- If using EAS for release builds, do a test build:
```bash
eas build --platform android --profile preview
eas build --platform ios --profile preview
```
- Verify the app doesn’t crash and native modules behave correctly.

---

## Step 7 — Ignore harmless Expo warnings
- If `expo-doctor` warns about **minor patch differences** for native modules you just tested, it’s safe to ignore.
- Warnings are **informational** — they indicate Expo hasn’t officially verified the version, but if it works, you’re fine.

---

## Step 8 — Optional: Upgrade Expo SDK
- Every few months, consider upgrading Expo SDK to reduce warnings permanently:
```bash
npx expo upgrade
```
- This bumps all supported packages in sync with the SDK.
- After upgrading, repeat steps 1–7 for any other packages.

---

## Rules of Thumb
| Package Type | Update Rule | Expo Warning? |
|-------------|-------------|---------------|
| DevDependencies | Update freely | Usually none |
| Pure JS | Update freely | Usually none |
| Community/native packages | Update minor/patch only, test builds | Can ignore warnings if tested |
| Expo SDK & core packages | Upgrade only via `expo upgrade` | Never update manually |

---

## Monthly Checklist
1. Backup
2. Update devDependencies
3. Update JS-only runtime libs
4. Update native packages carefully (minor/patch)
5. Clear caches & run `expo-doctor`
6. Test all builds
7. Ignore harmless warnings
8. Upgrade Expo SDK when possible




# ✅ Official expo Dependency Update Workflow 2
## Step 0 — Backup (mandatory)
git add .
git commit -m "Backup before dependency update"

## Step 1 — Update all packages via npm
```bash
npx npm-check-updates -u
npx npm-check-updates -i
npm install
```


This updates:

JS-only packages

Third-party native packages

Expo patch/minor versions (same SDK)

## Step 2 — Let Expo enforce compatibility
```bash
npx expo-doctor
npx expo install --check
```


Fixes only mismatched Expo-managed packages

Leaves third-party libraries untouched

Ensures SDK compatibility

## Step 3 — Clear caches
```bash
rm -rf node_modules android package-lock.json
npm install
npx expo start -c
```

# If => Uncaught Error: java.net.SocketTimeoutException:failed to connect to /192.168.1.49(port 8081) from /ipaddy (port 60524) after 10000ms.
```bash
npx expo start -c --tunnel
```

## Step 4 — Test thoroughly

Development build

Android first (real device preferred)

iOS simulator / device

## Step 5 — Expo SDK upgrade (only when intended)
```bash
npx expo upgrade
```


Updates Expo, React, React Native, and Expo modules in sync

Never upgrade SDKs via npm

## Rules of Thumb
Package Type	Update Rule
Expo core	expo upgrade only
Third-party native	Minor
