const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

module.exports = function withAdiRegistration(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const rawDir = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/res/raw"
      );
      if (!fs.existsSync(rawDir)) {
        fs.mkdirSync(rawDir, { recursive: true });
      }
      fs.writeFileSync(
        path.join(rawDir, "adi-registration.properties"),
        "CQWBSLQJPDPJ2AAAAAAAAAAAAA"
      );
      return config;
    },
  ]);
};
