'use strict'
const {
    ipcRenderer,
    remote
} = require('electron');
const main = remote.require("./main");

document.addEventListener('dragover', function (event) {
    event.preventDefault();
    return false;
}, false);

document.addEventListener('drop', function (event) {
    event.preventDefault();
    return false;
}, false);

document.addEventListener("DOMContentLoaded", (event) => {
    ipcRenderer.send('window-show');

    // let ui = document.getElementById('title-bar');
    // ui.style.display = 'block';
    // Minimize task
    document.getElementById("min-btn").addEventListener("click", (e) => {
        remote.BrowserWindow.getFocusedWindow().minimize();
    });

    // Close app
    document.getElementById("close-btn").addEventListener("click", (e) => {
        remote.BrowserWindow.getFocusedWindow().close();
    });

    //refresh data
    document.getElementById("refresh-btn").addEventListener("click", (e) => {
        ipcRenderer.send('refresh-data');
    });
});

ipcRenderer.on('showHeaderUI', (event, data) => {
    console.log('showHeaderUI', data);
});

ipcRenderer.on('error', (event, arg) => {
    console.log('error: ', arg);
    let form = document.getElementById('creds');
    form.elements.username.focus();

    let div = document.getElementById('error');
    div.style.color = "red";
    div.innerHTML = arg;
});

ipcRenderer.on('success', (event, arg) => {
    console.log('success: ', arg);
    let div = document.getElementById('error');
    div.style.color = "#00a650";
    div.style.textAlign = 'center';
    div.innerHTML = arg;
});

ipcRenderer.on('fullData', (event, arg) => {
    console.log('fullData: ', arg);
    showData(arg);


});

ipcRenderer.on('appLoaded', (event, creds) => {
    console.log('appLoaded: ', creds);
    let form = document.forms.creds
    form.elements.username.value = creds.un;
    form.elements.password.value = creds.pw;

    let versionSpan = document.getElementById('v');
    let version = main.getAppVersion();
    versionSpan.innerHTML = version;

});

ipcRenderer.on('loggedOut', (event) => {
    let data = document.getElementById('data');
    data.style.display = 'none';

    let error = document.getElementById('error');
    error.style.display = '';
    error.innerHTML = '';

    let form = document.getElementById('creds');
    form.style.display = '';
    form.elements.username.value = null;
    form.elements.username.focus();
    form.elements.password.value = null;
});

// wait for an updateReady message
ipcRenderer.on('updateReady', function (event, text) {
    var container = document.getElementById('ready');
    container.innerHTML = "new version ready!";
    container.style.display == "block";
})

const showData = (usage) => {
    let div = document.getElementById('data');
    let intlData = {
        "locales": "en-AU"
    };

    let content = main.snapshotTemplate(usage, {
        data: {
            intl: intlData
        }
    });
    //console.log(content);
    div.innerHTML = content;
    div.style.display = '';
    let form = document.getElementById('creds');
    form.style.display = 'none';
    let errorDiv = document.getElementById('error');
    errorDiv.style.display = 'none';
}

const sendForm = (event) => {
    event.preventDefault() // stop the form from submitting
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    let creds = {
        un: username,
        pw: password
    };

    if (!!username && !!password) {
        ipcRenderer.send('form-submission', creds)
    } else {
        return false
    }
}