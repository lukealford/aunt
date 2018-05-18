'use strict'
const {
    ipcRenderer,
    remote
} = require('electron');
const main = remote.require("./main");

global.ipcRenderer = ipcRenderer;
global.getAppVersion = main.getAppVersion;
global.snapshotTemplate = main.snapshotTemplate;
global.getFocusedWindow = remote.BrowserWindow.getFocusedWindow;
