const {  ipc, app, BrowserWindow, Menu, Tray,ipcMain } = require('electron');
const path = require('path');
const request = require('request');
const moment = require('moment');
const Store = require('electron-store');
const store = new Store();

let tray = null;

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



const updateData = () => {
  const puppeteer = require('puppeteer');
  
  run();
  
  
  //get data from aussie
  async function run() {
    // dom element selectors
    const USERNAME_SELECTOR = '#form > form > table > tbody > tr:nth-child(1) > td:nth-child(2) > input';
    const PASSWORD_SELECTOR = '#form > form > table > tbody > tr:nth-child(2) > td:nth-child(2) > input';
    const BUTTON_SELECTOR = '#form > form > input:nth-child(8)';
      
    const browser = await puppeteer.launch({
      headless: true
    });

    const page = await browser.newPage();

    await page.goto('https://my.aussiebroadband.com.au/usage.php?xml=yes');

    await page.click(USERNAME_SELECTOR);
    await page.keyboard.type(store.get('username'));

    await page.click(PASSWORD_SELECTOR);
    await page.keyboard.type(store.get('password'));

    await page.click(BUTTON_SELECTOR);

    await waitForLoad(page, 800)

    let dataLeft = await page.evaluate(
      () => document.querySelector('#collapsible0 > div.expanded > div.collapsible-content > div:nth-child(8) > span.text').textContent
    );

    let allowance_mb = await page.evaluate(
      () => document.querySelector('#collapsible0 > div.expanded > div.collapsible-content > div:nth-child(6) > span.text').textContent
    );

    let daysLeft = await page.evaluate(
      () => document.querySelector('#collapsible0 > div.expanded > div.collapsible-content > div:nth-child(20) > span.text').textContent
    );

    let updatedDate = await page.evaluate(
      () => document.querySelector('#collapsible0 > div.expanded > div.collapsible-content > div:nth-child(18) > span.text').textContent
    );
    
    let response = {
      left: dataLeft,
      plan: allowance_mb,
      roll: daysLeft,
      update: updatedDate
    }

    //console.log(response);
    if (!response) { 
      tray.setToolTip('Something wrong getting data from AussieBB, maybe user/password are incorrect.');
    }
    else {

      //console.log($);
      const timestamp = moment(response.update).fromNow();

      const dataLeft_mb  = (response.left/1048576).toFixed(2);

      const percent =  (100 * dataLeft_mb) / response.plan;

      //console.log(dataLeft_mb);

      tray.setToolTip(`You have ${percent.toFixed(2)}% / ${formatFileSize(response.left,2)} left as of ${timestamp} and ${response.roll} Day/s till rollover`);
    }
    


    browser.close();
  }
  //wait for page load fix for aussie php
  const waitForLoad = (page, time) => new Promise((resolve) => {
    page.on('rquest', (req) => {
      waitForLoad(page, time)
    })
    page.on('requestfinished', (req) => {
      setTimeout(() => resolve("timeOut"), time)
    })
  })

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
    width: 350,
    height: 335,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: false,
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
  window.isVisible() ? window.hide() : showWindow();
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