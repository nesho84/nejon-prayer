const { withDangerousMod, withXcodeProject, IOSConfig } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withNotifeeRepo(config) {
  // ------------------------------------------------------------
  // Copy notification icon (react-native-notify-kit)
  // ------------------------------------------------------------
  config = withDangerousMod(config, ['android', async config => {
    const drawableFolder = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/drawable');
    if (!fs.existsSync(drawableFolder)) fs.mkdirSync(drawableFolder, { recursive: true });

    const sourceIcon = path.join(config.modRequest.projectRoot, 'assets/icons/notification-icon.png');
    const targetIcon = path.join(drawableFolder, 'ic_stat_prayer.png');

    if (fs.existsSync(sourceIcon)) {
      fs.copyFileSync(sourceIcon, targetIcon);
      console.log('🖼️  Copied notification icon → drawable/ic_stat_prayer.png');
    } else {
      console.warn('⚠️  Notification icon not found in assets/icons/notification-icon.png');
    }

    return config;
  }]);

  // ------------------------------------------------------------
  // Copy all sounds files (react-native-sound)
  // ------------------------------------------------------------
  config = withDangerousMod(config, ['android', async config => {
    const rawFolder = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/raw');
    if (!fs.existsSync(rawFolder)) fs.mkdirSync(rawFolder, { recursive: true });

    const soundsSourceDir = path.join(config.modRequest.projectRoot, 'assets/sounds');
    if (fs.existsSync(soundsSourceDir)) {
      fs.readdirSync(soundsSourceDir).forEach(file => {
        const sourceSound = path.join(soundsSourceDir, file);
        const targetSound = path.join(rawFolder, file);
        fs.copyFileSync(sourceSound, targetSound);
        console.log(`🔊 Copied sound → raw/${file}`);
      });
    } else {
      console.warn('⚠️  Sounds folder not found in assets/sounds');
    }

    return config;
  }]);

  // ------------------------------------------------------------
  // Copy iOS-native notification sound files (.caf, ≤30s — Apple's limit)
  // into the Xcode project folder
  // ------------------------------------------------------------
  config = withDangerousMod(config, ['ios', async config => {
    const sourceRoot = IOSConfig.Paths.getSourceRoot(config.modRequest.projectRoot);

    const soundsSourceDir = path.join(config.modRequest.projectRoot, 'assets/sounds-ios');
    if (fs.existsSync(soundsSourceDir)) {
      fs.readdirSync(soundsSourceDir).forEach(file => {
        const sourceSound = path.join(soundsSourceDir, file);
        const targetSound = path.join(sourceRoot, file);
        fs.copyFileSync(sourceSound, targetSound);
        console.log(`🔊 Copied iOS sound → ${file}`);
      });
    } else {
      console.warn('⚠️  iOS sounds folder not found in assets/sounds-ios');
    }

    return config;
  }]);

  // ------------------------------------------------------------
  // Register the copied iOS sound files as bundle resources in the Xcode project
  // (required — iOS won't find them by filename otherwise)
  // ------------------------------------------------------------
  config = withXcodeProject(config, config => {
    const sourceRoot = IOSConfig.Paths.getSourceRoot(config.modRequest.projectRoot);
    const projectName = path.basename(sourceRoot);

    const soundsSourceDir = path.join(config.modRequest.projectRoot, 'assets/sounds-ios');
    if (fs.existsSync(soundsSourceDir)) {
      fs.readdirSync(soundsSourceDir).forEach(file => {
        const targetSound = path.join(sourceRoot, file);
        IOSConfig.XcodeUtils.addResourceFileToGroup({
          filepath: targetSound,
          groupName: projectName,
          project: config.modResults,
          isBuildFile: true,
        });
        console.log(`📦 Registered iOS sound resource → ${file}`);
      });
    }

    return config;
  });

  return config;
};