// http://www.twstats.co.uk/uk60/index.php?page=tribe&mode=members&id=2
/*Ideas

Upload all tribes plots to a site daily.
Browser feature
Not just points trend but other stats
*/


// Variable declaration
let data_all = [];
let players_all = [];
let all_promises = [];

if ($('#members').length == 0) {
    alert("This script must be run on the members page on twstats!");
    throw 'Members table not found';
}

let tribe_name = $($('h3').find('a')).text();


$('#members').find('tr.r1, tr.r2').find('td:nth-of-type(2)').find('a').each((i, el) => {
    let player_name = $(el).text().trim();
    let player_id = $(el).attr('href').split('&id=')[1];


    const myPromise = new Promise((resolve, reject) => {

        let data_single = [];

        $.get(`${window.location.pathname}?page=player&id=${player_id}&tab=history`, function (data) {

            $(data).find('tr.r1, tr.r2').each((j, el2) => {
                let date = $(el2).find('td:nth-of-type(1)').text()


                // Depending on if it is the first ever record, there is a + sign before the points
                // The below handles both cases
                let point = $(el2).find('td:nth-of-type(5)')
                if (point.children().length == 0) {
                    point = point.text() // No plus sign
                }
                else {
                    point = $($(point.children()[0]).children()[1]).text() // Plus sign
                }

                // Convert points to numeric values
                point = parseInt(point.replaceAll(",", ""));

                // Convert data to UTC
                let date_split = date.split('-');
                date = Date.UTC(date_split[0], date_split[1] - 1, date_split[2]);

                // Insert at the end so that the array is ascending
                data_single.unshift([date, point]);
            })
            resolve({
                name: player_name,
                data: data_single
            });
        })

    });

    all_promises.push(myPromise);
}
)

// Add styles
var style = document.createElement('style');
style.innerHTML = `
figure{
    position: absolute; 
    top: 50px;
    left: 0; 
    right: 0; 
    margin-left: auto; 
    margin-right: auto; 
    width: 100px; /* Need a specific value to work */
}

.highcharts-figure,
.highcharts-data-table table {
    min-width: 800px;
    max-width: 1000px;
    margin: 1em auto;
}

.highcharts-data-table table {
    font-family: Verdana, sans-serif;
    border-collapse: collapse;
    border: 1px solid #ebebeb;
    margin: 10px auto;
    text-align: center;
    width: 100%;
    max-width: 500px;
}

.highcharts-data-table caption {
    padding: 1em 0;
    font-size: 1.2em;
    color: #555;
}

.highcharts-data-table th {
    font-weight: 600;
    padding: 0.5em;
}

.highcharts-data-table td,
.highcharts-data-table th,
.highcharts-data-table caption {
    padding: 0.5em;
}

.highcharts-data-table thead tr,
.highcharts-data-table tr:nth-child(even) {
    background: #f8f8f8;
}

.highcharts-data-table tr:hover {
    background: #f1f7ff;
}

`;
document.head.appendChild(style);



// Add Highcharts scripts
let scriptPromises = [];

script_list = ["https://code.highcharts.com/highcharts.js",
    //  "https://code.highcharts.com/modules/series-label.js",
    // "https://code.highcharts.com/modules/exporting.js",
    //  "https://code.highcharts.com/modules/export-data.js",
    //   "https://code.highcharts.com/modules/accessibility.js"
]
for (let script of script_list) {
    const scriptPromise = new Promise((resolve, reject) => {
        let s = document.createElement('script');
        s.setAttribute('src', script);
        document.head.appendChild(s);

        s.addEventListener('load', function () {
            resolve();
        });
    })

    scriptPromises.push(scriptPromise);
}

let mainChart;

Promise.all(scriptPromises).then((vals) => {
    Promise.all(all_promises).then((values) => {
        let fig = document.createElement('figure');
        fig.classList.add("highcharts-figure");

        let container = document.createElement('div');
        container.setAttribute('id', 'container');
        fig.appendChild(container);

        document.body.append(fig);

        mainChart = Highcharts.chart('container', {
            chart: {
                type: 'line',
                zoomType: 'xy'
            },
            title: {
                text: `Points Trend: ${tribe_name}`
            },

            subtitle: {
                text: 'Created by higamy'
            },

            yAxis: {
                title: {
                    text: 'Points'
                }
            },

            xAxis: {
                type: 'datetime',
                dateTimeLabelFormats: { // don't display the dummy year
                    month: '%e. %b',
                    year: '%b'
                },
                title: {
                    text: 'Date'
                }
            },

            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'middle'
            },

            plotOptions: {
                series: {
                    marker: {
                        enabled: true
                    }
                }
            },
            series: values,
            responsive: {
                rules: [{
                    condition: {
                        maxWidth: 500
                    },
                    chartOptions: {
                        plotOptions: {
                            series: {
                                marker: {
                                    radius: 2.5
                                }
                            }
                        }
                    }
                }]
            }

        });

        $('#container').highcharts().redraw();

    });
})
