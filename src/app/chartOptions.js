const chartOptions = {
    backgroundColor:'rgb(10,10,10)',
    responsive: true,
    defaultFontColor: '#fff',
    title: {
        display: true,
        text: 'Historical Usage',
        fontColor:'#fff'
    },
    tooltips: {
        mode: 'index',
        intersect: true,
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
    scales: {
        xAxes: [{
            display: false,
            gridLines: {
                color: "rgba(255, 255, 255, 0.2)",
            },
        }],
        yAxes: [{
            display: true,
            scaleLabel: {
                display: true,
                labelString: 'Usage(GB)',
                fontColor:'#fff'
            },
            gridLines: {
                color: "rgba(255, 255, 255, 0.2)",
            }
        }]
    }
}