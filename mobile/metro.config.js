const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = false;
// date-fns v4 ships .cjs files — Metro needs this extension registered
config.resolver.sourceExts.push('cjs');

module.exports = config;
