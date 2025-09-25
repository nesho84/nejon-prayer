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

