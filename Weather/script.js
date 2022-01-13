let min_temp_error, avg_temp_error, max_temp_error
let stations
let githubLocation = 'https://higamy.github.io/Weather'

axios.get(`${githubLocation}/vars.json`)
    .then(data => {
        data = data.data

        min_temp_error = data.min_temp_error;
        avg_temp_error = data.avg_temp_error;
        max_temp_error = data.max_temp_error;

        populateTemperatureErrorPlot();

        console.log(data)
    })

axios.get(`${githubLocation}/stations.json`)
    .then(data => {
        stations = data.data.stations;
        console.log(stations)
        populateStationsPlot();
    })



let forecast_days_before = [4.917, 4.875, 4.833, 4.792, 4.75, 4.708, 4.667, 4.625, 4.583, 4.542, 4.5, 4.458, 4.417, 4.375, 4.333, 4.292, 4.25, 4.208, 4.167, 4.125, 4.083, 4.042, 4.0, 3.958, 3.917, 3.875, 3.833, 3.792, 3.75, 3.708, 3.667, 3.625, 3.583, 3.542, 3.5, 3.458, 3.417, 3.375, 3.333, 3.292, 3.25, 3.208, 3.167, 3.125, 3.083, 3.042, 3.0, 2.958, 2.917, 2.875, 2.833, 2.792, 2.75, 2.708, 2.667, 2.625, 2.583, 2.542, 2.5, 2.458, 2.417, 2.375, 2.333, 2.292, 2.25, 2.208, 2.167, 2.125, 2.083, 2.042, 2.0, 1.958, 1.917, 1.875, 1.833, 1.792, 1.75, 1.708, 1.667, 1.625, 1.583, 1.542, 1.5, 1.458, 1.417, 1.375, 1.333, 1.292, 1.25, 1.208, 1.167, 1.125, 1.083, 1.042, 1.0, 0.958, 0.917, 0.875, 0.833, 0.792, 0.75, 0.708, 0.667, 0.625, 0.583, 0.542, 0.5, 0.458, 0.417, 0.375, 0.333, 0.292, 0.25, 0.208, 0.167, 0.125, 0.083, 0.042]

function populateTemperatureErrorPlot() {

    let variation_data = []
    let average_data = []
    for (let i = 0; i < forecast_days_before.length; i++) {
        variation_data[i] = [-forecast_days_before[i], min_temp_error[i], max_temp_error[i]]
        average_data[i] = [-forecast_days_before[i], avg_temp_error[i]]
    }



    var colors = Highcharts.getOptions().colors;
    Highcharts.chart('container', {

        chart: {
            type: 'arearange',
            zoomType: 'x',
            scrollablePlotArea: {
                minWidth: 600,
                scrollPositionX: 1
            }
        },

        title: {
            text: 'Temperature variation by day'
        },

        xAxis: {
            title: {
                text: 'Forecast Days Ahead'
            }
        },

        yAxis: {
            title: {
                text: "Error °C"
            }
        },

        tooltip: {
            crosshairs: true,
            shared: true,
            valueSuffix: '°C',
            xDateFormat: '%A, %b %e'
        },

        legend: {
            enabled: true
        },

        series: [{
            name: "Error bands",
            data: variation_data,
            color: 'rgb(255,0,0)',
            opacity: 0.3
        },
        {
            name: "Average Error",
            data: average_data,
            type: "spline",
            color: 'rgb(0,0,255)',
        }]

    });
}

function populateStationsPlot() {
    Highcharts.mapChart('container2', {
        chart: {
            map: 'custom/europe'
        },
        title: {
            text: 'Weather Station Locations'
        },
        mapNavigation: {
            enabled: true
        },
        tooltip: {
            headerFormat: '',
            pointFormat: '<b>{point.name}</b><br>Lat: {point.lat:.2f}, Lon: {point.lon:.2f}'
        },
        colorAxis: {
            min: 0,
            max: 20
        },
        plotOptions: {
            mappoint: {
                cluster: {
                    enabled: true,
                    allowOverlap: false,
                    animation: {
                        duration: 450
                    },
                    layoutAlgorithm: {
                        type: 'grid',
                        gridSize: 70
                    },
                    zones: [{
                        from: 1,
                        to: 4,
                        marker: {
                            radius: 13
                        }
                    }, {
                        from: 5,
                        to: 9,
                        marker: {
                            radius: 15
                        }
                    }, {
                        from: 10,
                        to: 15,
                        marker: {
                            radius: 17
                        }
                    }, {
                        from: 16,
                        to: 20,
                        marker: {
                            radius: 19
                        }
                    }, {
                        from: 21,
                        to: 100,
                        marker: {
                            radius: 21
                        }
                    }]
                }
            }
        },
        series: [{
            name: 'Basemap',
            borderColor: '#A0A0A0',
            nullColor: 'rgba(177, 244, 177, 0.5)',
            showInLegend: false
        }, {
            type: 'mappoint',
            enableMouseTracking: true,
            colorKey: 'clusterPointsAmount',
            name: 'Cities',
            data: stations
        }]
    });
}