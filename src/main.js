'use strict'

import { ipc, app, BrowserWindow, Menu, Tray, ipcMain, nativeImage } from "electron";
import { resolve as _resolve, join } from "path";
import request from "request";
import moment from "moment";
import Store from "electron-store";
import handlebars, { compile } from "handlebars";
import { registerWith } from "handlebars-intl";
import { readFileSync } from "fs";
import ipRangeCheck from 'ip-range-check';
import tcpie from 'tcpie';
const storedCookie = new Store();

// wire up right click context menu
const contextMenuIReq  = require('electron-context-menu');
contextMenuIReq({
});


// catch all for errors, etc
import unhandled from "electron-unhandled";
import { isArray } from "util";
unhandled();

let serviceID = null;
const store = new Store();
global.abb = request.jar();

var line = null
let tray = null;
let window = null;
let creds = {};
let windowPos = null;
var trayPos = null
var primarySize = null
var trayPositionVert = null;
var trayPositionHoriz = null;

const WINDOW_WIDTH = 380;
const WINDOW_HEIGHT = 530;
const HORIZ_PADDING = 50;
const VERT_PADDING = 10;

const windowOptions = {
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
}

let pos = store.get('windowPos');

const platform = require('os').platform();

registerWith(handlebars);

let sourcePath = _resolve(__dirname, './templates/snapshot.hbs');
let snapshotSource = readFileSync(sourcePath).toString();
export const snapshotTemplate = compile(snapshotSource);

let netWorkPath = _resolve(__dirname, './templates/network.hbs');
let networkSource = readFileSync(netWorkPath).toString();
export const networkTemplate = compile(networkSource);

let toolTipPath = _resolve(__dirname, './templates/tooltip.hbs');
let toolTipSource = readFileSync(toolTipPath).toString();
export const toolTipTemplate = compile(toolTipSource);


app.on('ready', async () => {
  // current recommended way to fix transparent issue on linux
  if (platform == 'linux') {
    await delayForLinux();
  }
  // autoUpdater.checkForUpdatesAndNotify();
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
  toggleWindow();
});

const delayForLinux = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('ok')
    }, 1000);
  });
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

const contextMenu = Menu.buildFromTemplate([{
  label: '🔐 Login',
  click: () => {
    toggleWindow();
  }
},
{
  label: '❌ Quit',
  click: () => {
    app.quit();
  }
},
]);

const loggediNMenu = Menu.buildFromTemplate([{
  label: '📈 Details',
  click: () => {
    toggleWindow();
  }
},
{
  label: '⚡ Update',
  click: () => {
    updateData();
  }
},
{
  label: ' ✔ Enable Auto Update',
  click: () => {
    AutoupdateData(true);
  }
},
{
  label: '🔐 Logout',
  click: () => {
    logOut();
  }
},
{
  label: '❌ Quit',
  click: () => {
    app.quit();
  }
},
]);


