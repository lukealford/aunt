'use strict'
import { ipcRenderer, remote } from "electron";
import { join } from "path";
const main = remote.require(join(__dirname, '../main'));

process.once('loaded', () => {
    global.ipcRenderer = ipcRenderer;
    global.getAppVersion = main.getAppVersion;
    global.snapshotTemplate = main.snapshotTemplate;
    global.networkTemplate = main.networkTemplate;
    global.getPlatform = main.getPlatform;
    global.getFocusedWindow = remote.BrowserWindow.getFocusedWindow;
})