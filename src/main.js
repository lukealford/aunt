'use strict'

import { ipc, app, BrowserWindow, Menu, Tray, ipcMain, nativeImage } from "electron";

import { resolve as _resolve, join } from "path";
import request from "request";
import moment from "moment";
import Store from "electron-store";
import handlebars, { compile } from "handlebars";
import { registerWith } from "handlebars-intl";
import { readFileSync } from "fs";
import { setPassword, deletePassword, findCredentials } from "keytar";

// const {
//   autoUpdater
// } = require("electron-updater");


// catch all for errors, etc
import unhandled from "electron-unhandled";
unhandled();

// wire up right click context menu
require('electron-context-menu')({
  prepend: (params, browserWindow) => [{}]
});
let hasCookie = false;
const store = new Store();
global.abb = request.jar();


// migrate creds from store to OS keychain
const migrate = async () => {
  if (!!store.get('username') && (!!store.get('password'))) {
    await setPassword('AUNT', store.get('username'), store.get('password'));
    store.delete('username');
    store.delete('password');
  }
};
migrate();

var line = null

let tray = null;
let window = null;
let creds = {};
let windowPos = null;

let pos = store.get('windowPos');

const WINDOW_WIDTH = 350;
const WINDOW_HEIGHT = 420;
const HORIZ_PADDING = 50;
const VERT_PADDING = 10;
const platform = require('os').platform();

registerWith(handlebars);

let sourcePath = _resolve(__dirname, './templates/snapshot.hbs');
let snapshotSource = readFileSync(sourcePath).toString();
export const snapshotTemplate = compile(snapshotSource);

let toolTipPath = _resolve(__dirname, './templates/tooltip.hbs');
let toolTipSource = readFileSync(toolTipPath).toString();
export const toolTipTemplate = compile(toolTipSource);


app.on('ready', async () => {
  // current recommended way to fix transparent issue on linux
  if (platform == 'linux') {
    await delayForLinux();
  }
  // autoUpdater.checkForUpdatesAndNotify();

  let arrayOfAccounts = await findCredentials('AUNT');

  // delete all stored accounts if there are multiple
  // TODO: reveiw if/when multiple accounts
  if (arrayOfAccounts.length !== 1) {
    for (let account of arrayOfAccounts) {
      await deletePassword('AUNT', account.account);
    }
  } else {
    for (let account of arrayOfAccounts) {
      creds.account = account.account;
      creds.password = account.password;
    }
  }

  let iconPath = nativeImage.createFromPath(join(__dirname, 'icons/aussie_icon.png'));

  tray = new Tray(iconPath);

  if (platform !== 'linux') {
    tray.on('click', function (event) {
      toggleWindow();
    });
  } else if (platform == 'darwin') {
    app.dock.hide()
  }

  createWindow();

  // test if we have stored creds
  if (!!creds.account && !!creds.password) {
    updateData();

  } else {
    toggleWindow();
    loggedOut();
  }
});

const delayForLinux = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('ok')
    }, 1000);
  });
}

// when the update has been downloaded and is ready to be installed, notify the BrowserWindow
// autoUpdater.on('update-downloaded', (info) => {
//   win.webContents.send('updateReady')
// });

// when receiving a quitAndInstall signal, quit and install the new version ;)
// ipcMain.on("quitAndInstall", (event, arg) => {
//   autoUpdater.quitAndInstall();
// })

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

const contextMenu = Menu.buildFromTemplate([{
  label: 'Login',
  click: () => {
    toggleWindow();
  }
},
{
  label: 'Quit',
  click: () => {
    app.quit();
  }
},
]);

const loggediNMenu = Menu.buildFromTemplate([{
  label: 'Details',
  click: () => {
    toggleWindow();
  }
},
{
  label: 'Update',
  click: () => {
    updateData();
  }
},
{
  label: 'Logout',
  click: () => {
    logOut();
  }
},
{
  label: 'Quit',
  click: () => {
    app.quit();
  }
},
]);

const loggedIn = () => {
  if (platform === 'darwin') {
    tray.on('right-click', function (event) {
      tray.popUpContextMenu(loggediNMenu);
    });
  } else {
    tray.setContextMenu(loggediNMenu);
  }
  tray.setToolTip('Getting data from AussieBB...');
}

const loggedOut = () => {
  if (platform === 'darwin') {
    tray.on('right-click', function (event) {
      tray.popUpContextMenu(contextMenu);
    });
  } else {
    tray.setContextMenu(contextMenu);
  }
  tray.setToolTip('Login to check your usage....');
}

const checkAbbCookie = () => {
  return new Promise((resolve, reject) => {
    if(!hasCookie){
      resolve(false);
    }else{
      resolve(true);
    }
  });
  
}

