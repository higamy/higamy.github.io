// Constants
const WORLD_SETTINGS = 'worldSettings_higamy_NobleGod'; // localStorage key name
const NOBLE_GOD_VERSION = "0.1"
const VILLAGE_TIME = 'mapVillageTime_higamy'; // localStorage key name
const VILLAGES_LIST = 'mapVillagesList_higamy'; // localStorage key name
const TIME_INTERVAL = 60 * 60 * 1000; // fetch data every hour
let PAUSE_BETWEEN_REQUESTS = 300;

let villages;
let nobleSpeed;

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
let maxNobleTravelTimeHours;
let divAttackPlan;
let copyAttackPlan;
let attackPlanLegend;
let sendOnlyClosestNoble;

// variables that will need to be UI elements later
sendOnlyAfterFinalNuke = false;


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

// Extracts coordinates from pasted text
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


function storeSettings() {
    let settingsInputs = $('[settingType]');
    let settings = { 'version': NOBLE_GOD_VERSION }

    for (let settingsInput of settingsInputs) {
        settings[settingsInput.getAttribute('id')] = settingsInput.value;
    }
    localStorage.setItem('NobleGod_Settings', JSON.stringify(settings));
    console.log(settings)
}

function loadSettings() {
    let settingsInputs = JSON.parse(localStorage.getItem('NobleGod_Settings')) || false;

    if (settingsInputs) {
        for (let settingName in settingsInputs) {
            let el = document.getElementById(settingName);

            if (el) {
                if (el.getAttribute('settingType') == 'numeric') {
                    el.value = settingsInputs[settingName];
                }
                else if (settingsInputs[settingName] == 'on') {
                    el.checked = true;
                }
                else if (settingsInputs[settingName] == 'off') {
                    el.checked = false;
                }
            }
        }
    }
}

