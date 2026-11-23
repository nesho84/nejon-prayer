// Signed release build: prebuild, then Gradle with .env.local loaded (e.g. Sentry token).
// Usage: node scripts/build-release.js bundleRelease | assembleRelease
const { execSync } = require('child_process');
const fs = require('fs');

const OUTPUTS = {
  bundleRelease: 'android/app/build/outputs/bundle/release/app-release.aab',
  assembleRelease: 'android/app/build/outputs/apk/release/app-release.apk',
};

const task = process.argv[2];
if (!OUTPUTS[task]) {
  console.error(`Usage: node scripts/build-release.js ${Object.keys(OUTPUTS).join(' | ')}`);
  process.exit(1);
}

if (fs.existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
}

const gradlew = process.platform === 'win32' ? 'gradlew' : './gradlew';

execSync('npx expo prebuild --clean --platform android', { stdio: 'inherit' });
execSync(`${gradlew} ${task}`, { cwd: 'android', stdio: 'inherit' });

console.log(`\n✅ ${OUTPUTS[task]}`);