const UpdateEnabledMenu = Menu.buildFromTemplate([{
  label: '📈 Details',
  click: () => {
    toggleWindow();
  }
},
{
  label: '⚡ Update',
  click: () => {
    updateData();
  }
},
{
  label: '✖ Disable Auto Update',
  click: () => {
    AutoupdateData(false);
  }
},
{
  label: '🔐 Logout',
  click: () => {
    logOut();
  }
},
{
  label: '❌ Quit',
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
  let sc = storedCookie.get('cookie');
    return new Promise((resolve, reject) => {
      if(sc){
        global.abb.setCookie(sc,'https://aussiebroadband.com.au');
        resolve(true);
      }else{
        resolve(false)
      }
    });
}

const updateData = async () => {
      loggedIn();
      let service = await getCustomerData();
      let result = await getUsage(service.service_id);
      let poiData = await getPOI();
      let usage = {}
      usage.lastUpdated =moment(result.lastUpdated).startOf('hour').fromNow();
      usage.updateTime = moment().format('h:mm a');
      usage.unlimited = (result.remainingMb == null) ? true : false;
      //usage.corp = (result.usedMb.allowance1_mb == 0) ? true : false;
      usage.nolimit = (usage.unlimited) ? true : false;
      usage.limit = (usage.unlimited) ? -1 : (formatSize(result.usedMb+result.remainingMb));
      usage.limitRemaining = formatSize(result.remainingMb);
      usage.downloaded = formatSize(result.downloadedMb);
      usage.uploaded = formatSize(result.uploadedMb);
      usage.daysRemaining = result.daysRemaining;
      usage.daysPast = (result.daysTotal - result.daysRemaining);
      //usage.endOfPeriod = getRollover(result.usage.rollover).format('YYYY-MM-DD');
      usage.averageUsage = formatSize(Math.round(((result.downloadedMb + result.uploadedMb) / usage.daysPast) * 100) / 100);
      usage.averageLeft = (usage.limit == -1) ? -1 : formatSize(Math.round(usage.limitRemaining / usage.daysRemaining * 100) / 100);
      usage.percentRemaining = (usage.limit == -1) ? -1 : Math.round(usage.limitRemaining / usage.limit * 100) / 100;
      //usage.percentRemaining = Math.round(usage.downloaded+usage.uploaded / 1000 * 100) / 100;
      usage.poi = service.poi;
      usage.poiURL = poiData.url;
      usage.product = service.product;
      //console.log(usage);
      setToolTipText(usage);
      console.log('Updating Interface');
      sendMessage('asynchronous-message', 'fullData', usage);
}
    


const updateNetworkData = async () => {
    let network = {}
    sendMessage('asynchronous-message', 'loading');
    let ipv4Data = await getIPv4();
    let ipv6Data = await getIPv6();
    let cgnatData = await getCGNAT(ipv4Data);
    let pingBrisbaneData = await runPing('lg-bne.aussiebroadband.com.au', 'Brisbane');
    let pingSydneyData = await runPing('lg-syd.aussiebroadband.com.au', 'Sydney');
    let pingMelbourneData = await runPing('lg-mel.aussiebroadband.com.au', 'Melbourne');
    let pingAdelaideData = await runPing('lg-ade.aussiebroadband.com.au', 'Adelaide');
    let pingPerthData = await runPing('lg-per.aussiebroadband.com.au', 'Perth');
    let pingSanJoseData = await runPing('sjo-ca-us-ping.vultr.com', 'San Jose');
    let pingSingaporeData = await runPing('sgp-ping.vultr.com', 'Singapore');
    let pingLondonData = await runPing('lon-gb-ping.vultr.com', 'London');
    network.ipv4 = ipv4Data;
    network.ipv6 = ipv6Data;
    network.cgnat = cgnatData;
    network.pingadelaide = pingAdelaideData;
    network.pingmelbourne = pingMelbourneData;
    network.pingsydney = pingSydneyData;
    network.pingperth = pingPerthData;
    network.pingbrisbane = pingBrisbaneData;
    network.pingsanjose = pingSanJoseData;
    network.pingsingapore = pingSingaporeData;
    network.pinglondon = pingLondonData;
    console.log('Updating Interface');
    sendMessage('asynchronous-message', 'showNetwork', network);
};

const getIPv4 = () => {
  sendMessage('asynchronous-message', 'UI-notification', 'Finding IPv4');
  return new Promise((resolve, reject) => {
    const url = "https://ipv4bot.whatismyipaddress.com";

    request({
      url: url,
      timeout: 10000
    }, function (error, response, body) {
      if (error) {
        resolve('No IPv4 Found');
      } else {
        resolve(body);
      }
    });
  });
}

const getIPv6 = () => {
  sendMessage('asynchronous-message', 'UI-notification', 'Finding IPv6');
  return new Promise((resolve, reject) => {
    const url = "https://ipv6bot.whatismyipaddress.com";

    request({
      url: url,
      timeout: 10000
    }, function (error, response, body) {
      if (error) {
        console.log(error)
        resolve('No IPv6 Found');
      } else {
        resolve(body);
      }
    });
  });
}

const getCGNAT = (ip) => {
  sendMessage('asynchronous-message', 'UI-notification', 'Checking CGNAT');
  return new Promise((resolve, reject) => {
    if(ipRangeCheck(ip, ["119.17.136.0/22", "202.153.220.0/24", "180.150.112.0/22", "180.150.95.0/24", "180.150.80.0/22", "180.150.84.0/24", "180.150.92.0/23", "180.150.94.0/24"])) {
      resolve('Enabled');
    } else {
      resolve('Disabled');
    }
  })
}

const runPing = (host, name) => {

  sendMessage('asynchronous-message', 'UI-notification', 'Checking Latendy to ' + name);

  return new Promise((resolve, reject) => {
    
    let values = [];
    let ping = tcpie(host, 443, {count: 5, interval: 500, timeout: 3000});

    ping.on('connect', function(stats) {
      values.push(Math.round(stats.rtt));
    }).on('error', function(err, stats) {
      resolve("Failed");
    }).on('end', function(stats) {
      let sum = values.reduce((previous, current) => current += previous);
      let avg = sum / values.length;
      resolve(avg + "ms")
    }).start()
  })
}

const abbLogin = (user,pass) =>{
  console.log('Fired abb login');
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
        setTimeout(
          function(){
            sendMessage('asynchronous-message', 'error', error)
          }, 1000
        );
      } else {
        let res = JSON.parse(body);
        if (res.message === 'The user credentials were incorrect') {
          console.log('login error from response');
          deleteCookies();
          setTimeout(
            function(){
              sendMessage('asynchronous-message', 'error', res.message)
            }, 1000
          );
          sendMessage('asynchronous-message', 'error', res.message)
        }
        else if (res.error === 'invalid_credentials'){
          console.log('login error from response');
          deleteCookies();
          setTimeout(
            function(){
              sendMessage('asynchronous-message', 'error', res.error)
            }, 1000
          );
          sendMessage('asynchronous-message', 'error', res.error)
        }
        else{
          let cookie = global.abb.getCookies('https://aussiebroadband.com.au', 'Cookie="myaussie_cookie'); // "key1=value1; key2=value2; ...
          console.log(cookie);
          let cookieData = {
            cookie,
            res
          }
          storeCookieData(cookieData);
          resolve(res);
        }
      }
    })
  })
}

