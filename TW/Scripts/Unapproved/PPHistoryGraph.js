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
amountOfPages = parseInt($(".paged-nav-item")[$(".paged-nav-item").length - 1].href.match(/page=(\d+)/)[1]);
n_pages_to_load = amountOfPages;
PLOT_VS_DAYS_SINCE_START = true;

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


function reformatDataByWorld(data) {
    const result = {};

    for (const [world, details] of Object.entries(data)) {

        if (PLOT_VS_DAYS_SINCE_START) {
            result[world] = details['Days Since Start'].map((date, index) => ({
                x: date,
                value: details.cumsum[index]
            }));
        }
        else {
            result[world] = details.merged_dates.map((date, index) => ({
                x: date, // Format date as 'YYYY-MM-DD'
                value: details.cumsum[index]
            }));
        }
    }

    return result;
}


function createPlot() {

    // Make the container
    const container = document.createElement('div');
    container.setAttribute('id', 'container');

    let start = new Date().getTime()
    let script = document.createElement('script');
    script.type = "text/javascript"
    script.src = "https://cdn.anychart.com/releases/8.9.0/js/anychart-base.min.js"
    script.onload = function () {
        let stop = new Date().getTime()
        console.log(`insert chart library in ${stop - start} ms`)

        // 2. Create a container
        const container = document.createElement('div');
        container.id = 'anychartContainer';
        container.style.width = '100%';
        container.style.height = '400px';
        document.body.appendChild(container);

        // Prepare the data
        reformattedData = reformatDataByWorld(world_data);
        all_data = []
        for (let world in reformattedData) {
            all_data = reformattedData[world];
        }

        console.log("all_data", all_data)

        // 3. Create an AnyChart chart
        anychart.onDocumentReady(() => {
            var chart = anychart.scatter();


            for (let world in reformattedData) {
                all_data = reformattedData[world];


                // Add line using the same data
                const line = chart.line(all_data).markers(true).name(world);
                //line.stroke({ color: '#2196F3', thickness: 2 });
            }


            // Configure X-axis (DateTime)
            // Configure X-axis for DateTime
            if (PLOT_VS_DAYS_SINCE_START) {
                chart.xAxis().title('Days Since Start')
            }
            else {
                chart.xScale('linear');
                chart.xAxis().title('Date').labels().format(function () {
                    return anychart.format.dateTime(this.value, 'yyyy-MM-dd HH:mm');
                });
            }

            // Enable and customize legend
            chart.legend().enabled(true).position('bottom').itemsLayout('horizontal');

            // Configure Y-axis
            chart.yAxis().title('Premium Points');

            // Add grid lines
            //chart.grid().enabled(true);

            chart.title('Premium Points Trend');
            chart.container('anychartContainer');
            chart.draw();
        });
    };
    document.head.appendChild(script);
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

                // Add an attribute for days since the start
                firstDate = mergedDates[0];
                const daysSinceFirst = mergedDates.map(date => {
                    const diff = date - firstDate; // Difference in milliseconds
                    return Math.floor(diff / (1000 * 60 * 60 * 24)); // Convert to days
                });
                world_data[world]['Days Since Start'] = daysSinceFirst;
            }

            console.log(world_data);

            createPlot();

        }
    })
}


getPPLogData(0);



