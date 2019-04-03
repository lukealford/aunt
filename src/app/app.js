'use strict'

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

    // Minimize task
    document.getElementById("min-btn").addEventListener("click", (e) => {
        getFocusedWindow().minimize();
    });

    // Close app
    document.getElementById("close-btn").addEventListener("click", (e) => {
        getFocusedWindow().close();
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

ipcRenderer.on('loading', (event, arg) => {
    let loader = document.getElementById('loader');
    loader.style.display = 'block';
    let form = document.getElementById('creds');
    form.style.display = 'none';
    let data = document.getElementById('data');
    data.style.display = 'none';
});

ipcRenderer.on('fullData', (event, arg) => {
    console.log('fullData: ', arg);
    let loader = document.getElementById('loader');
    loader.style.display = 'none';
    showData(arg);
});

ipcRenderer.on('appLoaded', (event, creds) => {
    console.log('appLoaded');
    let form = document.forms.creds
    form.elements.username.value = creds.un;
    form.elements.password.value = creds.pw;

    
});

ipcRenderer.on('loggedOut', (event) => {
    console.log('loggedOut');    
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
    console.log('updateReady');        
    var container = document.getElementById('ready');    
    container.innerHTML = "new version ready!";
    container.style.display == "block";
})

const showData = (usage) => {
    let div = document.getElementById('data');
    let intlData = {
        "locales": "en-AU"
    };

    let content = snapshotTemplate(usage, {
        data: {
            intl: intlData
        }
    });
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