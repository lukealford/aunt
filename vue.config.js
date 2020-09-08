module.exports = {
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true
    },
    "asar": true,
    builderOptions: {
      "files": ["**/*", "build/icon.*"],
      "win": {
        "icon": './icon.ico'
      }
    },
  }
};