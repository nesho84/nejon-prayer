const { withProjectBuildGradle, withDangerousMod, withAndroidManifest } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withNotifeeRepo(config) {
  // Add JitPack & Notifee repo to build.gradle
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

  // Copy notification icon into Android drawable folder
  config = withDangerousMod(config, [
    'android',
    async config => {
      const drawableFolder = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/res/drawable'
      );

      if (!fs.existsSync(drawableFolder)) {
        fs.mkdirSync(drawableFolder, { recursive: true });
      }

      const sourceIcon = path.join(
        config.modRequest.projectRoot,
        'assets/icons/notification-icon.png'
      );
      const targetIcon = path.join(drawableFolder, 'ic_stat_prayer.png');

      fs.copyFileSync(sourceIcon, targetIcon);
      console.log('🖼️  Copied Notifee notification icon → drawable/ic_stat_prayer.png');

      return config;
    },
  ]);

  // Add required permissions to AndroidManifest.xml
  config = withAndroidManifest(config, config => {
    const manifest = config.modResults.manifest;

    if (!manifest['uses-permission']) manifest['uses-permission'] = [];

    const addPermission = (name, emoji, text) => {
      const alreadyAdded = manifest['uses-permission'].some(
        (p) => p.$['android:name'] === name
      );
      if (!alreadyAdded) {
        manifest['uses-permission'].push({ $: { 'android:name': name } });
        console.log(`${emoji} Added ${text} permission to AndroidManifest.xml`);
      }
    };

    addPermission('android.permission.POST_NOTIFICATIONS', '⏰', 'POST_NOTIFICATIONS');
    addPermission('android.permission.USE_EXACT_ALARM', '⏰', 'USE_EXACT_ALARM');
    addPermission('android.permission.SCHEDULE_EXACT_ALARM', '⏰', 'SCHEDULE_EXACT_ALARM');
    addPermission('android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS', '🔋', 'REQUEST_IGNORE_BATTERY_OPTIMIZATIONS');

    return config;
  });

  return config;
};
