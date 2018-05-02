const {
    ipcRenderer,
    remote
} = require('electron');
const moment = require('moment');
const main = remote.require("./main");

document.addEventListener("DOMContentLoaded", (event) => {
    ipcRenderer.send('window-show');
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
    // changes the text of the button
    var container = document.getElementById('ready');
    container.innerHTML = "new version ready!";
    container.style.display == "block";
})

function showData(usage) {
    let div = document.getElementById('data');

    let content = main.snapshotTemplate(usage);
    console.log(content);
    div.innerHTML = content;
    div.style.display = '';
    let form = document.getElementById('creds');
    form.style.display = 'none';
    let errorDiv = document.getElementById('error');
    errorDiv.style.display = 'none';
}

function sendForm(event) {
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