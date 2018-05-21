'use strict'
const {
    ipcRenderer,
    remote
} = require('electron');
const path = require('path');
const main = remote.require(path.join(__dirname, '../main'));

process.once('loaded', () => {
    global.ipcRenderer = ipcRenderer;
    global.getAppVersion = main.getAppVersion;
    global.snapshotTemplate = main.snapshotTemplate;
    global.getFocusedWindow = remote.BrowserWindow.getFocusedWindow;
})