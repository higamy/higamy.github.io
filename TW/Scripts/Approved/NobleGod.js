// Constants
const WORLD_SETTINGS = 'worldSettings_higamy'; // localStorage key name
const NOBLE_GOD_VERSION = "0.1"
const VILLAGE_TIME = 'mapVillageTime_higamy'; // localStorage key name
const VILLAGES_LIST = 'mapVillagesList_higamy'; // localStorage key name
const TIME_INTERVAL = 60 * 60 * 1000; // fetch data every hour
let PAUSE_BETWEEN_REQUESTS = 300;

let villages;
let nobleSpeed;

// variables that will need to be UI elements later
sendOnlyAfterFinalNuke = false;
selectGroupToSendFrom = '20623'

// Get the coordinate list
let targetCoords = '523|274 522|275 520|276'
let cleanedCoordData = targetCoords.match(/\d{1,3}\|\d{1,3}/g);
console.log(cleanedCoordData);

//Helper: Convert CSV data into Array
function CSVToArray(strData, strDelimiter) {
    strDelimiter = strDelimiter || ',';
    var objPattern = new RegExp(
        '(\\' +
        strDelimiter +
        '|\\r?\\n|\\r|^)' +
        '(?:"([^"]*(?:""[^"]*)*)"|' +
        '([^"\\' +
        strDelimiter +
        '\\r\\n]*))',
        'gi'
    );
    var arrData = [[]];
    var arrMatches = null;
    while ((arrMatches = objPattern.exec(strData))) {
        var strMatchedDelimiter = arrMatches[1];
        if (
            strMatchedDelimiter.length &&
            strMatchedDelimiter !== strDelimiter
        ) {
            arrData.push([]);
        }
        var strMatchedValue;

        if (arrMatches[2]) {
            strMatchedValue = arrMatches[2].replace(new RegExp('""', 'g'), '"');
        } else {
            strMatchedValue = arrMatches[3];
        }
        arrData[arrData.length - 1].push(strMatchedValue);
    }
    return arrData;
}


// Helper: Fetch home troop counts for current group
// Copied from https://twscripts.dev/scripts/singleVillageSnipe.js on 15th July 2024, with permission from Red Alert
async function fetchTroopsForCurrentGroup(groupId) {
    const mobileCheck = jQuery('#mobileHeader').length > 0;
    const troopsForGroup = await jQuery
        .get(
            game_data.link_base_pure +
            `overview_villages&mode=combined&group=${groupId}&page=-1`
        )
        .then(async (response) => {
            const htmlDoc = jQuery.parseHTML(response);
            const homeTroops = [];

            if (mobileCheck) {
                let table = jQuery(htmlDoc).find('#combined_table tr.nowrap');
                for (let i = 0; i < table.length; i++) {
                    let objTroops = {};
                    let villageId = parseInt(
                        table[i]
                            .getElementsByClassName('quickedit-vn')[0]
                            .getAttribute('data-id')
                    );
                    let listTroops = Array.from(
                        table[i].getElementsByTagName('img')
                    )
                        .filter((e) => e.src.includes('unit'))
                        .map((e) => ({
                            name: e.src
                                .split('unit_')[1]
                                .replace('@2x.png', ''),
                            value: parseInt(
                                e.parentElement.nextElementSibling.innerText
                            ),
                        }));
                    listTroops.forEach((item) => {
                        objTroops[item.name] = item.value;
                    });

                    objTroops.villageId = villageId;

                    homeTroops.push(objTroops);
                }
            } else {
                const combinedTableRows = jQuery(htmlDoc).find(
                    '#combined_table tr.nowrap'
                );
                const combinedTableHead = jQuery(htmlDoc).find(
                    '#combined_table tr:eq(0) th'
                );

                const combinedTableHeader = [];

                // collect possible buildings and troop types
                jQuery(combinedTableHead).each(function () {
                    const thImage = jQuery(this).find('img').attr('src');
                    if (thImage) {
                        let thImageFilename = thImage.split('/').pop();
                        thImageFilename = thImageFilename.replace('.png', '');
                        combinedTableHeader.push(thImageFilename);
                    } else {
                        combinedTableHeader.push(null);
                    }
                });

                // collect possible troop types
                combinedTableRows.each(function () {
                    let rowTroops = {};

                    combinedTableHeader.forEach((tableHeader, index) => {
                        if (tableHeader) {
                            if (tableHeader.includes('unit_')) {
                                const villageId = jQuery(this)
                                    .find('td:eq(1) span.quickedit-vn')
                                    .attr('data-id');
                                const unitType = tableHeader.replace(
                                    'unit_',
                                    ''
                                );
                                rowTroops = {
                                    ...rowTroops,
                                    villageId: parseInt(villageId),
                                    [unitType]: parseInt(
                                        jQuery(this)
                                            .find(`td:eq(${index})`)
                                            .text()
                                    ),
                                };
                            }
                        }
                    });

                    homeTroops.push(rowTroops);
                });
            }

            return homeTroops;
        })
        .catch((error) => {
            UI.ErrorMessage(
                tt('An error occured while fetching troop counts!')
            );
            console.error(`${scriptInfo()} Error:`, error);
        });
    return troopsForGroup;
}

