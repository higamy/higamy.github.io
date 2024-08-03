/* 
IMPROVEMENT IDEAS

Find villages with existing fangs after the nuke and don't send to those
Min village points
Checkbox - send after the last nuke rather than any nuke
Checkbox - option to have a random nuke in the time window rather than closest one to the nuke
Maximum fangs to send after each nuke
Optimise matching nukes to fangs 
Validate if user ID is allowed to run the script against a list of validated users
Checkbox - Feature to keep fang as green
Update to work with the current group (currently uses All group)
Option to include orange medium attacks
Make the UI draggable
Option to select group
Delay the requests to get information from other villages

Option to include some fakes - they could even be timed after the nukes?

Deal with Captcha while loading requests - need to see what the return value from server is
Show distribution of hours after the nuke how many launches would be possible?
Summary of the coordinates given how many nukes were headed to each one.

Cache in memory the incomings? So can change the number per tab?
Pressing calculate twice (with updated settings) sometimes doesn't work


All settings saved in memory    

UI REQUIREMENTS
Inputs
- Coords
- Max Fangs after each nuke
- Troop definition - send and reserve
- Checkbox - send only after last nuke
- Checkbox - random nuke to be sent or the closest one
- Checkbox - keep fang as green?
*/

// CONSTANTS
const VILLAGE_TIME = 'mapVillageTime_higamy'; // localStorage key name
const VILLAGES_LIST = 'mapVillagesList_higamy'; // localStorage key name
const TIME_INTERVAL = 60 * 60 * 1000; // fetch data every hour

let villages;

// DOM Elements
let divFangLaunches;
let maxFangsPerNuke;
let loadingScreen;
let loadingStatus;
let loadingBar;
let chboxIncludeMediumAttacks;
let sendClosestFang;
let sendOnlyAfterFinalNuke;
let selectGroupToSendFrom;
let includeMediumAttacks;
let keepFangGreen;

// Variables that will need to be user settings later
let coords = "706|381 704|386"
let minimum_units = {
    catapult: 50,
    light: 50
}
let N_SENDS_PER_TAB = 20;
let PAUSE_BETWEEN_REQUESTS = 250;
let PAUSE_BETWEEN_OPEN_TABS = 200;

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

