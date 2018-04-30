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
    form.elements.password.value = null;
});

// wait for an updateReady message
ipcRenderer.on('updateReady', function (event, text) {
    // changes the text of the button
    var container = document.getElementById('ready');
    container.innerHTML = "new version ready!";
    container.style.display == "block";
})

function showData(arg) {
    let div = document.getElementById('data');
    
    planInBytes = arg.usage.allowance1_mb[0] * 1048576;
    console.log('plan in bytes', planInBytes);
    console.log('data in bytes', arg.usage.left1[0]);
    
    avgUse = arg.usage.left1[0] / getDaysTillRoll(arg.usage.rollover[0]);
    console.log('avg daily',avgUse);
    if (arg.usage.allowance1_mb > 1000000 && arg.usage.allowance1_mb < 99999999) {
        let plan = arg.usage.allowance1_mb / 1000000
        content = "<p><span>Download:</span><span class='string'>" + main.formatFileSize(arg.usage.down1[0]) + "</span></p><p><span>Upload:</span><span class='string'>" + main.formatFileSize(arg.usage.up1[0]) + "</span></p><p>" + "<span>Total Left:</span><span class='string'>" + main.formatFileSize(arg.usage.left1[0]) + "<span>/</span>" + plan + " TB" + "</span></p><p>" + "<span>Updated:</span><span class='string'>" + moment(arg.usage.lastupdated[0]).fromNow() + "</span></p><p>" + "<span>Days in month remaining:</span><span class='string'>" + getDaysTillRoll(arg.usage.rollover[0]) + " day/s<span></p><p><span>Avg daily limit till ro:</span><span class='string'>" + main.formatFileSize(avgUse) + "</span></p>";
    } else if (arg.usage.allowance1_mb = 100000000) {
        
        content = "<p><span>Download:</span><span class='string'>" + main.formatFileSize(arg.usage.down1[0]) + "</span></p><p><span>Upload:</span><span class='string'>" + main.formatFileSize(arg.usage.up1[0]) + "</span></p><p>" + "<span>Total Left:</span><span class='string'>" + main.formatFileSize(arg.usage.left1[0]) + "<span>/</span>" + "Unlimited" + "</span></p><p>" + "<span>Updated:</span><span class='string'>" + moment(arg.usage.lastupdated[0]).fromNow() + "</span></p><p>" + "<span>Days in month remaining:</span><span class='string'>" + getDaysTillRoll(arg.usage.rollover[0]) + " day/s</span></p><p><span>Avg daily limit till ro:</span><span class='string'>" + main.formatFileSize(avgUse) + "</span></p>";
    } else {
        let plan = arg.usage.allowance1_mb / 100000
        content = "<p><span>Download:</span><span class='string'>" + main.formatFileSize(arg.usage.down1[0]) + "</span></p><p><span>Upload:</span><span class='string'>" + main.formatFileSize(arg.usage.up1[0]) + "</span></p><p>" + "<span>Total Left:</span><span class='string'>" + main.formatFileSize(arg.usage.left1[0]) + "<span>/</span>" + plan + " GB" + "</span></p><p>" + "<span>Updated:</span><span class='string'>" + moment(arg.usage.lastupdated[0]).fromNow() + "</span></p><p>" + "<span>Days in month remaining:</span><span class='string'>" + getDaysTillRoll(arg.usage.rollover[0]) + " day/s</span></p><p><span>Avg daily limit till ro:</span><span class='string'>" + main.formatFileSize(avgUse) + "</span></p>";
    }
    
    console.log(content);
    div.innerHTML = content;
    div.style.display = '';
    let form = document.getElementById('creds');
    form.style.display = 'none';
    let errorDiv = document.getElementById('error');
    errorDiv.style.display = 'none';
}

function getDaysTillRoll(day) {
    const date = new Date();
    const today = moment(date).local();
    const  month = today.month();
    if (day < 10) {
        let rd = 0 + '' + day;

        rd = moment(new Date(date.getFullYear(),month, rd)).local();
        let d = rd.diff(today, 'days');
        console.log('roll date',rd);
        return d;
    } 
    if (day > 10) {
        let rd = day;
        rd = moment(new Date(date.getFullYear(), month, rd)).local();
        let d = rd.diff(today, 'days');
        console.log('days to roll',rd);
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