const updateData = async () => {
  loggedIn();
  if (!!creds.account && !!creds.password) {
    
    let cookieCheck = await checkAbbCookie();
    console.log(cookieCheck);
    if(cookieCheck === false){
      let login = await abbLogin(creds.account,creds.password);
     
    }
    let service = await getCustomerData();
    let result = await getUsage(service.service_id);
      
    
    console.log(service,result);

    let usage = {}

    usage.lastUpdated =moment(result.lastUpdated).startOf('hour').fromNow();
    usage.updateTime = moment().format('h:mm a');
    usage.unlimited = (result.remainingMb == null) ? true : false;
    //usage.corp = (result.usedMb.allowance1_mb == 0) ? true : false;
    usage.nolimit = (usage.unlimited) ? true : false;
    usage.limit = (usage.unlimited) ? -1 : (formatGB(result.usedMb) + formatGB(result.remainingMb));
    usage.limitRemaining = formatGB(result.remainingMb);
    usage.downloaded = formatGB(result.downloadedMb);
    usage.uploaded = formatGB(result.uploadedMb);
    usage.daysRemaining = result.daysRemaining;
    usage.daysPast = (result.daysTotal - result.daysRemaining);
    //usage.endOfPeriod = getRollover(result.usage.rollover).format('YYYY-MM-DD');
    usage.averageUsage = Math.round(((usage.downloaded + usage.uploaded) / usage.daysPast) * 100) / 100;
    usage.averageLeft = (usage.limit == -1) ? -1 : Math.round((usage.limitRemaining / usage.daysRemaining) * 100) / 100;
    usage.percentRemaining = (usage.limit == -1) ? -1 : Math.round((usage.limitRemaining / usage.limit) * 100) / 100;
    usage.poi = service.poi;
    usage.product = service.product;
    console.log(usage);
    setToolTipText(usage);
    sendMessage('asynchronous-message', 'fullData', usage);
  }
};

const abbLogin = (user,pass) =>{
  //console.log(user,pass)
  sendMessage('asynchronous-message', 'loading');
  return new Promise((resolve, reject) => {
    request.post({
      url: 'https://myaussie-auth.aussiebroadband.com.au/login',
      headers: {
        'User-Agent': 'aunt-v1'
      },
      form: {
        username: user,
        password: pass
      },
      followAllRedirects: true,
      jar: global.abb
    }, (error, response, body) => {
      if (error) {
        console.log('login error from api');
        reject(error);
      } else {
        let res = JSON.parse(body);
        if (res.message === 'The user credentials were incorrect') {
          console.log('login error from response');
          reject(res);  
        }
        else{
          hasCookie = true;
          resolve(res);
        }
      }
    })
  })
}

//gets the first serviceID in a customers account
const getCustomerData = () =>{
  sendMessage('asynchronous-message', 'loading');
  return new Promise((resolve, reject) => {
    request.get({
      url: 'https://myaussie-api.aussiebroadband.com.au/customer',
      headers: {
        'User-Agent': 'aunt-v1'
      },
      jar: global.abb
    }, (error, response, body) => {
        if(error){
          console.log(error);
        }else{
          //console.log(response,body);
          let temp = JSON.parse(body);

          let result = {
            service_id:temp.services.NBN[0].service_id,
            product: temp.services.NBN[0].nbnDetails.product,
            poi: temp.services.NBN[0].nbnDetails.poiName,
            ips:temp.services.NBN[0].ipAddresses
          }
          resolve(result);
        }  
    })
  })
}




//gets usage based on serviceID, requires a service_id passed to it
const getUsage = (id) =>{
  sendMessage('asynchronous-message', 'loading');
  return new Promise((resolve, reject) => {
    request.get({
      url: 'https://myaussie-api.aussiebroadband.com.au/broadband/'+id+'/usage',
      headers: {
        'User-Agent': 'aunt-v1'
      },
      jar: global.abb
    }, (error, response, body) => {
        let temp = JSON.parse(body);
        resolve(temp);
    })
  })
}

const setToolTipText = (usage) => {
  console.log(usage);
  let message = toolTipTemplate(usage);
  tray.setToolTip(message);
}

const getWindowPosition = () => {
  const windowBounds = window.getBounds();
  const trayBounds = tray.getBounds();

  // Center window horizontally below the tray icon
  const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));

  // Position window 4 pixels vertically below the tray icon
  const y = Math.round(trayBounds.y + trayBounds.height - 365);

  return {
    x: x,
    y: y
  };
}

const logOut = async () => {
  try {
    await deletePassword('AUNT', creds.account);
    creds.account = null;
    creds.password = null;
    hasCookie = false;
  } catch (e) {
    sendMessage('asynchronous-message', 'error', 'deleting Account and Password failed')
    console.log(e);
  }
  sendMessage('asynchronous-message', 'loggedOut', 'Logout');
  loggedOut();
  toggleWindow();
}

