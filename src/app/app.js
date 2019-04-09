'use strict'

document.addEventListener('dragover', function (event) {
    event.preventDefault();
    return false;
}, false);

document.addEventListener('drop', function (event) {
    event.preventDefault();
    return false;
}, false);

let usageData = [];
let genChart = null;

document.addEventListener("DOMContentLoaded", (event) => {
    ipcRenderer.send('window-show');

    // Minimize task
    document.getElementById("min-btn").addEventListener("click", (e) => {
        getFocusedWindow().minimize();
    });

    // Close app
    document.getElementById("close-btn").addEventListener("click", (e) => {
        getFocusedWindow().hide();
    });

    //refresh data
    document.getElementById("refresh-btn").addEventListener("click", (e) => {
        ipcRenderer.send('refresh-data');
    });

    document.getElementById("toggle-chart").addEventListener("click", (e) => {
        toggleBtnActive();

        ipcRenderer.send('get-historical');
        var data =  document.getElementById('data');
        data.style.display = 'none';
        var networkData =  document.getElementById('network-data');
        networkData.style.display = 'none';
        var controls = document.getElementById('chart-control');
        controls.style.display = 'block';
    });
    document.getElementById("toggle-list").addEventListener("click", (e) => {
        toggleBtnActive();

        ipcRenderer.send('refresh-data');
        hideChart()
        var controls = document.getElementById('chart-control');
        controls.style.display = 'none';
        var networkData =  document.getElementById('network-data');
        networkData.style.display = 'none';
    });

    document.getElementById("toggle-network").addEventListener("click", (e) => {
        toggleBtnActive();

        ipcRenderer.send('get-network');
        hideChart();
        var controls = document.getElementById('chart-control');
        controls.style.display = 'none';
        var data =  document.getElementById('data');
        data.style.display = 'none';
    });
    // var chart =  document.getElementById('chart');
    // if(isVisible(chart)){
        
    // }
});


ipcRenderer.on('showHeaderUI', (event, data) => {
    console.log('showHeaderUI', data);
});

ipcRenderer.on('error', (event, arg) => {
    console.log('error: ', arg);
    let form = document.getElementById('creds');
    form.style.display = 'block';
    form.elements.username.focus();
    hideLoader()
    let menu = document.getElementById('menu');
    menu.style.display = 'none';

    let div = document.getElementById('notification');
    div.innerHTML = '<p> '+arg+' </p>';
});

ipcRenderer.on('success', (event, arg) => {
    console.log('success: ', arg);
    let div = document.getElementById('error');
    div.style.color = "#00a650";
    div.style.textAlign = 'center';
    div.innerHTML = arg;
});

ipcRenderer.on('loading', (event, arg) => {
    showLoader()
    let form = document.getElementById('creds');
    form.style.display = 'none';
    let data = document.getElementById('data');
    data.style.display = 'none';
});

ipcRenderer.on('fullData', (event, arg) => {
    let usageData = [];
    console.log('fullData: ', arg);
    usageData.push(arg);
    hideLoader()
    showData(arg);

    document.getElementById("poiLink").addEventListener("click", (e) => {
        console.log(usageData);
        ipcRenderer.send('open-poi',usageData[0].poiURL);
    });
});

ipcRenderer.on('showHistory', (event, data) => {
    renderChart(data);
    var chart =  document.getElementById('chart');
    chart.style.display = 'block';

});

ipcRenderer.on('showNetwork', (event, arg) => {
    console.log('showNetwork: ', arg);
    showNetworkData(arg);
    var networkData =  document.getElementById('network-data');
    networkData.style.display = 'block';
});

ipcRenderer.on('appLoaded', (event, creds) => {
    console.log('appLoaded');
    let form = document.forms.creds
    form.elements.username.value = creds.un;
    form.elements.password.value = creds.pw;

    
});