// Fetch 'village.txt' file
function fetchVillagesData() {
    $.get('map/village.txt', function (data) {
        villages = CSVToArray(data);
        localStorage.setItem(VILLAGE_TIME, Date.parse(new Date()));
        localStorage.setItem(VILLAGES_LIST, data);
    })
        .done(function () {
            init();
        })
        .fail(function (error) {
            console.error(`${scriptInfo()} Error:`, error);
            UI.ErrorMessage(
                `${tt('Error while fetching "village.txt"!')}`,
                4000
            );
        });

}


// Load the world settings if they have already been stored
if (localStorage.getItem(WORLD_SETTINGS) == null) {
    $.get('interface.php?func=get_unit_info', function (unitData) {

        $.get('interface.php?func=get_building_info', function (buildingData) {

            console.log("unitData", unitData)

            // Get the ram speed
            let nobleSpeed = parseFloat($(unitData).find("snob > speed").first().text());

            // Identify if it is a watchtower world
            let watchtowerWorld = false;
            if ($(buildingData).find("watchtower").length == 1) {
                watchtowerWorld = true;
            }

            let unitList = [];
            let nameItems = unitData.children[0].children;
            for (let unit of nameItems) {
                if ((unit['tagName'] != 'snob') && (unit['tagName'] != 'militia'))
                    unitList.push(unit['tagName'])
            }

            let settingsData = {
                'scriptVersion': NOBLE_GOD_VERSION,
                'nobleSpeed': nobleSpeed,
                'unitList': unitList,
                'watchtowerWorld': watchtowerWorld
            }

            console.log("world settings", settingsData)
            // Store the settings
            localStorage.setItem(WORLD_SETTINGS, JSON.stringify(settingsData));

            // Create the UI
            createNobleGodUI(settingsData);
        });
    })
}
else {
    let settingsData = JSON.parse(localStorage.getItem(WORLD_SETTINGS));
    console.log("Loaded world settings!", settingsData)
    createNobleGodUI(settingsData);
}


function createNobleGodUI(settingsData) {
    console.log(settingsData)


    // Collect the ram speed
    nobleSpeed = settingsData['nobleSpeed']; // Need parseFloat????


    // Get the village list

    // Auto-update localStorage villages list
    if (localStorage.getItem(VILLAGE_TIME) != null) {
        var mapVillageTime = parseInt(localStorage.getItem(VILLAGE_TIME));
        if (Date.parse(new Date()) >= mapVillageTime + TIME_INTERVAL) {
            // hour has passed, refetch village.txt
            fetchVillagesData();
        } else {
            // hour has not passed, work with village list from localStorage
            var data = localStorage.getItem(VILLAGES_LIST);
            villages = CSVToArray(data);
            init();
        }
    } else {
        // Fetch village.txt
        fetchVillagesData();
    }

}