//gets the first serviceID in a customers account
const getCustomerData = () =>{
  console.log('Fired get customer data');
  sendMessage('asynchronous-message', 'UI-notification', 'Getting your service ID');
  sendMessage('asynchronous-message', 'loading');
  return new Promise((resolve, reject) => {
    request.get({url: 'https://myaussie-api.aussiebroadband.com.au/customer',headers: {'User-Agent': 'aunt-v1'},jar: global.abb
    }, (error, response, body) => {
        let temp = JSON.parse(body);
        if(error){
          console.log(error);
        }
        else if(temp.error){
          sendMessage('asynchronous-message', 'error', body.error);
        }
        else if(temp.services){
          let result = {
            service_id:temp.services.NBN[0].service_id,
            product: temp.services.NBN[0].nbnDetails.product,
            poi: temp.services.NBN[0].nbnDetails.poiName,
            ips:temp.services.NBN[0].ipAddresses
          }
          serviceID = temp.services.NBN[0].service_id;
          resolve(result);
        }  
    })
  })
}


const getPOI = () => {
  console.log('Fired get poi data');
  sendMessage('asynchronous-message', 'loading');
  sendMessage('asynchronous-message', 'UI-notification', 'Figuring out what POI Link you are on');
  return new Promise((resolve, reject) => {
    const url = "https://www.aussiebroadband.com.au/__process.php?mode=CVCDropdown";
    request({
      url: url,
      json: true
    }, function (error, response, body) {
      if (error) {
        reject('Could not get POI list');
      } else {
        let selectedPOI = false
        for (let key in body) {
          let poi = body[key];
          if(poi.selected == true) {
            selectedPOI = { name: poi.name, url: poi.url }
          }
        }
        if(selectedPOI) {
          resolve(selectedPOI)
        } else {
          resolve( { name: 'n/a', url:'n/a' })
        }
      }
    });
  });
}