function updateCoordsTitle(inputVal = null) {

    console.log('Running update coords', inputVal)

    if (inputVal) {
        // Update the title for the number of coords
        lgdCoordinatesTitle.innerHTML = 'Coordinates (' + inputVal.length + ')';
    } else {
        let coordsInput = document.getElementById('coordsInput');
        let lgdCoordinatesTitle = document.getElementById('lgdCoordinatesTitle');

        let cleanedCoordData = coordsInput.value.match(/\d{1,3}\|\d{1,3}/g);
        console.log(cleanedCoordData);

        if (cleanedCoordData) {
            // Clean the coordinates
            coordsInput.value = cleanedCoordData.join(' ');

            // Update the title for the number of coords
            lgdCoordinatesTitle.innerHTML = 'Coordinates (' + cleanedCoordData.length + ')';
        }
        // No coordinates input, tidy up    
        else {
            coordsInput.value = '';
            lgdCoordinatesTitle.innerHTML = 'Coordinates (0)';
        }
    }

}
function cleanInput(event) {
    // Prevent the default paste action
    event.preventDefault();

    // Get the text from the clipboard
    let clipboardData = event.clipboardData || window.clipboardData;
    let pastedData = clipboardData.getData('Text');

    let match = pastedData.match(/\d{1,3}\|\d{1,3}/g);
    if (match) {
        console.log("Found match!")
        document.getElementById('coordsInput').value = match.join(' ');
        updateCoordsTitle(match);
    }
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


// Get ram / catapult travel speed
let ramSpeed;
let allUnits = [];
let fangFinderUI;
$.get('interface.php?func=get_unit_info', function (data) {

    // Add the UI
    fangFinderUI = document.createElement('div');
    fangFinderUI.style = `
    position: absolute;
    width: 745px;
    top: 100px;
    left: 10%;
    z-index: 1000;`
    fangFinderUI.classList.add('hidden');
    fangFinderUI.innerHTML = `<style>
    body {
        font-family: Verdana, Arial;
    }

    legend {
        font-weight: bold;
        padding: 0px 10px;
    }

    fieldset {
        margin: 2px 5px 5px 2px;
        border-color: #c1a264;
        border-width: 1px;
    }

    .inputUnits {
        text-align: center;
        width: 50px;
        height: 20px;
    }

    .thUnit {
        text-align: center;
    }

    .hidden {
        display: none !important
    }


    input[type=number]::-webkit-inner-spin-button,
    input[type=number]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        margin: 0;
    }

    .nukeButton {
        display: inline-block;
        padding: 5px 10px;
        margin: 0 2px;
        text-align: center;
        font-family: Verdana, Arial;
        font-size: 12px !important;
        font-weight: bold;
        line-height: normal;
        cursor: pointer;
        -webkit-border-radius: 5px;
        border-radius: 5px;
        border: 1px solid #000;
        color: #fff;
        white-space: nowrap;
    }

    #loadingScreen {
        background-color: rgba(100, 100, 100, 0.5);
        width: 100%;
        height: 600px;
        position: absolute;
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    #loadingInformation {
        background-color: rgb(210, 192, 158);
        padding: 18px 20px;
        margin: 0px 50px;
        border-radius: 15px;
        width: 100%;
        text-align: center;
        border: 5px solid #603000;
        display: flex;
        flex-direction: column;
    }

    #loadingContainer {
        width: 100%;
        background-color: #e0e0e0;
        border-radius: 25px;
        overflow: hidden;
        margin: 20px 0;
    }

    #loadingBar {
        height: 30px;
        width: 0;
        background-color: rgb(214, 179, 113);
        border-radius: 25px;
        transition: width 0.3s ease-in-out;
    }

    #divFangLaunches {
        display: flex;
        flex-wrap: wrap;
        row-gap: 5px;
        /*justify-content: space-between;*/
    }

    /* styles.css */
    .flip-container {
        perspective: 1000px;
        height: 600px;
        background-color: #e3d5b3;
        border: 5px solid #603000;
        border-radius: 10px;
        z-index: 1000;
        overflow-y: auto;
    }

    .flipper {
        position: relative;
        transform-style: preserve-3d;
        transition: transform 0.6s;
    }

    .front,
    .back {
        backface-visibility: hidden;
        position: absolute;
        width: 100%;
        height: 100%;
    }

    .flipped .flipper {
        transform: rotateY(180deg);
    }

    .back {
        transform: rotateY(180deg);
        background-color: rgb(214, 179, 113);
        margin-left: -10px;
    }

    #helpIcon {
        border: solid 3.5px rgb(0 0 0);
        border-radius: 50%;
        width: 30px;
        height: 30px;
        text-align: center;
        vertical-align: middle;
        box-sizing: border-box;
        display: inline-block;
        font-size: 20px;
        align-content: center;
        cursor: pointer;
        font-size: 16px;
    }

    #helpIcon:hover {
        background-color: rgb(0, 128, 6);
        border-width: 5px;
    }
</style>


<div class="flip-container" id="flipContainer">


    <div style="font-size: 24px; font-weight: bold; background-color: rgb(193, 162, 100); padding: 5px; border-radius: 5px 5px 0px 0px;"
        onclick="let flipContainer = document.getElementById('flipContainer'); flipContainer.classList.toggle('flipped')">
        Fang God
        <span id='helpIcon'>?</span>
    </div>
    <div class="flipper">
        <div class="front">
            <!-- Front content -->
            <div id="loadingScreen" class="hidden">
                <div id="loadingInformation">
                    <span id='loadingStatus'>Loading...</span>
                    <div id='loadingContainer'>
                        <div id='loadingBar'></div>
                    </div>
                </div>

            </div>



            <div id="settingsContainer" style="padding: 10px; ">

                <fieldset>
                    <legend id="lgdCoordinatesTitle">Coordinates (0)</legend>

                    <textarea name="" id="coordsInput" style="width: 100%; height: 100px; resize: none;"
                        onpaste="cleanInput(event)" onchange="updateCoordsTitle()"></textarea>

                </fieldset>

                <fieldset>
                    <legend>Troops to send</legend>
                    <div>
                        <span>Group to send from</span>
                        <select name="" id="selectGroupToSendFrom"></select>
                    </div>

                    <table>
                        <thead>
                            <tr id="trUnitIcons">
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr id="trUnitsSend">
                                <td>Send</td>
                            </tr>
                        </tbody>

                    </table>
                    <div>
                        <span>Keep fang as "green" <img
                                src="https://dsen.innogamescdn.com/asset/35e971b9/graphic/command/attack_small.png"
                                alt="">
                            (recommended on watchtower worlds)</span>
                        <input type="checkbox" name="" id="keepFangGreen">
                    </div>
                    <div id="maxFangsDiv">
                        <span>Max fangs per nuke</span>
                        <input type="number" name="" id="maxFangsPerNuke" value="2">
                    </div>

                </fieldset>

                <fieldset>
                    <legend>Timing Settings</legend>

                    <div id="troopDefinitionDiv"></div>

                    <div>
                        <span>Time fangs also after medium <img
                                src="https://dsen.innogamescdn.com/asset/35e971b9/graphic/command/attack_medium.png"
                                alt="">
                            attacks?</span>
                        <input type="checkbox" name="" id="includeMediumAttacks" checked>
                    </div>
                    <div>
                        <span>Send closest fang?</span>
                        <input type="checkbox" name="" id="sendClosestFang">
                    </div>
                    <div>
                        <span>Min hours after nuke</span>
                        <input type="number" name="" id="minHoursAfterNuke" value=0>
                    </div>
                    <div>
                        <span>Max hours after nuke</span>
                        <input type="number" name="" id="maxHoursAfterNuke" value=4>
                    </div>
                    <div>
                        <span>Send only after final nuke?</span>
                        <input type="checkbox" name="" id="sendOnlyAfterFinalNuke" checked>
                    </div>

                    <div>
                        <span>Number of launches per tab</span>
                        <input type="number" name="" id="nLaunchesPerTab" value=20>
                    </div>

                    <div>
                        <button id="btnCalculateFangs">Calculate</button>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>Fang Launches</legend>
                    <div id="divFangLaunches"></div>
                </fieldset>
            </div>
        </div>
        <div class="back">
            <!-- Back content -->
            <h3>About the script</h3>
            <div>This script is aimed to help fanging enemies down .</div>
        </div>
    </div>

</div>`

    $.get('interface.php?func=get_building_info', function (data) {
        if ($(data).find("watchtower").length == 1) {
            keepFangGreen.setAttribute('checked', true);
        }
    });


    document.body.append(fangFinderUI);

    // Get DOM elements
    divFangLaunches = document.getElementById('divFangLaunches');
    maxFangsPerNuke = document.getElementById('maxFangsPerNuke');
    loadingScreen = document.getElementById('loadingScreen');
    loadingStatus = document.getElementById('loadingStatus');
    loadingBar = document.getElementById('loadingBar');
    sendClosestFang = document.getElementById('sendClosestFang');
    sendOnlyAfterFinalNuke = document.getElementById('sendOnlyAfterFinalNuke');
    selectGroupToSendFrom = document.getElementById('selectGroupToSendFrom');
    includeMediumAttacks = document.getElementById('includeMediumAttacks');
    keepFangGreen = document.getElementById('keepFangGreen');


    // Collect the ram speed
    ramSpeed = parseFloat($(data).find("ram > speed").first().text());

    // Group to select
    // This small section is copied from FarmGod code.
    $.get(TribalWars.buildURL('GET', 'groups', { 'ajax': 'load_group_menu' })).then((groups) => {
        id = 0;
        let options = ``;

        groups.result.forEach((val) => {
            if (val.type == 'separator') {
                options += `<option disabled=""/>`;
            } else {
                options += `<option value="${val.group_id}" ${(val.group_id == id) ? 'selected' : ''}>${val.name}</option>`;
            }
        });

        selectGroupToSendFrom.innerHTML = options;
    });

    // Collect the list of all units in the game
    let nameItems = data.children[0].children;

    for (let unit of nameItems) {
        if ((unit['tagName'] != 'snob') && (unit['tagName'] != 'militia'))
            allUnits.push(unit['tagName'])
    }
    console.log(allUnits);


    // Now add these to the table
    let trUnitIcons = document.querySelector('#trUnitIcons');
    let trUnitsSend = document.querySelector('#trUnitsSend');
    for (let unit of allUnits) {

        console.log(unit);
        //  --- Add the unit icons ---
        let thUnit = document.createElement('th');
        thUnit.classList.add('thUnit');
        let labelUnit = document.createElement('label');
        let imgUnit = document.createElement('img');

        imgUnit.setAttribute('src', `/graphic/unit/unit_${unit}.png`)


        // Build the DOM
        thUnit.appendChild(labelUnit);
        labelUnit.appendChild(imgUnit);
        trUnitIcons.appendChild(thUnit)

        //  --- Add the send row ---
        let tdUnitSend = document.createElement('td');
        let inputUnitSend = document.createElement('input');

        inputUnitSend.classList.add('inputUnits');
        inputUnitSend.setAttribute('type', 'number');
        inputUnitSend.setAttribute('value', 0);
        inputUnitSend.setAttribute('unit', unit);

        // Build the DOM
        tdUnitSend.appendChild(inputUnitSend);
        trUnitsSend.appendChild(tdUnitSend);
    }




    // Coordinates section
    const btnCalculateFangs = document.getElementById('btnCalculateFangs');
    btnCalculateFangs.addEventListener('click', () => {
        loadingScreen.classList.remove('hidden');

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
    })

    // Now the UI is constructed, show it
    fangFinderUI.classList.remove('hidden');
})

function getRandomElements(arr, n) {
    // Make a shallow copy of the array
    const shuffled = arr.slice();

    // Shuffle the array
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Return the first n elements of the shuffled array
    return shuffled.slice(0, n);
}

function getLatestDate(dates) {
    return dates.reduce((latest, current) => {
        return [(new Date(current) > new Date(latest)) ? current : latest];
    });
}

let confirmedSends;
async function init() {
    // Now need to get troops home
    let sourceVillages = await fetchTroopsForCurrentGroup(selectGroupToSendFrom.value); // NEED TO BE DYNAMIC!

    console.log(`Sending from ${sourceVillages.length} villages`);

    // ADD WARNING IF NO VILLAGES IN GROUP DON'T CARRY ON!!

    // Add the village coordinates to sourceVillages
    for (let village of sourceVillages) {
        let villageData = villages.filter(item => parseInt(item[0]) == village['villageId']);
        village['x'] = parseInt(villageData[0][2]);
        village['y'] = parseInt(villageData[0][3]);
    }
    console.log('Updated troop counts', sourceVillages);

    coords = document.getElementById('coordsInput').value;
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
                loadingStatus.innerHTML = `Loading attacks at coordinate ${index + 1} of ${filteredArray.length}`;
                loadingBar.style.width = `${100 * index / filteredArray.length}%`

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
            loadingStatus.innerHTML = 'Calculating fangs timings...'
            loadingBar.style.width = "100%"

            // All promises have resolved
            console.log('All requests are complete');
            console.log('Results:', results);
            let summaryResults = []

            for (let result of results) {


                let all_trs = $(result['response']).find('tr.command-row');
                const largeAttackRows = all_trs.filter(function () {

                    // Filter for attacks depends whether to include medium attacks as well or not
                    let filterStatement;
                    if (includeMediumAttacks.checked) filterStatement = '[src*="large"], [src*="medium"]'; else filterStatement = '[src*="large"]';

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
                if (sendOnlyAfterFinalNuke.checked && endTimes.length > 1) {
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

            // Sort to put the one with the soonest last nuke time first as likely to be the most constrained
            summaryResults.sort((a, b) => a['lastNukeTime'] - b['lastNukeTime']);
            console.log("summaryResults", summaryResults);

            // Filter to only get vills that meet the minimum requirements
            for (let key in minimum_units) {
                sourceVillages = sourceVillages.filter(item => item[key] >= minimum_units[key]);
            }
            console.log(sourceVillages);

            // Get the current date and time
            const now = new Date();

            // Extract Settings
            let maxHoursAfterNuke = document.getElementById('maxHoursAfterNuke').value;
            let minHoursAfterNuke = document.getElementById('minHoursAfterNuke').value;

            // Extract troops
            let troopSettings = {}
            for (let unitInput of $('input[unit]')) {
                let unitName = unitInput.getAttribute('unit');
                let unitValue = unitInput.value;

                // If the field was deleted to be empty, then reinstate the zero
                if (unitValue == '') {
                    unitInput.value = 0;
                    unitValue = 0;
                }

                if (isNaN(unitValue) | isNaN(parseFloat(unitValue))) {
                    alert(`Non numeric input of ${unitValue} in field ${unitName}!`);
                }

                troopSettings[unitName] = unitValue;
            }

            console.log("troopSettings", troopSettings);

            // Now match up nukes to fangs
            confirmedSends = []
            for (let nukeVillage of summaryResults) {
                console.log("Nuke village", nukeVillage)
                for (let individualNukeTime of nukeVillage['times']) {


                    let earliestLandTime = new Date(individualNukeTime.getTime() + minHoursAfterNuke * 60 * 60 * 1000);
                    let latestLandTime = new Date(individualNukeTime.getTime() + maxHoursAfterNuke * 60 * 60 * 1000);

                    let possibleSends = [];

                    for (let sourceVillage of sourceVillages) {
                        let travelTime = Math.hypot(parseInt(nukeVillage['data'][2]) - sourceVillage['x'], parseInt(nukeVillage['data'][3]) - sourceVillage['y']) * ramSpeed;
                        let landTime = new Date(now.getTime() + travelTime * 60 * 1000);

                        if ((landTime >= earliestLandTime) && (landTime <= latestLandTime)) {
                            console.log(landTime)

                            // Calculate what units would be sent

                            // Build the URL
                            url = `/game.php?village=${sourceVillage['villageId']}&screen=place&target=${nukeVillage['data'][0]}`
                            let troopsToSend = {}
                            let totalTroops = 0;
                            for (let troop in troopSettings) {
                                let troopAmount = parseInt(troopSettings[troop]);

                                // Interpret negative as all minus this amount
                                if (troopAmount < 0) troopAmount = troopAmount + sourceVillage[troop];

                                // Cap at maximum troops available in the village
                                troopAmount = Math.min(troopAmount, sourceVillage[troop]);

                                // Minimum of zero
                                troopAmount = Math.max(troopAmount, 0);

                                // Don't send the last scout out    
                                if (troop == 'spy') { troopAmount = Math.min(troopAmount, sourceVillage[troop] - 1) };

                                troopsToSend[troop] = troopAmount;
                                totalTroops += troopAmount;
                            }

                            // Cap the troops if needed 
                            if (keepFangGreen.checked && totalTroops > 1000) {
                                let troopsAvailable = 1000;
                                // Always 1 scout - as long as it would leave 1 behind. Never send out the last scout!
                                if (troopsToSend['spy'] > 1) {
                                    troopsToSend['spy'] = 1;
                                    troopsAvailable -= 1;
                                }

                                // When capping the fang to keep it green, prioritise these units in this order
                                // I.e. send as many catapults as possible, then fill with LC, then with HC etc.
                                let unitPriorities = ['catapult', 'light', 'heavy', 'marcher', 'axe', 'sword', 'archer', 'spear'];

                                for (let unit of unitPriorities) {
                                    if (unit in troopsToSend) {
                                        troopsToSend[unit] = Math.min(troopsToSend[unit], troopsAvailable);
                                        troopsAvailable -= troopsToSend[unit];
                                    }
                                }
                            }

                            // Build the URL
                            for (let troop in troopsToSend) {
                                if (troopsToSend[troop] > 0) url = `${url}&${troop}=${troopsToSend[troop]}`;
                            }

                            possibleSends.push({
                                'Land Time': landTime,
                                'Source Village ID': sourceVillage['villageId'],
                                'url': url
                            });
                        }
                    }

                    possibleSends = possibleSends.sort((a, b) => a['Land Time'] - b['Land Time']);
                    console.log(possibleSends);

                    // Extract just the ones that are allowed within constraints

                    console.log("sendClosestFang", sendClosestFang.checked);
                    if (sendClosestFang) {
                        possibleSends = possibleSends.splice(0, maxFangsPerNuke.value);
                    }
                    // Otherwise take random sends
                    else {
                        possibleSends = getRandomElements(possibleSends, maxFangsPerNuke.value);
                    }

                    for (let nukeSend of possibleSends) {
                        confirmedSends.push(nukeSend);
                        // Remove this source village from the list now that the fang is accounted for.
                        sourceVillages = sourceVillages.filter(village => village.villageId !== nukeSend['Source Village ID']);
                    }
                }
            }

            console.log("confirmedSends", confirmedSends);

            // Now populate the fang launches
            N_SENDS_PER_TAB = document.getElementById('nLaunchesPerTab').value;
            let n_sends_this_iteration;
            let currentSendNumber = 1;
            let sendsLeftToAdd = confirmedSends.length;

            // Clear the UI from any previous launches that were added
            divFangLaunches.innerHTML = '';

            while (sendsLeftToAdd > 0) {
                // Calculate how many sends should be made this iteration
                n_sends_this_iteration = Math.min(N_SENDS_PER_TAB, sendsLeftToAdd);

                console.log('n_sends_this_iteration', n_sends_this_iteration);
                console.log('currentSendNumber', currentSendNumber);

                // Update the UI
                const btnSendAttacks = document.createElement('button');
                btnSendAttacks.innerHTML = `${currentSendNumber}-${currentSendNumber + n_sends_this_iteration - 1}`
                btnSendAttacks.classList.add('btn-confirm-yes', 'nukeButton');
                btnSendAttacks.setAttribute('firstSend', currentSendNumber - 1);
                btnSendAttacks.setAttribute('lastSend', currentSendNumber - 1 + n_sends_this_iteration);
                divFangLaunches.appendChild(btnSendAttacks);


                btnSendAttacks.onclick = () => {
                    btnSendAttacks.classList.remove('btn-confirm-yes');
                    btnSendAttacks.classList.add('btn-confirm-no');

                    let sendsForThisLaunch = confirmedSends.splice(btnSendAttacks.getAttribute('firstSend'), btnSendAttacks.getAttribute('lastSend'));

                    sendsForThisLaunch.forEach((url, index) => {
                        setTimeout(() => {
                            window.open(url['url'], '_blank');
                        }, index * PAUSE_BETWEEN_OPEN_TABS);
                    });

                    // So that the button isn't accidentally clicked twice
                    fangFinderUI.focus();
                };

                // Update the number left to send
                currentSendNumber += n_sends_this_iteration;
                sendsLeftToAdd -= n_sends_this_iteration;
            }

            // Everything finished, remove the loading screen
            loadingScreen.classList.add('hidden');

        })
        .catch(error => {
            // If any of the promises fail
            console.error('One or more requests failed', error);
        });

}

