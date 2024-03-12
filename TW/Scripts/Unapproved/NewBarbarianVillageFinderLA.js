/*
* Script Name: New Barbs Attacker
* Version: 1.0.0
* Last Updated: 10th September 2022
* Author: higamy
* Author URL: 
* Author Contact: higamy#9637 (Discord)
* Approved: 
* Approved Date: 
* Mod: 
* 
* Re-using components from the following script with permission from the author.
* https://twscripts.dev/scripts/barbsFinder.js
* 
*/

/* CHANGE LOG
10th September 2022 - Initial Release - v1.0.0
*/

/* Possible Improvements
Add help / info about the script to the UI.
Add simple tracker for number of times used.
Make the colour formatting of rows light / dark be in sync with the existing rows.
*/

/*--------------------------------------------------------------------------------------
* This script can NOT be cloned and modified without permission from the script author.
--------------------------------------------------------------------------------------*/

// User Input
if (typeof DEBUG !== 'boolean') DEBUG = false;

const LOCAL_STORAGE_NAME = "LABarbFinderConfig";

// Globals
let villages = [];
let barbarians = [];
let canSend = true;
let alreadyFoundCoords = [];
let topRow;
let minDistanceBox;
let maxDistanceBox;
let minPointsBox;
let maxPointsBox;

let config = JSON.parse(localStorage.getItem(LOCAL_STORAGE_NAME));
let numPages = $(window.top.$('#plunder_list_nav tr:first td:last')).find('.paged-nav-item').last().html().replace(/\D+/g, '');

// If no config found then get default
if (config == null) {
    config = {
        "Min Distance": 1,
        "Max Distance": 50,
        "Min Points": 1,
        "Max Points": 9999
    }
}

// CONSTANTS
const VILLAGE_TIME = 'mapVillageTime_higamy'; // localStorage key name
const VILLAGES_LIST = 'mapVillagesList_higamy'; // localStorage key name
const TIME_INTERVAL = 60 * 60 * 1000; // fetch data every hour

// Get the current village ID
let currentURL = window.location.search;
let thisVillageID = currentURL.match(/village=[a-zA-Z]?(\d+)/)[1];
let thisVillageData;

// Check are on the correct page
if (!(currentURL.includes("screen=am_farm"))) {
    UI.SuccessMessage(
        `${('Redirecting to the loot assistant page!')}`,
        2000
    );
    $(location).prop('href', getLootAssistantUrl(0))
}

function getLootAssistantUrl(page = 0) {
    return `/game.php?village=${thisVillageID}&screen=am_farm&Farm_page=${page}`
}

// Create settings table
function addSettingsMenu() {
    let settingsDiv = document.createElement('div');
    settingsDiv.classList.add("am_widget", "vis", "spaced");
    settingsDiv.setAttribute("style", "margin: 15px 0px");

    let helpIcon = document.createElement('img');
    helpIcon.setAttribute('src', 'https://dszz.innogamescdn.com/asset/a978be45/graphic/questionmark.png');
    //helpIcon.setAttribute('style', "background : url('https://dszz.innogamescdn.com/asset/a978be45/graphic/questionmark.png') no-repeat 4px center");
    settingsDiv.appendChild(helpIcon);

    let settingsTitle = document.createElement('span');
    settingsTitle.innerHTML = "Settings";
    settingsDiv.appendChild(settingsTitle);

    minDistanceBox = new ConstraintBox(settingsDiv, 'Min Distance');
    maxDistanceBox = new ConstraintBox(settingsDiv, 'Max Distance');
    minPointsBox = new ConstraintBox(settingsDiv, 'Min Points');
    maxPointsBox = new ConstraintBox(settingsDiv, 'Max Points');

    //<input class="btn btn-recruit" style="float: inherit" type="submit" value="Recruit" tabindex="5">
    const submitBox = document.createElement('input');
    submitBox.setAttribute("type", "submit");
    submitBox.setAttribute("value", "Find Barbs");
    submitBox.setAttribute("style", "margin: 5px");
    submitBox.classList.add("btn");

    submitBox.addEventListener('click', () => {
        localStorage.setItem(LOCAL_STORAGE_NAME, JSON.stringify(config));
        validateConfig();
        removeNewBarbs();
        findBarbarianVillages();
        addNewBarbs();
    })

    settingsDiv.appendChild(submitBox);

    // Add to the document
    let plunderTable = $("#plunder_list")[0];
    plunderTable.parentElement.insertBefore(settingsDiv, plunderTable);
}

