// Redirect to pp log page if not on it
const urlParams = new URLSearchParams(window.location.search);
const screenParam = urlParams.get('screen');
const modeParam = urlParams.get('mode');

if ((modeParam != 'log') | (screenParam != 'premium')) {
    UI.SuccessMessage("Redirecting to premium points overview...", 1000)

    urlParams.set('mode', 'log');
    urlParams.set('screen', 'premium');

    // Perform the redirect
    window.location.replace(`game.php?/${urlParams}`);
}


world_data = {}
n_pages_to_load = 10;


function parseCustomDate(dateStr) {
    const months = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };

    // Match both formats (with and without year)
    const match = dateStr.match(/([A-Za-z]+) (\d+),\s*(\d{4})?\s*(\d{1,2}):(\d{2})/);
    if (!match) return null;

    const [, monthStr, day, year, hours, minutes] = match;
    const now = new Date();

    return new Date(
        year ? parseInt(year) : now.getFullYear(),  // Use provided year or current year
        months[monthStr],
        parseInt(day),
        parseInt(hours),
        parseInt(minutes)
    );
}

function mergeDuplicates(dates, values) {
    const result = {};

    // Group and sum values by date
    dates.forEach((date, index) => {
        if (result[date]) {
            result[date] += values[index];
        } else {
            result[date] = values[index];
        }
    });

    // Convert back to arrays
    let mergedDates = Object.keys(result);
    const mergedValues = Object.values(result);

    // Convert dates to date objects
    mergedDates = mergedDates.map(dateStr => new Date(dateStr));

    return { mergedDates, mergedValues };
}


function createPlot() {
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

    function loadHighchartsScript(callback) {
        const script = document.createElement('script');
        script.src = 'https://code.highcharts.com/highcharts.js';
        script.onload = callback;
        document.head.appendChild(script);
    }

    loadHighchartsScript(() => {
        Highcharts.chart('container', {
            chart: {
                type: 'line',
                zoomType: 'xy'
            },
            title: {
                text: `Points Trend:`
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
            series: [],
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

}

// Example usage:
console.log(parseCustomDate("Feb 12, 21:35"));       // Assumes current year
console.log(parseCustomDate("Feb 20,2022 12:23"));  // Uses 2022

function getPPLogData(pageNumber) {
    $.get(`/game.php?screen=premium&mode=log&page=${pageNumber}`).then((data) => {
        console.log(`Getting page: ${pageNumber}`)

        $(data).find('#content_value > table:nth-child(4) > tbody > tr:not(:first-child)').each((i, el) => {
            dateVal = parseCustomDate(el.children[0].innerText);
            worldVal = el.children[1].innerText;
            changeVal = parseInt(el.children[3].innerText);

            if (worldVal in world_data) {
                world_data[worldVal]['dates'].push(dateVal);
                world_data[worldVal]['changes'].push(changeVal);
            }
            else {
                world_data[worldVal] = {}
                world_data[worldVal]['dates'] = [dateVal];
                world_data[worldVal]['changes'] = [changeVal];
            }

        })

        pageNumber++;
        if (pageNumber < n_pages_to_load) {
            getPPLogData(pageNumber);
        }
        else {
            // Got last page, all data is available


            // Reverse the order of the data so the oldest data is first in the array
            for (let world in world_data) {
                world_data[world]['dates'].reverse();
                world_data[world]['changes'].reverse();

                // Merge transactions occuring at the same time
                const { mergedDates, mergedValues } = mergeDuplicates(world_data[world]['dates'], world_data[world]['changes']);
                world_data[world]['merged_dates'] = mergedDates;
                world_data[world]['merged_values'] = mergedValues;

                let sum = 0;
                world_data[world]['cumsum'] = world_data[world]['merged_values'].map(num => sum += num);
            }



            console.log(world_data);

            createPlot();

        }
    })
}


getPPLogData(0);