ipcRenderer.on('app-update', (event, data) => {
    console.log('update found: ',data);
    showAppUpdate(data);    
    document.getElementById("update-btn").addEventListener("click", (e) => {
        ipcRenderer.send('open-update');
    });

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


ipcRenderer.on('UI-notification', function (event, text) {
    showNotification(text);
})

const showNotification = (msg, timeout) =>{

    let div = document.getElementById('notification');
    div.innerHTML = "<p>"+msg+"</p>";
    div.style.display = 'block';
    setTimeout(() => {
        div.style.display = 'none';
    }, 3500);
}



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
    let menu = document.getElementById('menu');
    menu.style.display = 'block';
    let form = document.getElementById('creds');
    form.style.display = 'none';
    let errorDiv = document.getElementById('error');
    errorDiv.style.display = 'none';
}

const showNetworkData = (usage) => {
    let div = document.getElementById('network-data');
    let intlData = {
        "locales": "en-AU"
    };

    let content = networkTemplate(usage, {
        data: {
            intl: intlData
        }
    });
    hideLoader()
    div.innerHTML = content;
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

const renderChart = (data) => {
    if(genChart !=null) {
        genChart.destroy();
    }
    let ChartData = {}
    let labels =[];
    let download = [];
    let upload = [];
    for (var key in data) {
        for (var key2 in data[key]) {

            let down = data[key][key2].download/1024;
            let up = data[key][key2].upload/1024;

            let date = data[key][key2].date;

            //console.log(key, key2, data[key][key2]);
            labels.push(date);
            download.push(down.toFixed(2));
            upload.push(up.toFixed(2));
        }
    }
    ChartData = {
        labels: labels,
        datasets: [
            {
                label: "Upload",
                data: upload,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.4)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                ],
                fontColor:'#fff'
            },
            {
                label: "Download",
                data: download,
                backgroundColor: [
                    'rgba(0, 186, 110, 0.4)',
                ],
                borderColor: [
                    'rgba(0, 186, 110, 1)',
                ],
                fontColor:'#fff'
            }
        ]
    }
    var ctx = document.getElementById('chart');
    Chart.defaults.global.defaultFontColor = '#fff';
    genChart = new Chart(ctx, {
        type: 'line',
        data: ChartData,
        options: chartOptions
    });

    genChart.update();
    hideLoader()
    showChart();
    var next = document.getElementById('chart-forward');
    var prev = document.getElementById('chart-back');
    prev.setAttribute('url',data.pagination.prev);
    if(data.pagination.next){
        next.style.display = "block";
        next.setAttribute('url',data.pagination.next);
    }else{
        data.disabled = true;
    }

    next.addEventListener("click", (e) => {
        console.log('get next month');
        let url = data.pagination.next;
        console.log(url);       
        ipcRenderer.send('get-historical',url);
    });
    prev.addEventListener("click", (e) => {
        console.log('get previous month');
        let url = data.pagination.prev;
        console.log(url);
        ipcRenderer.send('get-historical',url);
    });
    console.log('chart data: ', data);
}

const toggleBtnActive = () =>{
    var header = document.getElementById("menu");
    var btns = header.getElementsByClassName("btn");
    for (var i = 0; i < btns.length; i++) {
        btns[i].addEventListener("click", function() {
            var current = document.getElementsByClassName("active");
            current[0].className = current[0].className.replace(" active", "");
            this.className += " active";
        });
    }
}

Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
}
NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
    for(var i = this.length - 1; i >= 0; i--) {
        if(this[i] && this[i].parentElement) {
            this[i].parentElement.removeChild(this[i]);
        }
    }
}

function showLoader(){
    let loader = document.getElementById('loader');
    loader.style.display = 'block';
}

function hideLoader(){
    let loader = document.getElementById('loader');
    loader.style.display = 'none';
}

async function showChart(){
    var div = document.getElementById('history');
    div.style.display = 'block';
    return new Promise((resolve, reject) => {
    resolve(true);  
    });
    
}

function hideChart(){
    var chart =  document.getElementById('chart');
    chart.style.display = 'none';
}




function showAppUpdate(data){
    console.log(data);

    const current = data.current;
    const repo = data.update;
    showCurrentVersion(current)
    let update = versionCompare(repo,current,{
        lexicographical:true
    })
    console.log('versionCompare',update);
    if(update === 1){
        console.log('update available.');
        showUpdateBtn(repo);
    }   
    
}
function showCurrentVersion(current){
    var version =  document.getElementById('version');
    version.style.display = 'block';
    version.innerHTML=current;
}

function showUpdateBtn(version){
    var update =  document.getElementById('update-btn');
    update.style.display = 'block';
    let msg = version+', now avaliable!';
    update.innerHTML=msg;
}


//credit https://github.com/Rombecchi/version-compare/blob/master/version-compare.js
function versionCompare(v1, v2, options) {
    var lexicographical = (options && options.lexicographical) || false,
        zeroExtend = (options && options.zeroExtend) || true,
        v1parts = (v1 || "0").split('.'),
        v2parts = (v2 || "0").split('.');
  
    function isValidPart(x) {
      return (lexicographical ? /^\d+[A-Za-zαß]*$/ : /^\d+[A-Za-zαß]?$/).test(x);
    }
  
    if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
      return NaN;
    }
  
    if (zeroExtend) {
      while (v1parts.length < v2parts.length) v1parts.push("0");
      while (v2parts.length < v1parts.length) v2parts.push("0");
    }
  
    if (!lexicographical) {
      v1parts = v1parts.map(function(x){
       var match = (/[A-Za-zαß]/).exec(x);  
       return Number(match ? x.replace(match[0], "." + x.charCodeAt(match.index)):x);
      });
      v2parts = v2parts.map(function(x){
       var match = (/[A-Za-zαß]/).exec(x);  
       return Number(match ? x.replace(match[0], "." + x.charCodeAt(match.index)):x);
      });
    }
  
    for (var i = 0; i < v1parts.length; ++i) {
      if (v2parts.length == i) {
        return 1;
      }
  
      if (v1parts[i] == v2parts[i]) {
        continue;
      }
      else if (v1parts[i] > v2parts[i]) {
        return 1;
      }
      else {
        return -1;
      }
    }
  
    if (v1parts.length != v2parts.length) {
      return -1;
    }
  
    return 0;
  }