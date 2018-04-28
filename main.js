const {  ipc, app, BrowserWindow, Menu, Tray, ipcMain } = require('electron');
const path = require('path');
const request = require('request');
const moment = require('moment');
const Store = require('electron-store');
const store = new Store();

let tray = null;

let aussie = request.jar();


const WINDOW_WIDTH = 350;
const WINDOW_HEIGHT = 335;
const HORIZ_PADDING = 65;
const VERT_PADDING = 15;

let storedSettings = {
  pw:  store.get('password'),
  un:  store.get('username')
};

app.on('ready', () => {
  var platform = require('os').platform();  

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Update', click: () => { updateData(); }  },
    { label: 'Quit', click: () => { app.quit(); } },
  ]);

  // Determine appropriate icon for platform
  if (platform == 'darwin') {  
    const iconPath = path.join(__dirname, 'tray_icon.png');
    tray = new Tray(iconPath);
  }
  else if (platform == 'win32') {  
    const iconPath = path.join(__dirname, 'aussie_icon.ico');
    tray = new Tray(iconPath);
  }
  if (storedSettings) {
    tray.setToolTip('Getting data from AussieBB...');
    tray.setContextMenu(contextMenu);
    tray.on('click', function (event) {
      toggleWindow()
    });
  
  
    createWindow();
  
  
    updateData();
  }
  else{
    createWindow();
    tray.setToolTip('Login to check your usage....');
    tray.setContextMenu(contextMenu);
    tray.on('click', function (event) {
      toggleWindow()
    });
  
  
  
  }
 
});

 // Quit when all windows are closed.
 app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

const updateData = () => {
    request.post({
        url: 'https://my.aussiebroadband.com.au/usage.php?xml=yes',
        form: {
            login_username: storedSettings.un,
            login_password: storedSettings.pw
        },
        followAllRedirects: true,
        jar: aussie
    },
    function (error, response, body) {
        if (!error) {
            console.log(response.statusCode)
            //console.log(body)
            var parseString = require('xml2js').parseString;
            var xml = body
            parseString(xml, function (err, result) {
                console.dir(result);
                const timestamp = moment(result.usage.lastUpdated).fromNow();
                const dataLeft_mb  = (result.usage.left1/1048576).toFixed(2);
                const percent =  (100 * dataLeft_mb) / result.usage.allowance1_mb;
                //Update tray tool tip
                if (result.usage.allowance1_mb == 100000000) { // unlimited test
                  tray.setToolTip(`You have used D:${formatFileSize(result.usage.down1,2)} U:${formatFileSize(result.usage.up1,2)} as of ${timestamp}, ${result.usage.rollover} Day/s till rollover`);
                }
                else {
                  tray.setToolTip(`You have ${percent.toFixed(2)}% / ${formatFileSize(result.usage.left1,2)} left as of ${timestamp}, ${result.usage.rollover} Day/s till rollover`);
                }
            });
        } else {
            console.log(error)
        }
    });    
};

function formatFileSize(bytes,decimalPoint) {
  if(bytes == 0) return '0 Bytes';
  var k = 1000,
      dm = decimalPoint || 2,
      sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
      i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const getWindowPosition = () => {
  const windowBounds = window.getBounds();
  const trayBounds = tray.getBounds();

  // Center window horizontally below the tray icon
  const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));

  // Position window 4 pixels vertically below the tray icon
  const y = Math.round(trayBounds.y + trayBounds.height - 365);

  return {x: x, y: y};
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
  })
  window.loadURL(`file://${path.join(__dirname, 'views/settings.html')}`)

  // Hide the window when it loses focus
  window.on('blur', () => {
    if (!window.webContents.isDevToolsOpened()) {
      window.hide()
    }
  })
}

const toggleWindow = () => {

    const {screen} = require('electron');

    const cursorPosition = screen.getCursorScreenPoint();
    const primarySize = screen.getPrimaryDisplay().workAreaSize; // Todo: this uses primary screen, it should use current
    const trayPositionVert = cursorPosition.y >= primarySize.height/2 ? 'bottom' : 'top';  
    const trayPositionHoriz = cursorPosition.x >= primarySize.width/2 ? 'right' : 'left';  
    window.setPosition(getTrayPosX(),  getTrayPosY());
    window.show();
    window.focus();

    function getTrayPosX(){
      // Find the horizontal bounds if the window were positioned normally
      const horizBounds = {
        left:   cursorPosition.x - WINDOW_WIDTH/2,
        right:  cursorPosition.x + WINDOW_WIDTH/2
      }
      // If the window crashes into the side of the screem, reposition
      if(trayPositionHoriz == 'left'){
        return horizBounds.left <= HORIZ_PADDING ? HORIZ_PADDING : horizBounds.left;
      }
      else{
        return horizBounds.right >= primarySize.width ? primarySize.width - HORIZ_PADDING - WINDOW_WIDTH: horizBounds.right - WINDOW_WIDTH;
      }
    }    
    function getTrayPosY(){
      return trayPositionVert == 'bottom' ? cursorPosition.y - WINDOW_HEIGHT - VERT_PADDING : cursorPosition.y + VERT_PADDING;
    }
  
}

const showWindow = () => {
  const position = getWindowPosition();
  window.setPosition(position.x, position.y, false);
  window.show();

}

ipcMain.on('show-window', (event, arg) => {

   // send user settings to settings.html
   let userSettings = {
    un: store.get('username'),
    pw: store.get('password'),
  }

  event.sender.send('asynchronous-reply',  userSettings)

  showWindow()
})

// receive message from index.html 
ipcMain.on('asynchronous-message', (event, arg) => {
  //console.log( arg ),

  store.set('username', arg.un),
  store.set('password', arg.pw),

  updateData(),
  window.hide();
  
  // send message to index.html
  let userSettings = {
    un: store.get('username'),
    pw: store.get('password'),
  }

  event.sender.send('asynchronous-reply',  userSettings);
});
