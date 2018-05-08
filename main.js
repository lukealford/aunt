'use strict'
const {
  ipc,
  app,
  BrowserWindow,
  Menu,
  Tray,
  ipcMain,
  nativeImage
} = require('electron');
const path = require('path');
const request = require('request');
const moment = require('moment');
const Store = require('electron-store');
const xml2js = require('xml2js');
const handlebars = require('handlebars');
const handlebarsIntl = require('handlebars-intl');
const fs = require('fs');
// const {
//   autoUpdater
// } = require("electron-updater");

// catch all for errors, etc
const unhandled = require('electron-unhandled');
unhandled();

// wire up right click context menu
require('electron-context-menu')({
  prepend: (params, browserWindow) => [{}]
});

const store = new Store();

var line = null

let tray = null;
let window = null;
let windowPos = null;

let pos = store.get('windowPos');

const WINDOW_WIDTH = 350;
const WINDOW_HEIGHT = 340;
const HORIZ_PADDING = 50;
const VERT_PADDING = 10;
const platform = require('os').platform();

handlebarsIntl.registerWith(handlebars);

let sourcePath = path.resolve(__dirname, './templates/snapshot.hbs');
let snapshotSource = fs.readFileSync(sourcePath).toString();
let snapshotTemplate = handlebars.compile(snapshotSource);

let toolTipPath = path.resolve(__dirname, './templates/tooltip.hbs');
let toolTipSource = fs.readFileSync(toolTipPath).toString();
let toolTipTemplate = handlebars.compile(toolTipSource);


app.on('ready', async () => {
  // current recommended way to fix transparent issue on linux
  if (platform == 'linux') {
    await delayForLinux();
  }
  // autoUpdater.checkForUpdatesAndNotify();

  let iconPath = nativeImage.createFromPath(path.join(__dirname, 'assets/icons/aussie_icon.png'));

  tray = new Tray(iconPath);

  if (platform !== 'linux') {
    tray.on('click', function (event) {
      toggleWindow();
    });
  } else if (platform == 'darwin') {
    app.dock.hide()
  }

  createWindow();

  let username = store.get('username');
  let password = store.get('password');



  // test if we have stored creds
  if (!!username && !!password) {
    loggedIn();
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

const updateData = async () => {
  let username = store.get('username');
  let password = store.get('password');

  if (!!username && !!password) {
    loggedIn();

    try {
      let result = await getXML(username, password);
      console.log(result)

      let usage = {}

      usage.lastUpdated = result.usage.lastupdated
      usage.updateTime = moment().format('h:mm a');
      usage.unlimited = (result.usage.allowance1_mb == 100000000) ? true : false;
      usage.corp = (result.usage.allowance1_mb == 0) ? true : false;
      usage.nolimit = (usage.unlimited || usage.corp) ? true : false;
      usage.limit = (usage.unlimited) ? -1 : (result.usage.allowance1_mb == 0) ? -1 : result.usage.allowance1_mb / 1000;
      usage.limitRemaining = (usage.limit == -1) ? -1 : Math.round((result.usage.left1 / 1000 / 1000 / 1000) * 100) / 100;
      usage.downloaded = Math.round((result.usage.down1 / 1000 / 1000 / 1000) * 100) / 100;
      usage.uploaded = Math.round((result.usage.up1 / 1000 / 1000 / 1000) * 100) / 100;
      usage.daysRemaining = getDaysLeft(result.usage.rollover);
      usage.daysPast = getDaysPast(result.usage.rollover);
      usage.endOfPeriod = getRollover(result.usage.rollover).format('YYYY-MM-DD');
      usage.averageUsage = Math.round(((usage.downloaded + usage.uploaded) / usage.daysPast) * 100) / 100;
      usage.averageLeft = (usage.limit == -1) ? -1 : Math.round((usage.limitRemaining / usage.daysRemaining) * 100) / 100;
      usage.percentRemaining = (usage.limit == -1) ? -1 : Math.round((usage.limitRemaining / usage.limit * 100) * 100) / 100;

      console.log(usage)
      setToolTipText(usage);
      sendMessage('asynchronous-message', 'fullData', usage);
    } catch (e) {
      if (e.usage.error) {
        let message = e.usage.error;
      } else {
        let message = `An issue has occured retrieving your usage data`
      }
      tray.setToolTip(message);
      sendMessage('asynchronous-message', 'error', message)
      console.log(e);
    }

    if (pos) {
      sendMessage('asynchronous-message', 'showHeaderUI', 'showButtons');
      console.log("show header buttons");
    }
  }
};

const setToolTipText = (usage) => {
  let message = toolTipTemplate(usage);
  tray.setToolTip(message);
}

const getXML = (username, password) => {
  return new Promise((resolve, reject) => {
    console.log(username)
    let aussie = request.jar();
    request.post({
      url: 'https://my.aussiebroadband.com.au/usage.php?xml=yes',
      form: {
        login_username: username,
        login_password: password
      },
      followAllRedirects: true,
      jar: aussie
    }, (error, response, body) => {
      if (error) {
        reject(error)
      } else {
        if (response.headers['content-type'] === 'text/xml;charset=UTF-8') {
          let options = {
            explicitArray: false,
            valueProcessors: [xml2js.processors.parseNumbers]
          };
          xml2js.parseString(body, options, (err, result) => {
            if (error) {
              reject(error)
            } else {
              resolve(result);
            }
          })
        } else {
          reject('bad login')
        }
      }
    });
  })
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

const logOut = () => {
  store.clear();
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
      backgroundThrottling: false
    }
  });

  window.loadURL(`file://${path.join(__dirname, 'views/settings/index.html')}`);

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


ipcMain.on('form-submission', (event, creds) => {
  console.log('form-submission');
  store.set('username', creds.un);
  store.set('password', creds.pw);

  loggedIn();
  updateData();
});

ipcMain.on('refresh-data', (event, args) => {
  updateData();
});

ipcMain.on('window-show', (event, args) => {
  console.log('window-show');
  let username = store.get('username');
  let password = store.get('password');

  // test if we have stored creds
  if (!!username && !!password) {
    let creds = {
      un: username,
      pw: password
    }
    sendMessage('asynchronous-message', 'appLoaded', creds);
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

const formatFileSizeNoUnit = (bytes, decimalPoint) => {
  if (bytes == 0) return '0 Bytes';
  var k = 1000,
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

module.exports = {
  formatFileSize: formatFileSize,
  formatFileSizeNoUnit: formatFileSizeNoUnit,
  getDaysLeft: getDaysLeft,
  getDaysPast: getDaysPast,
  getRollover: getRollover,
  snapshotTemplate: snapshotTemplate,
  getAppVersion: getAppVersion,
}