const createWindow = () => {
  window = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: true,
    skipTaskbar: true,
    webPreferences: {
      backgroundThrottling: false,
      preload: join(__dirname, 'app/preload-launcher.js'),
      nodeIntegration: false
    }
  });
  window.setContentSize(WINDOW_WIDTH, WINDOW_HEIGHT); // workaround for 2.0.1 bug

  window.loadURL(`file://${join(__dirname, 'app/index.html')}`);

  window.webContents.openDevTools({ mode: 'undocked' });
  if (pos) {
    window.setAlwaysOnTop(true);
  } else {
    // Hide the window when it loses focus
    window.on('blur', () => {
      if (!window.webContents.isDevToolsOpened()) {
        window.hide();
      }
    });
  }

  //Update windowPos on window move.
  window.on('move', () => {
    store.set('windowPos', window.getBounds());
    window.setAlwaysOnTop(true);
  });
}

const toggleWindow = () => {
  const {
    screen
  } = require('electron');

  var trayPos = null
  var primarySize = null
  var trayPositionVert = null;
  var trayPositionHoriz = null;


  if (store.get('windowPos')) {
    let pos = store.get('windowPos');
    window.setPosition(pos.x, pos.y);
  } else {

    if (platform == 'linux') {
      trayPos = screen.getCursorScreenPoint();
    } else {
      trayPos = tray.getBounds();
    }

    primarySize = screen.getPrimaryDisplay().workAreaSize; // Todo: this uses primary screen, it should use current
    trayPositionVert = trayPos.y >= primarySize.height / 2 ? 'bottom' : 'top';
    trayPositionHoriz = trayPos.x >= primarySize.width / 2 ? 'right' : 'left';

    window.setPosition(getTrayPosX(), getTrayPosY());

  }
  window.show();
  window.focus();

  function getTrayPosX() {
    // Find the horizontal bounds if the window were positioned normally
    const horizBounds = {
      left: trayPos.x - WINDOW_WIDTH / 2,
      right: trayPos.x + WINDOW_WIDTH / 2
    }
    // If the window crashes into the side of the screem, reposition
    if (trayPositionHoriz == 'left') {
      return horizBounds.left <= HORIZ_PADDING ? HORIZ_PADDING : horizBounds.left;
    } else {
      return horizBounds.right >= primarySize.width ? primarySize.width - HORIZ_PADDING - WINDOW_WIDTH : horizBounds.right - WINDOW_WIDTH;
    }
  }

  function getTrayPosY() {
    return trayPositionVert == 'bottom' ? trayPos.y - WINDOW_HEIGHT - VERT_PADDING : trayPos.y + VERT_PADDING;
  }
}

// const showWindow = () => {
//   const position = getWindowPosition();
//   window.setPosition(position.x, position.y, false);
//   window.show();
// }

const sendMessage = (channel, eventName, message) => {
  console.log('sendMessage: ', eventName)
  window.webContents.send(eventName, message);
  toggleWindow();
}


ipcMain.on('form-submission', async (event, formData) => {
  console.log('form-submission');
  try {
    await setPassword('AUNT', formData.un, formData.pw);
    creds.account = formData.un;
    creds.password = formData.pw;
    updateData();
  } catch (e) {
    sendMessage('asynchronous-message', 'error', 'saving Account and Password failed')
    console.log(e);
  }
});

ipcMain.on('refresh-data', (event, args) => {
  updateData();
});

ipcMain.on('window-show', (event, args) => {
  console.log('window-show');

  // test if we have stored creds
  if (!!creds.account && !!creds.password) {
    let formData = {
      un: creds.account,
      pw: creds.password
    }
    sendMessage('asynchronous-message', 'appLoaded', formData);
    sendMessage('asynchronous-message', 'loading');
  }
});

const formatFileSize = (bytes, decimalPoint) => {
  if (bytes == 0) return '0 Bytes';
  var k = 1000,
    dm = decimalPoint || 2,
    sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const formatFileSizeNoUnit = (bytes, ksize,decimalPoint) => {
  if (bytes == 0) return '0 Bytes';
  var k = ksize||1000,
    dm = decimalPoint || 2,
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
};

const getDaysLeft = (day) => {
  let result = getRollover(day)
  return result.diff(moment().startOf('day'), 'days');
}

const getDaysPast = (day) => {
  let result = getRollover(day)
  return result.subtract(1, 'month').diff(moment().startOf('day'), 'days') * -1;
}

const getRollover = (day) => {
  let dayOfMonth = moment().format('DD');

  return (dayOfMonth < day) ? moment().startOf('day').add(day - dayOfMonth, 'day') : moment().startOf('day').add(1, 'month').date(day);
}

const getAppVersion = () => {
  return app.getVersion();
}

const formatGB = (mb) => {
  let conversion = mb/1024;
  return Number(conversion.toFixed(2));
}

//new function to login pass it user / password and it will store a cookie in global.abb to reuse in other endpoints
