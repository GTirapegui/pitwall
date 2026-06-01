const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withAdiRegistration = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const rawDir = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'raw');
      fs.mkdirSync(rawDir, { recursive: true });
      fs.writeFileSync(
        path.join(rawDir, 'adi_registration.properties'),
        'CQWBSLQJPDPJ2AAAAAAAAAAAAA'
      );
      return config;
    },
  ]);
};

module.exports = withAdiRegistration;
