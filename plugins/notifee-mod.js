const { withProjectBuildGradle, withDangerousMod } = require('expo/config-plugins');
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
      console.log('✅ Copied notification icon to drawable folder');

      return config;
    },
  ]);

  return config;
};