//gets usage based on serviceID, requires a service_id passed to it
const getUsage = (id) =>{
  console.log('Fired get usage data');
  sendMessage('asynchronous-message', 'loading');
  sendMessage('asynchronous-message', 'UI-notification', 'Getting your usage data');
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


const getHistoricalUsage = (url) =>{
  let today = new Date();
  let year = today.getFullYear();
  let month =  today.getMonth();
  console.log("getting historical usage");

  return new Promise((resolve, reject) => {
    request.get({
      url: url || 'https://myaussie-api.aussiebroadband.com.au/broadband/'+serviceID+'/usage/'+year+'/'+month+'',
      jar: global.abb
    }, (error, response, body) => {
        let data = JSON.parse(body);
        console.log('historical returned');
        sendMessage('asynchronous-message', 'showHistory', data);
    })
  })
}




const setToolTipText = (usage) => {
  //console.log(usage);
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
    deleteCookies();
    creds.account = null;
    creds.password = null;
  } catch (e) {
    sendMessage('asynchronous-message', 'error', 'deleting Account and Password failed')
    console.log(e);
  }
  sendMessage('asynchronous-message', 'loggedOut', 'Logout');
  loggedOut();
  toggleWindow();
}

const createWindow = () => {

  window = new BrowserWindow(windowOptions);
  window.setContentSize(windowOptions.width, windowOptions.height); // workaround for 2.0.1 bug
  window.loadURL(`file://${join(__dirname, 'app/index.html')}`);
  pos = store.get('windowPos');
  //window.webContents.openDevTools({ mode: 'undocked' });
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
}



