const {
  ipc,
  app,
  BrowserWindow,
  Menu,
  Tray,
  ipcMain
} = require('electron');
const path = require('path');
const request = require('request');
const moment = require('moment');
const Store = require('electron-store');
// const {
//   autoUpdater
// } = require("electron-updater");
const store = new Store();

let tray = null;
let window = null;

const WINDOW_WIDTH = 350;
const WINDOW_HEIGHT = 335;
const HORIZ_PADDING = 65;
const VERT_PADDING = 20;
const platform = require('os').platform();

app.on('ready', () => {
  // autoUpdater.checkForUpdatesAndNotify();

  // Determine appropriate icon for platform
  let iconPath = null
  if (platform === 'win32') {
    iconPath = path.join(__dirname, 'assets\\icons\\aussie_icon.ico');
  } else {
    iconPath = path.join(__dirname, 'assets\\icons\\aussie_icon.png');
  }
  tray = new Tray(iconPath);

  if (platform === 'darwin') {
    tray.on('right-click', function (event) {
      tray.popUpContextMenu(contextMenu);
    });
  }

  if (platform !== 'linux') {
    tray.on('click', function (event) {
      toggleWindow();
    });
  }

  createWindow();

  // test if we have stored creds
  if (!!store.get('username') && !!store.get('password')) {
    let creds = {
      un: store.get('username'),
      pw: store.get('password')
    };
    loggedIn();
    updateData();
  } else {
    toggleWindow();
    loggedOut();
  }
});

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
    tray.popUpContextMenu(loggediNMenu);
  } else {
    tray.setContextMenu(loggediNMenu);
  }
  tray.setToolTip('Getting data from AussieBB...');
}

const loggedOut = () => {
  if (platform === 'darwin') {
    tray.popUpContextMenu(contextMenu);
  } else {
    tray.setContextMenu(contextMenu);
  }
  tray.setToolTip('Login to check your usage....');
}

const updateData = () => {
  let aussie = request.jar();
  request.post({
      url: 'https://my.aussiebroadband.com.au/usage.php?xml=yes',
      form: {
        login_username: store.get('username'),
        login_password: store.get('password')
      },
      followAllRedirects: true,
      jar: aussie
    },
    function (error, response, body) {
      if (!error) {
        var parseString = require('xml2js').parseString;
        if (response.headers['content-type'] === 'text/xml;charset=UTF-8') {
          
          loggedIn();
          sendMessage('asynchronous-message', 'success', 'Login success');

          console.log('raw XML', body);
          parseString(body, function (err, result) {
            console.dir(result);
            sendMessage('asynchronous-message', 'fullData', result);
            //Update tray tool tip
            const timestamp = moment(result.usage.lastUpdated).fromNow();
            const date = new Date();
            const today = moment(date);

            let daysToRoll = null
            let rolldate = null

            if (result.usage.rollover < 10) {
              rolldate = 0 + '' + result.usage.rollover;
              rolldate = moment(new Date(date.getFullYear(), date.getMonth() + 1, rolldate));
              daysToRoll = rolldate.diff(today, 'days');
              console.log(daysToRoll);
            } else {
              rolldate = result.usage.rollover;
              rolldate = moment(new Date(date.getFullYear(), date.getMonth() + 1, rolldate));
              daysToRoll = rolldate.diff(today, 'days');
              console.log(daysToRoll);
            }

            if (result.usage.allowance1_mb == 100000000) { // unlimited test
              console.log('unlimited account');
              tray.setToolTip(`You have used D:${formatFileSize(result.usage.down1, 2)} U:${formatFileSize(result.usage.up1, 2)} as of ${timestamp}, ${daysToRoll} Day/s till rollover`);
            } else if (result.usage.left1 == '') { // corp test
              console.log('corp account');
              tray.setToolTip(`You have used D:${formatFileSize(result.usage.down1, 2)} U:${formatFileSize(result.usage.up1, 2)}, ${daysToRoll} Day/s till rollover`);
            } else {
              console.log('normal account');
              const dataLeft_mb = (result.usage.left1 / 1000000) / JSON.parse(result.usage.allowance1_mb);
              const percent = dataLeft_mb * 100;
              console.log('data left', dataLeft_mb);
              console.log('allowance', JSON.parse(result.usage.allowance1_mb));
              console.log('percent', percent);
              tray.setToolTip(`You have ${percent.toFixed(2)}% / ${formatFileSize(result.usage.left1, 2)} left as of ${timestamp}, ${result.usage.rollover} Day/s till rollover`);
            }
          });
        } else {
          let message = `An issue has occured retrieving your usage data`
          tray.setToolTip(message);
          sendMessage('asynchronous-message', 'error', message)
          console.log(message)
        }
      } else {
        tray.setToolTip(`An issue has occured retrieving your usage data`);
        console.log(error)
      }
    });
};

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
  sendMessage('asynchronous-message', 'loggedOut', 'Logged message');
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

  // Hide the window when it loses focus
  window.on('blur', () => {
    if (!window.webContents.isDevToolsOpened()) {
      window.hide();
    }
  });
}

const toggleWindow = () => {
  const {
    screen
  } = require('electron');

  const cursorPosition = screen.getCursorScreenPoint();
  const primarySize = screen.getPrimaryDisplay().workAreaSize; // Todo: this uses primary screen, it should use current
  const trayPositionVert = cursorPosition.y >= primarySize.height / 2 ? 'bottom' : 'top';
  const trayPositionHoriz = cursorPosition.x >= primarySize.width / 2 ? 'right' : 'left';
  window.setPosition(getTrayPosX(), getTrayPosY());

  window.show();
  window.focus();

  function getTrayPosX() {
    // Find the horizontal bounds if the window were positioned normally
    const horizBounds = {
      left: cursorPosition.x - WINDOW_WIDTH / 2,
      right: cursorPosition.x + WINDOW_WIDTH / 2
    }
    // If the window crashes into the side of the screem, reposition
    if (trayPositionHoriz == 'left') {
      return horizBounds.left <= HORIZ_PADDING ? HORIZ_PADDING : horizBounds.left;
    } else {
      return horizBounds.right >= primarySize.width ? primarySize.width - HORIZ_PADDING - WINDOW_WIDTH : horizBounds.right - WINDOW_WIDTH;
    }
  }

  function getTrayPosY() {
    return trayPositionVert == 'bottom' ? cursorPosition.y - WINDOW_HEIGHT - VERT_PADDING : cursorPosition.y + VERT_PADDING;
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

  updateData();
});

ipcMain.on('window-show', (event, args) => {
  console.log('window-show')
});

formatFileSize = (bytes, decimalPoint) => {
  if (bytes == 0) return '0 Bytes';
  var k = 1000,
    dm = decimalPoint || 2,
    sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

formatFileSizeNoUnit = (bytes, decimalPoint) => {
  if (bytes == 0) return '0 Bytes';
  var k = 1000,
    dm = decimalPoint || 2,
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
};

module.exports = {
  formatFileSize: formatFileSize,
  formatFileSizeNoUnit: formatFileSizeNoUnit
}