function formatDate(date) {
    const pad = (num, size = 2) => String(num).padStart(size, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1); // Months are zero-based
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const milliseconds = pad(date.getMilliseconds(), 3);

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function init() {

    // Process the SOURCES
    let sourceVillages = await fetchTroopsForCurrentGroup(selectGroupToSendFrom); // NEED TO BE DYNAMIC!

    console.log(`Sending from ${sourceVillages.length} villages`);
    console.log(sourceVillages)

    // ADD WARNING IF NO VILLAGES IN GROUP DON'T CARRY ON!!

    // Add the village coordinates to sourceVillages
    for (let village of sourceVillages) {
        let villageData = villages.filter(item => parseInt(item[0]) == village['villageId']);
        village['x'] = parseInt(villageData[0][2]);
        village['y'] = parseInt(villageData[0][3]);
    }
    console.log('Updated troop counts', sourceVillages);


    // Process the TARGETS
    coords = targetCoords;
    coords = coords.split(' ');
    for (let i = 0; i < coords.length; i++) {
        coords[i] = coords[i].split('|');
    }
    console.log(coords);
    console.log(villages);

    const filteredArray = villages.filter(innerArray1 =>
        coords.some(innerArray2 =>
            innerArray1[2] === innerArray2[0] && innerArray1[3] === innerArray2[1]
        )
    );

    console.log(filteredArray);

    let promises = []

    for (let index = 0; index < filteredArray.length; index++) {
        let coord = filteredArray[index];
        // promises.push([$.get(`game.php?screen=info_village&id=${coord[0]}`)]);

        const customPromise = new Promise((resolve, reject) => {

            setTimeout(() => {
                // Progress update
                //loadingStatus.innerHTML = `Loading attacks at coordinate ${index + 1} of ${filteredArray.length}`;
                //loadingBar.style.width = `${100 * index / filteredArray.length}%`

                $.get(`game.php?screen=info_village&id=${coord[0]}`)
                    .done(response => {
                        // Resolve the promise with both the response and the additional information
                        resolve({ response, coord });
                    })
                    .fail(error => {
                        reject(error);
                    });
            }, index * PAUSE_BETWEEN_REQUESTS);

        });
        promises.push(customPromise)
    }


    Promise.all(promises)
        .then(results => {
            //loadingStatus.innerHTML = 'Calculating fangs timings...'
            //loadingBar.style.width = "100%"

            // All promises have resolved
            console.log('All requests are complete');
            console.log('Results:', results);
            let summaryResults = []

            for (let result of results) {

                let all_trs = $(result['response']).find('tr.command-row');
                const largeAttackRows = all_trs.filter(function () {

                    // Filter for attacks depends whether to include medium attacks as well or not
                    let filterStatement;
                    //if (includeMediumAttacks.checked) filterStatement = '[src*="large"], [src*="medium"]'; else filterStatement = '[src*="large"]';
                    filterStatement = '[src*="large"]';
                    return ($(this).find(filterStatement).length > 0) & ($(this).find('[data-command-type="attack"]').length > 0);
                });

                // Calculate the end time
                let endTimes = []
                let lastNukeTime = 0;
                for (let largeAttackRow of largeAttackRows) {
                    let endTimeText = parseInt($(largeAttackRow).find('span[data-endtime]').attr('data-endtime'));
                    endTimes.push(new Date(endTimeText * 1000));
                    lastNukeTime = Math.max(lastNukeTime, endTimeText);
                }

                // Log or manipulate the matching <tr> elements
                console.log(largeAttackRows);
                console.log(endTimes);

                // If only want to send after the last nuke, then just take that time
                if (sendOnlyAfterFinalNuke && endTimes.length > 1) {
                    console.log('Reducing down to only the latest time', endTimes)
                    endTimes = getLatestDate(endTimes);
                    console.log('After filtering', endTimes);
                }

                // Add to the final summary result
                summaryResults.push({
                    data: result['coord'],
                    times: endTimes,
                    lastNukeTime: lastNukeTime
                })

            }
            console.log(summaryResults);

            // Now calculate the noble launch times
            // Get the current date and time
            const now = new Date();


            let possibleSends = [];
            let resultString = "";

            for (let nukeVillage of summaryResults) {
                console.log("Nuke village", nukeVillage)
                for (let individualNukeTime of nukeVillage['times']) {


                    for (let sourceVillage of sourceVillages) {
                        console.log("nobleSpeed".nobleSpeed)
                        let travelTime = Math.hypot(parseInt(nukeVillage['data'][2]) - sourceVillage['x'], parseInt(nukeVillage['data'][3]) - sourceVillage['y']) * nobleSpeed;
                        let landTime = new Date(now.getTime() + travelTime * 60 * 1000);
                        let launchTime = new Date(individualNukeTime - travelTime * 60 * 1000);
                        console.log('Times', individualNukeTime, landTime)

                        if (landTime <= individualNukeTime) {
                            console.log(landTime)

                            // Calculate what units would be sent

                            // Build the URL
                            url = `/game.php?village=${sourceVillage['villageId']}&screen=place&target=${nukeVillage['data'][0]}&snob=1`

                            possibleSends.push({
                                'Launch Time': launchTime,
                                'Launch String': formatDate(launchTime),
                                'Launch Coord': `${sourceVillage['x']}|${sourceVillage['y']}`,
                                'Launch Village ID': sourceVillage['villageId'],
                                'Land Time': individualNukeTime,
                                'Land String': formatDate(individualNukeTime),
                                'Land Coord': `${nukeVillage['data'][2]}|${nukeVillage['data'][3]}`,
                                'Land Village ID': nukeVillage['data'][0],
                                'url': url
                            });
                        }
                    }
                }
            }

            possibleSends = possibleSends.sort((a, b) => a['Launch Time'] - b['Launch Time']);

            console.log(possibleSends);

            // Build up the attack plan
            for (let nukeSend of possibleSends) {
                resultString = resultString + `\n[unit]snob[/unit]  | ${nukeSend['Launch String']} | ${nukeSend['Land String']} | ${nukeSend['Launch Coord']} ->  ${nukeSend['Land Coord']} | [url=game.php?village=${nukeSend['Launch Village ID']}&screen=place&target=${nukeSend['Land Village ID']}&snob=1&spy=1&light=1]Attack[/url]`
            }

            // Copy to clipboard
            navigator.clipboard.writeText(resultString)
            console.log("possibleSends", possibleSends);
            console.log("resultString", resultString);
            // Create the string
        });
}