const getTrayPosX = () => {
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

const getTrayPosY = () => {
  return trayPositionVert == 'bottom' ? trayPos.y - WINDOW_HEIGHT - VERT_PADDING : trayPos.y + VERT_PADDING;
}

const sendMessage = (channel, eventName, message) => {
  console.log('sendMessage: ', eventName)
  window.webContents.send(eventName, message);
  //toggleWindow();
}

ipcMain.on('form-submission', async (event, formData) => {
  console.log('form-submission');
  try {
    creds.account = formData.un;
    creds.password = formData.pw;
    await abbLogin(creds.account,creds.password);
    updateData();
  } catch (e) {
    sendMessage('asynchronous-message', 'error', 'saving Account and Password failed')
    console.log(e);
  }
});

ipcMain.on('refresh-data', async (event, args) => {
  let cookie = await checkAbbCookie();
  if(cookie){
    updateData();
  }else{
    logOut();
  }
});

ipcMain.on('get-historical', (event, args) => {
  sendMessage('asynchronous-message', 'loading');
  sendMessage('asynchronous-message', 'UI-notification', 'Requesting Historical data from API');
  if(args){
    getHistoricalUsage(args);
  }else{
    getHistoricalUsage();
  }
});

ipcMain.on('get-network', (event, args) => {
  updateNetworkData();
});

ipcMain.on('open-poi', (event, args) => {
  const {shell} = require('electron');
  console.log('url from front-end',args);
  if(args === "n/a"){
    shell.openExternal('https://www.aussiebroadband.com.au/cvc-graphs/');
  }else{
    shell.openExternal(args);
  }
});

ipcMain.on('window-show', async (event, args) => {
  console.log('window-show');
  let cookieCheck = await checkAbbCookie();
  // test if we have stored cookie
  if(cookieCheck === true) {

    let renew = await checkIfTokenNearExpire();
    if(renew === true){
      updateData();
      //check for auto update setting
      AutoupdateData();
    }else{
      logOut();
    }
  } else {
    logOut();
  }
});

const formatSize = (mb) => {
  let bytes = mb * 1000000;
  console.log(bytes);
  let formatted = formatBytes(bytes);

  return formatted;
}

const AutoupdateData = (stateArg) => {
  let state = stateArg || store.get('autoUpdate');
  console.log('Auto Update state: ', state);
  var cron = require('node-cron');
  var task = cron.schedule('*/30 */1 * * *', () =>  {
    console.log('Running auto update');
    updateData();
  }); 
  task.stop();
  if(state === true){
    sendMessage('asynchronous-message', 'UI-notification','❗ Auto Update Enabled');
    store.set('autoUpdate',true);
    tray.setContextMenu(UpdateEnabledMenu);
    task.start();
  }else{
    sendMessage('asynchronous-message', 'UI-notification', '❗ Auto Update Disabled');
    store.set('autoUpdate',false);
    tray.setContextMenu(loggediNMenu);
    task.stop();
  }
}

const storeCookieData = (data) =>{
  let cookieRaw = data.cookie[0].toString();
  let cookieArray = cookieRaw.split(";");
  console.log('cookie raw: ',cookieRaw)
  storedCookie.set('refreshToken', data.res.refreshToken);
  storedCookie.set('expires', cookieArray[1]);
  storedCookie.set('cookie', cookieRaw);
  console.log('cookie stored: ', cookieRaw)
}

const deleteCookies = () =>{
  storedCookie.clear();
  console.log('cookie deleted')
}

const checkIfTokenNearExpire = async () =>{
  let timestamp = new Date().getTime() +  (180 * 24 * 60 * 60 * 1000) ;
  let expires = new Date(storedCookie.get('expires')).getTime();
  console.log(timestamp,expires);
  return new Promise((resolve, reject) => {
    if(expires === '31626000'){
      console.log('cookie is using old logic, logging out.');
      resolve(false);
    }
    else if(timestamp > expires){
      console.log('cookie needs renewing');
      cookieRefesh(refresh);
      setInterval(() => {
        resolve(true);  
      }, 1000);
    }
    else if (timestamp < expires){
      console.log('cookie valid');
      resolve(true);
    }
  });
  
}

const cookieRefesh = (refreshToken) =>{
  let tokenArray = refreshToken.split('=');
  let refreshValue  = tokenArray;
  console.log('Renewing Cookie');
  const j = request.jar();
  j.setCookie(storedCookie.get('cookie').toString(), 'https://aussiebroadband.com.au');
  sendMessage('asynchronous-message', 'loading');
  return new Promise((resolve, reject) => {
      request.put({
        url: 'https://myaussie-auth.aussiebroadband.com.au/login',
        headers: {'User-Agent': 'aunt-v1'},form: {refreshToken:refreshValue[0]},followAllRedirects: true,jar:j
      }, (error, response, body) => {
        if(error){
          sendMessage('asynchronous-message', 'error', 'Token renew failed, login please.');
          deleteCookies();
        }
        if(body.refreshToken){
          let cookie = j.getCookies('https://aussiebroadband.com.au', 'Cookie');
          global.abb.setCookie(cookie, 'https://aussiebroadband.com.au');
          let cookieData = {
            cookie,
            res
          }
          storeCookieData(cookieData);        
        }
        if(body.error){
          sendMessage('asynchronous-message', 'error', 'Token renew failed, login please.');
          deleteCookies();
        }else{
          sendMessage('asynchronous-message', 'error', 'Token renew failed, login please.');
          deleteCookies();
        }
    })
  })
}


const formatBytes = (bytes, decimals = 2) =>{
  if (bytes === 0) return '0 Bytes';

  const k = 1000;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  let result = parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  console.log(i,result)

  return result;
}
// if(require('electron-squirrel-startup')){
//   if (process.argv.length === 1) {
//     return false;
//   }

//   const ChildProcess = require('child_process');
//   const path = require('path');

//   const appFolder = path.resolve(process.execPath, '..');
//   const rootAtomFolder = path.resolve(appFolder, '..');
//   const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
//   const exeName = path.basename(process.execPath);

//   const spawn = function(command, args) {
//     let spawnedProcess, error;

//     try {
//       spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
//     } catch (error) {}

//     return spawnedProcess;
//   };

//   const spawnUpdate = function(args) {
//     return spawn(updateDotExe, args);
//   };

//   const squirrelEvent = process.argv[1];
//   switch (squirrelEvent) {
//     case '--squirrel-install':
//     case '--squirrel-updated':
//       // Optionally do things such as:
//       // - Add your .exe to the PATH
//       // - Write to the registry for things like file associations and
//       //   explorer context menus

//       // Install desktop and start menu shortcuts
//       spawnUpdate(['--createShortcut', exeName]);

//       setTimeout(app.quit, 1000);
//       return true;

//     case '--squirrel-uninstall':
//       // Undo anything you did in the --squirrel-install and
//       // --squirrel-updated handlers

//       // Remove desktop and start menu shortcuts
//       spawnUpdate(['--removeShortcut', exeName]);

//       setTimeout(app.quit, 1000);
//       return true;

//     case '--squirrel-obsolete':
//       // This is called on the outgoing version of your app before
//       // we update to the new version - it's the opposite of
//       // --squirrel-updated

//       app.quit();
//       return true;
//   }
// }