class ConstraintBox {
    container;
    inputBox;

    constructor(parentElement, boxName = '') {

        const containerDiv = document.createElement('div');
        containerDiv.setAttribute("style", "padding: 5px");

        const titleText = document.createElement('span');
        titleText.innerHTML = boxName;
        containerDiv.appendChild(titleText);

        const inputBox = document.createElement('input');
        inputBox.setAttribute("type", "number");
        inputBox.setAttribute("style", "margin-left: 5px; max-width: 40px");
        inputBox.setAttribute("value", config[boxName].toString());
        inputBox.setAttribute("min", "1");
        inputBox.setAttribute("max", "9999");
        containerDiv.appendChild(inputBox);

        // On change function to update config
        inputBox.onchange = () => {
            config[boxName] = this.getValue();
        }

        // Add to the DOM
        parentElement.appendChild(containerDiv);

        this.container = containerDiv;
        this.inputBox = inputBox;
    }

    getValue() {
        return parseInt(this.inputBox.value);
    }
}

// Auto-update localStorage villages list
if (localStorage.getItem(TIME_INTERVAL) != null) {
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

function validateConfig() {
    if (config['Min Distance'] > config['Max Distance']) {
        UI.ErrorMessage(
            `${('Min Distance is greater than Max Distance, no villages will be found.')}`,
            2000
        );
        return;
    }

    if (config['Min Points'] > config['Max Points']) {
        UI.ErrorMessage(
            `${('Min Points is greater than Max Points, no villages will be found.')}`,
        );
    }
}

// Fetch 'village.txt' file
function fetchVillagesData() {
    $.get('map/village.txt', function (data) {
        villages = CSVToArray(data);
        localStorage.setItem(VILLAGE_TIME, Date.parse(new Date()));
        //localStorage.setItem(VILLAGES_LIST, data);
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


function getPage(i, pages) {
    window.top.UI.SuccessMessage(`Collecting village list from page ${i} out of ${numPages}`, 1000);
    if (i < pages) {
        var url = getLootAssistantUrl(i);

        console.log(`getting page ${i}`)

        window.top.$.ajax({
            type: 'GET', url: url, dataType: "html", error: function (xhr, statusText, error) {
                console.log("Get page failed with error: " + error);
            }, success: function (data) {

                $(data).find("#plunder_list > tbody > tr[id] > td:nth-of-type(4)").each((i, el) => {
                    let coords = el.innerText.match(/\d+\|\d+/)[0].split("|");
                    alreadyFoundCoords.push(coords);
                });
                setTimeout(function () {
                    getPage(i + 1, pages);
                }, 1);
            }
        });
    } else {
        // All pages loaded
        setTimeout(function () {
            addSettingsMenu();
        }, 1);

    }
}

function findExistingVillages() {
    alreadyFoundCoords = [];
    // Recursively loop through each page to collect all the already known coordinates
    getPage(0, numPages);
}

function init() {

    // Filter out only Barbarian villages
    thisVillageData = getVillageData(`${thisVillageID}`);
    findExistingVillages();

    topRow = $("#plunder_list > tbody > tr[id]")[0];
    if (topRow === undefined) {
        window.top.UI.ErrorMessage("There must be at least one existing row to run this script.\nAttack a barbarian village manually first.", 4000);
    }
}

function removeNewBarbs() {
    $(".newBarbRow").remove();
}

let newRow;


if (mobile) {
    let tableBody = $('#plunder_list').children()[0];
    let veryTopRow = $(tableBody).children()[0];


    // Add the new row
    newRow = document.createElement('tr');
    veryTopRow.after(newRow)

    $(tableBody).children().slice(2, 5).each((i, el) => {
        newRow.appendChild(el);
    })

}

function addNewBarbs() {
    for (let idx in barbarians) {
        // Simplest to add new rows by duplicating the previous top row

        if (mobile) {
            let tableBody = $('#plunder_list').children()[0];
            let veryTopRow = $(tableBody).children()[0];

            $(tableBody).children().slice(1, 4).each((i, el) => {
                console.log(el)
                //veryTopRow.after(el)
            })
        }
        else {
            console.log('Not mob')
            newRow = topRow.cloneNode(true);
            newRow.classList.add('newBarbRow');
        }


        // Colour it appropriately
        if (idx % 2 == 0) newRow.classList.add('row_b');

        // Find the loot assistant template numbers for the A and B button
        const aButton = $(newRow).find('.farm_icon_a')[0]
        const aButtonURL = aButton.getAttribute('onclick');
        const bButton = $(newRow).find('.farm_icon_b')[0]
        const bButtonURL = bButton.getAttribute('onclick');

        // Update the class list of the A and B button
        applyClasses(aButton, [`farm_village_${barbarians[idx][0]}`, "farm_icon", "farm_icon_a"]);
        applyClasses(bButton, [`farm_village_${barbarians[idx][0]}`, "farm_icon", "farm_icon_b"]);

        const aButtonTemplate = getTemplateIDFromUrl(aButtonURL);
        const bButtonTemplate = getTemplateIDFromUrl(bButtonURL);

        aButton.onclick = (el) => {
            console.log('sending farm')
            el.preventDefault(); // Stop scrolling to the top
            Accountmanager.farm.sendUnits(this, barbarians[idx][0], aButtonTemplate);
            aButton.parentElement.parentElement.remove();
        }
        bButton.onclick = (el) => {
            el.preventDefault(); // Stop scrolling to the top
            Accountmanager.farm.sendUnits(this, barbarians[idx][0], bButtonTemplate);
            bButton.parentElement.parentElement.remove();
        }
        // bButton.setAttribute('onclick', newBButtonUrl);

        $(newRow).find('td:nth-of-type(4)')

        // Remove the already being attacked symbol
        $(newRow).find('td:nth-of-type(4) > img').each((i, el) => {
            el.remove();
        })

        // Populate some columns
        // If has the red x to delete all reports for this village then remove it
        let redX = $($(newRow).find('td:nth-of-type(1)')[0]).find('a')[0];
        if (redX) redX.remove();


        $($(newRow).find('td:nth-of-type(2)')[0]).find('img')[0].setAttribute('src', 'https://dsen.innogamescdn.com/asset/f0f06311/graphic/dots/grey.png');

        // There may or may not be a previous loot symbol available to update.
        try {
            $($(newRow).find('td:nth-of-type(3)')[0]).find('img')[0].setAttribute('src', 'https://dsen.innogamescdn.com/asset/f0f06311/graphic/max_loot/0.png');
        }
        catch { }


        // Link to the village
        $(newRow).find('td:nth-of-type(4) > a')[0].innerText = `(${barbarians[idx][2]}|${barbarians[idx][3]}) [${barbarians[idx][5]} pts]`
        $(newRow).find('td:nth-of-type(4) > a')[0].setAttribute('href', `/game.php?screen=info_village&id=${barbarians[idx][0]}`)

        $(newRow).find('td:nth-of-type(5)')[0].innerText = 'Never'
        $(newRow).find('td:nth-of-type(6)')[0].innerText = '?'
        $(newRow).find('td:nth-of-type(7)')[0].innerText = '?'
        $(newRow).find('td:nth-of-type(8)')[0].innerText = calculateDistance([thisVillageData[2], thisVillageData[3]], [barbarians[idx][2], barbarians[idx][3]])

        // If has the C button then remove
        let cButton = $($(newRow).find('td:nth-of-type(11)')[0]).find('a')[0];
        if (cButton) cButton.remove();

        // Update the rally point icon
        $($(newRow).find('td:nth-of-type(12)')[0]).find('a')[0].setAttribute('href',
            `/game.php?village=${thisVillageID}&screen=place&target=${barbarians[idx][0]}`)
        $($(newRow).find('td:nth-of-type(12)')[0]).find('a')[0].setAttribute('onclick',
            `Accountmanager.farm.openRallyPoint(${barbarians[idx][0]}, event)`)

        topRow.parentNode.insertBefore(newRow, topRow);


    }

    canSend = true;
}

function applyClasses(button, classesToAdd) {
    button.removeAttribute('class');
    for (let cl of classesToAdd) button.classList.add(cl);
}

var keycodes = { "a": 65, "b": 66, "c": 67, "skip": 83, "right": 39, "left": 37, "master": 77 };

// Turn off the normal key presses
window.top.$(document).off();

window.onkeydown = function (e) {
    e.stopPropagation();


    var row = $("#plunder_list > tbody > tr[id]")[0];
    var aButton = $($(row).find('td:nth-of-type(9)')[0]).find('a')[0]
    var bButton = $($(row).find('td:nth-of-type(10)')[0]).find('a')[0]
    var cButton = $($(row).find('td:nth-of-type(11)')[0]).find('a')[0]
    switch (e.which) {

        case keycodes.a:
            tryClick(aButton);
            break;
        case keycodes.b:
            tryClick(bButton);
            break;
        case keycodes.c:
            tryClick(cButton);
            break;
        case keycodes.skip:
            row.hide();
            break;
        case keycodes.left:
            getNewVillage("p");
            break;
        case keycodes.right:
            getNewVillage("n");
            break;
        default:
            return;
    }
};

const delayBetweenSends = 501
function tryClick(button) {

    console.log('blah')
    let n = Timing.getElapsedTimeSinceLoad();
    if (canSend && !(Accountmanager.farm.last_click && n - Accountmanager.farm.last_click < delayBetweenSends)) {

        if (button.classList.contains("farm_icon_disabled")) {

            window.top.UI.ErrorMessage("That button is not selectable. Skipping row...", 500);
        }
        else {
            console.log("Removing button");
            button.click();
            button.parentElement.parentElement.remove()
            window.top.UI.SuccessMessage('Troops sent.')
            doTime(delayBetweenSends, button);
        }

    }
    else {
        console.log("Not time yet.");
    }
}

function doTime(millsec, button) {
    canSend = false;
    setTimeout(function () {
        canSend = true;
        //button.parentElement.parentElement.remove()
    }, millsec);
}
function getCurrentVillageFromUrl(urlIn) {
    let firstComma = urlIn.indexOf(",")
    let lastComma = urlIn.lastIndexOf(",")
    let thisVillageID = urlIn.slice(firstComma + 1, lastComma)

    return parseInt(thisVillageID)
}

function getTemplateIDFromUrl(urlIn) {
    let lastComma = urlIn.lastIndexOf(",")
    let lastBracket = urlIn.lastIndexOf(")")
    let templateUrl = urlIn.slice(lastComma + 1, lastBracket)

    return parseInt(templateUrl)
}


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


// Populate villages list
function findBarbarianVillages() {

    let distances = [];
    barbarians = [];

    villages.forEach((village) => {
        if (village[4] == '0') {

            // Check if village already found
            let villageAlreadyAttacked = false;
            for (let foundVillage of alreadyFoundCoords) {
                if ((foundVillage[0] == village[2]) & (foundVillage[1] == village[3])) villageAlreadyAttacked = true;
            }

            if (!villageAlreadyAttacked) {
                let distance = calculateDistance([thisVillageData[2], thisVillageData[3]], [village[2], village[3]]);
                let points = parseInt(village[5]);

                // Only add the village if within the constraints.
                if ((distance >= minDistanceBox.getValue()) &&
                    (distance <= maxDistanceBox.getValue()) &&
                    (points >= minPointsBox.getValue()) &&
                    (points <= maxPointsBox.getValue())) {
                    village.push(distance);
                    barbarians.push(village);
                    distances.push(distance);
                }
            }
        }
    });

    barbarians.sort((a, b) => a.slice(-1) - b.slice(-1));

    if (DEBUG) {
        console.debug(`${scriptInfo()} Barbarian Villages:`, barbarians);
    }
}

// Helper: Calculate distance between 2 villages
function calculateDistance(from, to) {
    const [x1, y1] = from;
    const [x2, y2] = to;
    const deltaX = Math.abs(x1 - x2);
    const deltaY = Math.abs(y1 - y2);
    let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    distance = parseFloat(distance.toFixed(1));
    return distance;
}

function getVillageData(villageID) {
    let villageIDs = []
    for (let village of villages) {
        villageIDs.push(village[0]);
    }

    idx = villageIDs.indexOf(villageID);
    if (idx > -1) {
        return villages[idx]
    }
}