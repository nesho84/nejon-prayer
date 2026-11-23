const { withAppBuildGradle } = require('expo/config-plugins');

// Signs local release builds with the upload key from credentials.json (gitignored).
// No file (e.g. on EAS) → nothing changes, EAS signs as before.
const SIGNING = `
def credentialsFile = new File(rootProject.projectDir.parentFile, "credentials.json")
if (credentialsFile.exists()) {
    def keystore = new groovy.json.JsonSlurper().parse(credentialsFile).android.keystore
    def storePath = new File(keystore.keystorePath)
    android.signingConfigs.create("upload") {
        storeFile storePath.isAbsolute() ? storePath : new File(rootProject.projectDir.parentFile, keystore.keystorePath)
        storePassword keystore.keystorePassword
        keyAlias keystore.keyAlias
        keyPassword keystore.keyPassword
    }
    android.buildTypes.release.signingConfig android.signingConfigs.upload
}
`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes('credentials.json')) {
      config.modResults.contents += SIGNING;
    }
    return config;
  });
};
