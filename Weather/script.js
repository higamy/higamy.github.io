let min_temp_error, avg_temp_error, max_temp_error, forecast_days_before, start_date, end_date, n_months
let stations
let githubLocation = 'https://higamy.github.io/Weather'

axios.get(`${githubLocation}/vars.json`)
    .then(data => {
        data = data.data

        min_temp_error = data.min_temp_error;
        avg_temp_error = data.avg_temp_error;
        max_temp_error = data.max_temp_error;
        forecast_days_before = data.forecast_days_before;
        start_date = data.start_date;
        end_date = data.end_date;
        n_months = data.n_months;

        populateTemperatureErrorPlot();

        console.log(data)
    })

axios.get(`${githubLocation}/stations.json`)
    .then(data => {
        stations = data.data.stations;
        console.log(stations)
        setNumStations();
        populateStationsPlot();
    })

function setNumStations() {
    // Updates the introductory paragraph with the number of stations analysed

    let introductionText = document.querySelector('#introductionText')
    console.log(introductionText)

    let textData = introductionText.innerHTML;
    textData = textData.replace('var_n_stations', stations.length)
    textData = textData.replace('var_n_months', n_months)
    textData = textData.replace('var_start_date', start_date)
    textData = textData.replace('var_end_date', end_date)
    introductionText.innerHTML = textData
}


function populateTemperatureErrorPlot() {

    let variation_data = []
    let average_data = []
    for (let i = 0; i < forecast_days_before.length; i++) {
        variation_data[i] = [-forecast_days_before[i], min_temp_error[i], max_temp_error[i]]
        average_data[i] = [-forecast_days_before[i], avg_temp_error[i]]
    }

    Highcharts.chart('temperature_accuracy', {

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
    Highcharts.mapChart('stations_map', {
        chart: {
            map: 'custom/british-isles'
        },
        title: {
            text: 'Weather Station Locations'
        },
        mapNavigation: {
            enabled: true
        },
        tooltip: {
            headerFormat: '',
            pointFormat: '<b>{point.name}</b> {point.unitaryAuthArea}<br>Elevation: {point.elevation}<br>Lat: {point.lat:.2f}, Lon: {point.lon:.2f}'
        },
        series: [{
            name: 'Basemap',
            borderColor: '#A0A0A0',
            nullColor: 'rgba(177, 244, 177, 0.5)',
            showInLegend: false
        }, {
            type: 'mappoint',
            enableMouseTracking: true,
            name: 'Weather Stations',
            data: stations
        }]
    });
}