function getLatestDate(dates) {
    return dates.reduce((latest, current) => {
        return [(new Date(current) > new Date(latest)) ? current : latest];
    });
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
                if (unit['tagName'] != 'militia')
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

    // Add the UI
    fangFinderUI = document.createElement('div');
    fangFinderUI.style = `
        position: absolute;
        width: 810px;
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
        min-width: 80px;
    }

    .settingSpan {
        font-style: italic;
        font-weight: bold;
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
        align-items: center;
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
        transition: width 0.3s linear;
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
        margin-left: 5px;
        width: 98% !important;
    }

    .settingsDiv {
        margin-top: 10px;
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

    #btnCalculateFangs {
        font-size: 18px;
        border-radius: 5px;
        background-color: green;
        font-weight: bold;
        padding: 5px 15px;
        margin: 10px 0px;
        cursor: pointer;
        transition-duration: 0.2s;
    }


    #btnCalculateFangs:hover {
        border-radius: 15px;
        background-color: rgb(0, 104, 0);
    }
</style>


<div class="flip-container" id="flipContainer">


    <div style="font-size: 24px; font-weight: bold; background-color: rgb(193, 162, 100); padding: 5px; border-radius: 5px 5px 0px 0px;     top: 0px;
    z-index: 10000; position: sticky;"
        onclick="let flipContainer = document.getElementById('flipContainer'); flipContainer.classList.toggle('flipped')">
        Noble God
        <span id='helpIcon'>?</span>
    </div>
    <div class="flipper">
        <div class="front">
            <!-- Front content -->
            <div id="loadingScreen" class="hidden">
                <div id="loadingInformation">
                    <img src="https://people.tamu.edu/~yasskin/SEE-Math/2017/CounselorMovies/mark-c.gif" alt=""
                        style="width: 80px;">
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
                        <select name="" id="selectGroupToSendFrom" settingType="numeric"></select>
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

                </fieldset>

                <fieldset>
                    <legend>Timing Settings</legend>

                    <div id="troopDefinitionDiv"></div>

                    <div>
                        <span>Time nobles also after medium <img
                                src="https://dsen.innogamescdn.com/asset/35e971b9/graphic/command/attack_medium.png"
                                alt="">
                            attacks?</span>
                        <input type="checkbox" name="" id="includeMediumAttacks" checked settingType="checkbox">
                    </div>
                    <div>
                        <span>Max Noble travel time (hours)</span>
                        <input type="number" name="" id="maxNobleTravelTimeHours" value=12 settingType="numeric">
                    </div>
                    <div>
                        <span>Send only after final nuke?</span>
                        <input type="checkbox" name="" id="sendOnlyAfterFinalNuke" checked settingType="checkbox">
                    </div>
                    <div>
                        <span>Only send closest noble?</span>
                        <input type="checkbox" name="" id="sendOnlyClosestNoble" checked settingType="checkbox">
                    </div>
                    <div>
                        <button id="btnCalculateFangs">Calculate</button>
                    </div>
                </fieldset>

                <fieldset>
                    <legend id="attackPlanLegend">Attack Plan</legend>
                    <button id="copyAttackPlan" class="hidden">Copy Attack Plan</button>
                    <div id="divAttackPlan"
                        style="max-height: 300px; overflow-y: scroll; font-style: italic; margin-top: 10px;"></div>
                </fieldset>
            </div>
        </div>
        <div class="back">
            <!-- Back content -->
            <h3>About the script</h3>
            <div>This script is aimed to help fanging enemies down. It allows the user to send fangs in bulk at enemy
                villages, timed after nukes <img
                    src="https://dsen.innogamescdn.com/asset/35e971b9/graphic/command/attack_large.png" alt=""> in a
                window provided by the user. Timing fangs in this way ensures they do
                more damage as likely the village is cleared by the nuke. The tool includes nukes found on shared
                commands, not just your own nukes.</div>

            <h3>Settings</h3>

            <fieldset>
                <legend>Coordinates</legend>
                <div>Note that "messy" text can be pasted in here, and the tool will strip all valid coordinates out of
                    the text.</div>
            </fieldset>

            <fieldset>
                <legend>Troops to Send</legend>
                <div>The values here are interpreted the same as troop templates. There is no "all" option, but typing
                    in
                    99999 will effectively mean all troops will be sent!<br>
                    Typing in, for example, "-5" will send all troops apart from leaving 5 in reserve (as it does in a
                    troop
                    template).
                    Fang God will always leave 1 scout home so you won't get scouted by fakes accidentally.

                    <br><br>
                    <span class="settingSpan">Keep fang as "green" <img
                            src="https://dsen.innogamescdn.com/asset/35e971b9/graphic/command/attack_small.png"
                            alt=""></span>
                    <span>This will limit the troops to 1000 maximum so that a watchtower cannot detect it is a real
                        attack.
                        Fang God does this according to the following rules
                        <ul>
                            <li>Send 1 scout</li>
                            <li>Send as many catapults as possible</li>
                            <li>The remaining troops are sent with as many possible in this priority order
                                <ul>
                                    <li><img src="/graphic/unit/unit_ram.png" alt=""></li>
                                    <li><img src="/graphic/unit/unit_light.png" alt=""></li>
                                    <li><img src="/graphic/unit/unit_heavy.png" alt=""></li>
                                    <li><img src="/graphic/unit/unit_marcher.png" alt=""></li>
                                    <li><img src="/graphic/unit/unit_axe.png" alt=""></li>
                                    <li><img src="/graphic/unit/unit_sword.png" alt=""></li>
                                    <li><img src="/graphic/unit/unit_archer.png" alt=""></li>
                                    <li><img src="/graphic/unit/unit_spear.png" alt=""></li>
                                </ul>

                            </li>

                        </ul>
                    </span>
                </div>

                <span class="settingSpan">Max fangs per nuke</span><span> - simply limits the number of fangs to send
                    after a nuke. Sending too many may
                    advertise real attacks to a village.</span>
            </fieldset>



            <fieldset>
                <legend>Timing</legend>
                <div class="settingsDiv">
                    <span class="settingSpan">Time fangs also after medium <img
                            src="https://dsen.innogamescdn.com/asset/35e971b9/graphic/command/attack_medium.png" alt="">
                        attacks?</span>
                    <span>Counts medium sized attacks as permissible to time fangs after, may not be appropriate in all
                        situations.</span>
                </div>
                <div class="settingsDiv">
                    <span class="settingSpan">Send closest fang?</span>
                    <span>Whether to send the tightest possible fang to the nuke, or whether to pick a random fang in
                        the timing window selected. A random fang is recommended as even if a window with a delay is
                        chosen (e.g. 1-3 hours), consistently having attacks just over 1 hour after nukes creates a
                        pattern of attacks that the defender may use to identify both nukes and fangs.</span>
                </div>
                <div class="settingsDiv">
                    <span class="settingSpan">Min hours after nuke</span>
                    <span>Only time fangs at least this many hours after a nuke. Fractions of hours are permissible
                        (e.g. 1.5)</span>
                </div>
                <div class="settingsDiv">
                    <span class="settingSpan">Max hours after nuke</span>
                    <span>Only time fangs that are no later than this many hours after a nuke.</span>
                </div>
                <div class="settingsDiv">
                    <span class="settingSpan">Send only after final nuke?</span>
                    <span>If multiple nukes are hitting a village, should fangs be planned after any / every nuke, or
                        only after the final nuke? Typically the final nuke is best to time after (since the village is
                        most likely to be empty after multiple nukes), however with constant
                        nuke spam there may be very long range nukes that you don't want to wait for and so you may be
                        happy to time after earlier nukes.</span>
                </div>

                <div class="settingsDiv">
                    <span class="settingSpan">Number of launches per tab</span>
                    <span>The launches will be split over multiple browser tabs. To avoid overloading the browser in the
                        case of hundreds of fangs, these are split into batches, very similar to the beloved Costache
                        fake script. This setting controls how many to partition into.</span>
                </div>

            </fieldset>


            <h3>Bugs?</h3>
            <div>If there is a feature of the script not working, or a feature request, please contact higamy <img
                    width="20px"
                    src="https://cdn.discordapp.com/icons/1196758274767331348/0ada44812ebc04b4ee14048f47381f8b.webp"
                    alt=""> on Discord
                (username is simply "higamy") or in-game (.net server).</div>

            <h3>Features in Development</h3>

            Please contact higamy if you would like any other features or have feedback on which of these to prioritise.

            <ul>
                <li>Avoid sending fangs in night bonus. Currently the script will plan fangs in night bonus (if
                    applicable to world settings).</li>
                <li>Option to filter out tribemate co-ordinates automatically.</li>
                <li>Identify existing fangs after nukes to avoid "over-fanging" a village.</li>
                <li>Support for running from mobile browser.</li>
                <li>Option to include randomised fakes in the attacks -> i.e. if 50 fangs are found, can have the option
                    to add 100 fakes as part of the planned sends (to various coordinates in the coordinate list).</li>
                <li>Option to include nukes as part of the attacks -> i.e. if there are villages with no nukes headed
                    there, option to send nukes (and fangs) as part of the planned attacks.</li>
                <li>User interface improvements.</li>
                <li>Support for translation to other languages.</li>
            </ul>

            <h3>Disclaimer</h3>
            <div>
                <ul>
                    <li>This script has only been recently developed and so may contain bugs!</li>
                    <li>The script does not currently check what the troops in the orange / red attacks are. It would
                        time fangs after a large scout attack for example, this could possibly be a future improvement
                        though is not likely to occur frequently.</li>
                </ul>

            </div>

            <h3>Credits</h3>
            <div>
                Thanks to <b>Red Alert</b> for allowing me to copy a section of code from the Single Village Snipe
                script which collects the troops home in each village.
                <br>
                I have copied no code from <b>Costache</b>'s fake/fang/nuke script, however took inspiration from his
                approach
                and laid
                out the batches of attacks in the same way.
            </div>


            <h3>Changelog</h3>
            <div>
                <ul>
                    <li>v1.0.0 - Initial release</li>
                </ul>
            </div>
        </div>
    </div>

</div>`


    document.body.append(fangFinderUI);
    console.log("Added UI")

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
    divAttackPlan = document.getElementById('divAttackPlan');
    copyAttackPlan = document.getElementById('copyAttackPlan');
    maxNobleTravelTimeHours = document.getElementById('maxNobleTravelTimeHours');
    attackPlanLegend = document.getElementById('attackPlanLegend');
    sendOnlyClosestNoble = document.getElementById('sendOnlyClosestNoble');


    // Collect the Noble speed
    nobleSpeed = settingsData['nobleSpeed'];

    // Group to select

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

        // Collect the list of all units in the game
        let unitList = settingsData['unitList'];
        console.log(unitList);


        // Now add these to the table
        let trUnitIcons = document.querySelector('#trUnitIcons');
        let trUnitsSend = document.querySelector('#trUnitsSend');
        for (let unit of unitList) {

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
            inputUnitSend.setAttribute('settingType', 'numeric');
            inputUnitSend.setAttribute('id', `unit_${unit}`)

            // Build the DOM
            tdUnitSend.appendChild(inputUnitSend);
            trUnitsSend.appendChild(tdUnitSend);
        }

        // Load the saved settings
        loadSettings();

        // Update to store settings when any value is changed
        $('[settingType]').each((i, el) => {
            el.addEventListener('change', () => { storeSettings(); })
        });


        // Get the village list
        // Coordinates section
        const btnCalculateFangs = document.getElementById('btnCalculateFangs');
        btnCalculateFangs.addEventListener('click', () => {
            //loadingScreen.classList.remove('hidden');

            // Store settings
            storeSettings();

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
};

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

    // Tidy up the DOM for new loop
    copyAttackPlan.classList.add('hidden');
    divAttackPlan.innerHTML = '';
    attackPlanLegend.innerHTML = 'Attack Plan';

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

        troopSettings[unitName] = parseInt(unitValue);

        if (parseInt(unitValue) != 0) allTroopsZero = false;
    }

    // Process the SOURCES
    let sourceVillages = await fetchTroopsForCurrentGroup(selectGroupToSendFrom.value); // NEED TO BE DYNAMIC!

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
                print("sendOnlyAfterFinalNuke.checked", sendOnlyAfterFinalNuke.checked)
                if (sendOnlyAfterFinalNuke.checked && endTimes.length > 1) {
                    console.log('Reducing down to only the latest time', endTimes)
                    endTimes = getLatestDate(endTimes);
                    console.log('After filtering', endTimes);
                }

                // Add to the final summary result
                summaryResults.push({
                    data: result['coord'],
                    times: endTimes,
                    lastNukeTime: lastNukeTime,
                    numberOfNukes: largeAttackRows.length
                })

            }
            console.log(summaryResults);

            // Now calculate the noble launch times
            // Get the current date and time
            const now = new Date();


            let possibleSends = [];
            let resultString = "";


            for (let nukeVillage of summaryResults) {
                let nukeNumber = 0;
                console.log("Nuke village", nukeVillage)
                for (let individualNukeTime of nukeVillage['times']) {
                    nukeNumber++;
                    for (let sourceVillage of sourceVillages) {
                        let travelTime = Math.hypot(parseInt(nukeVillage['data'][2]) - sourceVillage['x'], parseInt(nukeVillage['data'][3]) - sourceVillage['y']) * nobleSpeed;
                        let landTime = new Date(now.getTime() + travelTime * 60 * 1000);
                        let launchTime = new Date(individualNukeTime - Math.round(travelTime * 60) * 1000);
                        console.log('Times', individualNukeTime, landTime, travelTime, parseFloat(maxNobleTravelTimeHours.value) * 60)

                        if ((landTime <= individualNukeTime) && (travelTime <= parseFloat(maxNobleTravelTimeHours.value) * 60)) {
                            console.log(landTime);

                            // Calculate what units would be sent

                            // Build the URL
                            url = `game.php?village=${sourceVillage['villageId']}&screen=place&target=${nukeVillage['data'][0]}&snob=1`

                            // Build up the troops string
                            let troopsToSend = {}
                            let totalTroops = 0;
                            for (let troop in troopSettings) {
                                let troopAmount = troopSettings[troop];

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


                            // Add troops to the the URL
                            for (let troop in troopsToSend) {
                                if (troopsToSend[troop] > 0) url = `${url}&${troop}=${troopsToSend[troop]}`;
                            }

                            possibleSends.push({
                                'Launch Time': launchTime,
                                'Launch String': formatDate(launchTime),
                                'Launch Coord': `${sourceVillage['x']}|${sourceVillage['y']}`,
                                'Launch Village ID': sourceVillage['villageId'],
                                'Land Time': individualNukeTime,
                                'Land String': formatDate(individualNukeTime),
                                'Land Coord': `${nukeVillage['data'][2]}|${nukeVillage['data'][3]}`,
                                'Land Village ID': nukeVillage['data'][0],
                                'Nuke Number': nukeNumber,
                                'Number Of Nukes': nukeVillage['numberOfNukes'],
                                'url': url
                            });
                        }
                    }
                }
            }

            possibleSends = possibleSends.sort((a, b) => a['Launch Time'] - b['Launch Time']);

            console.log(possibleSends);

            // Loop again through the sends to figure out how many noble attempts per village
            let nobleNumbers = {}
            for (let nukeSend of possibleSends) {
                if (nukeSend['Land Village ID'] in nobleNumbers) {
                    nobleNumbers[nukeSend['Land Village ID']]++;
                }
                else {
                    nobleNumbers[nukeSend['Land Village ID']] = 1;
                }
                nukeSend['Noble Number'] = nobleNumbers[nukeSend['Land Village ID']];
            }

            // CALCULATE NUMBER OF NOBLES NEEDED PER VILLAGE VS CURRENT - AS A TABLE

            // Build up the attack plan
            numberOfSends = 0;
            for (let nukeSend of possibleSends) {
                // Skip the loop if this is not the last noble, but it is requested to only have the closest noble (the closest noble will be the last launch time)
                if (sendOnlyClosestNoble.checked && (nukeSend['Noble Number'] != nobleNumbers[nukeSend['Land Village ID']])) {
                    console.log('Skipping a loop'); continue;
                }

                numberOfSends++;
                resultString = resultString + `\n[unit]snob[/unit] #${nukeSend['Noble Number']} of ${nobleNumbers[nukeSend['Land Village ID']]}  | [unit]ram[/unit] ${nukeSend['Nuke Number']} of ${nukeSend['Number Of Nukes']}  | ${nukeSend['Launch String']} | ${nukeSend['Land String']} | ${nukeSend['Launch Coord']} ->  ${nukeSend['Land Coord']} | [url=${nukeSend['url']}]Attack[/url]`
            }

            // Copy to clipboard
            console.log("possibleSends", possibleSends);
            console.log("resultString", resultString);
            // Create the string
            attackPlanLegend.innerHTML = `Attack Plan (${numberOfSends})`


            if (possibleSends.length == 0) {
                UI.ErrorMessage("No noble timings found!");
                divAttackPlan.innerHTML = "No possible noble timings found within constraints set. Maybe increase max allowable noble travel time."
            }
            else {
                divAttackPlan.innerHTML = resultString;
                copyAttackPlan.classList.remove('hidden');
                copyAttackPlan.onclick = () => {
                    navigator.clipboard.writeText(resultString)
                    UI.SuccessMessage("Attack plan copied to clipboard.")
                }
            }

        });
}