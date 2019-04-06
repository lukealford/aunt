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
        var chart =  document.getElementById('chart');
        chart.style.display = 'none';
        var controls = document.getElementById('chart-control');
        controls.style.display = 'none';
        var networkData =  document.getElementById('network-data');
        networkData.style.display = 'none';
    });

    document.getElementById("toggle-network").addEventListener("click", (e) => {
        toggleBtnActive();

        ipcRenderer.send('get-network');
        var chart =  document.getElementById('chart');
        chart.style.display = 'none';
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
    let loader = document.getElementById('loader');
    loader.style.display = 'none';
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
    let loader = document.getElementById('loader');
    loader.style.display = 'block';
    let form = document.getElementById('creds');
    form.style.display = 'none';
    let data = document.getElementById('data');
    data.style.display = 'none';
});

ipcRenderer.on('fullData', (event, arg) => {
    let usageData = [];
    console.log('fullData: ', arg);
    usageData.push(arg);
    let loader = document.getElementById('loader');
    loader.style.display = 'none';
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

const showNotification = (msg) =>{
    let div = document.getElementById('notification');
    div.innerHTML = "<p>"+msg+"</p>";
    div.style.display = 'block';
    setTimeout(() => {
        div.style.display = 'none';
    }, 1000);
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
    var loader =  document.getElementById('loader');
    loader.style.display = 'none';
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
        options: {
            responsive: true,
            defaultFontColor: '#fff',
            title: {
                display: true,
                text: 'Historical Usage',
                fontColor:'#fff'
            },
            tooltips: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function(tooltipItem, data) {
                        var label = data.datasets[tooltipItem.datasetIndex].label || '';
    
                        if (label) {
                            label += ': ';
                        }
                        label += tooltipItem.yLabel.toFixed(2)+' GB';
                        return label;
                    }
                }
            },
            hover: {
                mode: 'nearest',
                intersect: true
            },
            scales: {
                xAxes: [{
                    display: false,
                }],
                yAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Usage(GB)',
                        fontColor:'#fff'
                    }
                }]
            }
        }
    });

    genChart.update();
    var loader =  document.getElementById('loader');
    loader.style.display = 'none';
    var div = document.getElementById('history');
    div.style.display = 'block';
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
        //killChart();
        

        ipcRenderer.send('get-historical',url);
    });
    prev.addEventListener("click", (e) => {
        //killChart();
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

const killChart = () => {

    document.getElementById("chartjs-size-monitor").remove();
    document.getElementById("chart").remove();
    document.getElementById("history").innerHTML = '<canvas id="chart" width="280" height="200"></canvas>';
    // let canvas = document.getElementById("chart");
    // let ctx =  document.getElementById("chart").getContext('2d');
    // ctx.canvas.width = document.getElementById("history").style.width; // resize to parent width
    // ctx.canvas.height = document.getElementById("history").style.height; // resize to parent height
    // var x = canvas.style.width/2;
    // var y = canvas.style.height/2;

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