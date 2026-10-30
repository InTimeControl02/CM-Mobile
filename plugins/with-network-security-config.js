const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Allows HTTP (cleartext) to any host so the APK works against the backend
// at whatever IP the EXPO_PUBLIC_API_BASE_URL points to at bundle time
// (dev, staging, prod, or any LAN IP). Keeps system CA for HTTPS.
const NETWORK_SECURITY_XML = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
`;

module.exports = function withNetworkSecurityConfig(config) {
  // Write the xml file into res/xml
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const xmlDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'xml',
      );
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(
        path.join(xmlDir, 'network_security_config.xml'),
        NETWORK_SECURITY_XML,
      );
      return config;
    },
  ]);

  // Patch AndroidManifest.xml to add networkSecurityConfig + usesCleartextTraffic
  config = withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application[0];
    application.$['android:networkSecurityConfig'] =
      '@xml/network_security_config';
    application.$['android:usesCleartextTraffic'] = 'true';
    return config;
  });

  return config;
};
