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
    document.getElementById('error').innerHtml = "";
    let div = document.getElementById('error');
    div.style.color = "red";
    div.innerHTML = arg;
});

ipcRenderer.on('success', (event, arg) => {
    console.log('success: ', arg);
    document.getElementById('error').innerHtml = "";
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
    document.getElementById("username").innerHTML = creds.un;
    document.getElementById("password").innerHTML = creds.pw;
    // document.getElementById("submit").click();
});

ipcRenderer.on('loggedOut', (event) => {
    // reset other elements (surely a better way)
    let data = document.getElementById('data');
    data.style.display = 'none';

    let error = document.getElementById('error');
    error.style.display = '';

    let form = document.getElementById('creds');
    form.style.display = '';
});

// wait for an updateReady message
ipcRenderer.on('updateReady', function (event, text) {
    // changes the text of the button
    var container = document.getElementById('ready');
    container.innerHTML = "new version ready!";
    container.style.display == "block";
})

function showData(arg) {
    document.getElementById('data').innerHtml = "";
    let div = document.getElementById('data');

    planInBytes = arg.usage.allowance1_mb[0] * 1048576;
    console.log('plan in bytes', planInBytes);
    console.log('data in bytes', arg.usage.left1[0]);

    avgUse = planInBytes / getDaysTillRoll(arg.usage.rollover[0]);
    console.log(avgUse);
    if (arg.usage.allowance1_mb > 1000000 && arg.usage.allowance1_mb < 99999999) {
        let plan = arg.usage.allowance1_mb / 1000000
        content = "<p><span>Download:</span><span class='string'>" + main.formatFileSize(arg.usage.down1[0]) + "</span></p><p><span>Upload:</span><span class='string'>" + main.formatFileSize(arg.usage.up1[0]) + "</span></p><p>" + "<span>Total Left:</span><span class='string'>" + main.formatFileSize(arg.usage.left1[0]) + "<span>/</span>" + plan + " TB" + "</span></p><p>" + "<span>Updated:</span><span class='string'>" + moment(arg.usage.lastupdated[0]).fromNow() + "</span></p><p>" + "<span>Days in month remaing:</span><span class='string'>" + getDaysTillRoll(arg.usage.rollover[0]) + " day/s<span></p><p><span>Avg daily limit:</span><span class='string'>" + main.formatFileSize(avgUse) + "</span></p>";
    } else if (arg.usage.allowance1_mb = 100000000) {

        content = "<p><span>Download:</span><span class='string'>" + main.formatFileSize(arg.usage.down1[0]) + "</span></p><p><span>Upload:</span><span class='string'>" + main.formatFileSize(arg.usage.up1[0]) + "</span></p><p>" + "<span>Total Left:</span><span class='string'>" + main.formatFileSize(arg.usage.left1[0]) + "<span>/</span>" + "Unlimited" + "</span></p><p>" + "<span>Updated:</span><span class='string'>" + moment(arg.usage.lastupdated[0]).fromNow() + "</span></p><p>" + "<span>Days in month remaing:</span><span class='string'>" + getDaysTillRoll(arg.usage.rollover[0]) + " day/s</span></p><p><span>Avg daily limit:</span><span class='string'>" + main.formatFileSize(avgUse) + "</span></p>";
    } else {
        let plan = arg.usage.allowance1_mb / 100000
        content = "<p><span>Download:</span><span class='string'>" + main.formatFileSize(arg.usage.down1[0]) + "</span></p><p><span>Upload:</span><span class='string'>" + main.formatFileSize(arg.usage.up1[0]) + "</span></p><p>" + "<span>Total Left:</span><span class='string'>" + main.formatFileSize(arg.usage.left1[0]) + "<span>/</span>" + plan + " GB" + "</span></p><p>" + "<span>Updated:</span><span class='string'>" + moment(arg.usage.lastupdated[0]).fromNow() + "</span></p><p>" + "<span>Days in month remaing:</span><span class='string'>" + getDaysTillRoll(arg.usage.rollover[0]) + " day/s</span></p><p><span>Avg daily limit:</span><span class='string'>" + main.formatFileSize(avgUse) + "</span></p>";
    }

    console.log(content);
    div.innerHTML = content;
    let form = document.getElementById('creds');
    form.style.display = 'none';
    let errorDiv = document.getElementById('error');
    errorDiv.style.display = 'none';
}

function getDaysTillRoll(day) {
    const date = new Date();
    const today = moment(date);

    if (day < 10) {
        let rd = 0 + '' + day;
        rd = moment(new Date(date.getFullYear(), date.getMonth() + 1, rd));
        let d = rd.diff(today, 'days');
        return d;
    } else {
        let rd = day;
        rd = moment(new Date(date.getFullYear(), date.getMonth() + 1, rd));
        let d = rd.diff(today, 'days');
        return d;
    }
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