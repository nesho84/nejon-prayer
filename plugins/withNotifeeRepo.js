const { withProjectBuildGradle, withDangerousMod, withAndroidManifest } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withNotifeeRepo(config) {
  // ------------------------------------------------------------
  // Add JitPack & Notifee repo to build.gradle
  // ------------------------------------------------------------
  config = withProjectBuildGradle(config, async config => {
    const contents = config.modResults.contents;
    if (!contents.includes('@notifee/react-native')) {
      const replacement = `maven { url 'https://www.jitpack.io' }
        maven {
            url "$rootDir/../node_modules/@notifee/react-native/android/libs"
        }`;
      config.modResults.contents = contents.replace(
        "maven { url 'https://www.jitpack.io' }",
        replacement
      );
      console.log('📦 Added Notifee repository to build.gradle');
    }
    return config;
  });

  // ------------------------------------------------------------
  // Copy icon + sounds into Android resources
  // ------------------------------------------------------------
  config = withDangerousMod(config, ['android', async config => {
    const resRoot = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res');

    // --- Copy notification icon (Notifee) ---
    const drawableFolder = path.join(resRoot, 'drawable');
    if (!fs.existsSync(drawableFolder)) {
      fs.mkdirSync(drawableFolder, { recursive: true });
    }
    const sourceIcon = path.join(config.modRequest.projectRoot, 'assets/icons/notification-icon.png');
    const targetIcon = path.join(drawableFolder, 'ic_stat_prayer.png');
    if (fs.existsSync(sourceIcon)) {
      fs.copyFileSync(sourceIcon, targetIcon);
      console.log('🖼️  Copied Notifee icon → drawable/ic_stat_prayer.png');
    } else {
      console.warn('⚠️  Notification icon not found in assets/icons/notification-icon.png');
    }

    // --- Copy all sounds from assets/sounds to raw folder (react-native-sound) ---
    const rawFolder = path.join(resRoot, 'raw');
    if (!fs.existsSync(rawFolder)) {
      fs.mkdirSync(rawFolder, { recursive: true });
    }
    const soundsSourceDir = path.join(config.modRequest.projectRoot, 'assets/sounds');
    if (fs.existsSync(soundsSourceDir)) {
      const soundFiles = fs.readdirSync(soundsSourceDir);
      soundFiles.forEach(file => {
        const sourceSound = path.join(soundsSourceDir, file);
        const targetSound = path.join(rawFolder, file);
        fs.copyFileSync(sourceSound, targetSound);
        console.log(`🔊 Copied sound → res/raw/${file}`);
      });
    } else {
      console.warn('⚠️  Sounds folder not found in assets/sounds');
    }

    return config;
  },
  ]);

  return config;
};