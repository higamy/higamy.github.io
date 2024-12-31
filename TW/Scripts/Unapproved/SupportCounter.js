const INCOMING_SUPPORT_COUNTER_VERSION = "1.0.0";
const WORLD_SETTINGS = 'worldSettings_higamy'; // localStorage key name

let PAUSE_BETWEEN_REQUESTS = 200;
let promises = [];
let unitCountsBlank = {};
let unitCountsInitial = {};

let unit_pop_counts = {
    'sword': 1,
    'spear': 1,
    'archer': 1,
    'heavy': 4
}

let unitNames = {
    'sword': 'Swordsmen',
    'spear': 'Spear fighters',
    'archer': 'Archers',
    'axe': 'Axemen',
    'spy': 'Scouts',
    'light': 'Light Cavalry',
    'heavy': 'Heavy Cavalry',
    'marcher': 'Mounted Archers',
    'ram': 'Rams',
    'catapult': 'Catapults',
    'snob': 'Noblemen',
    'knight': 'Paladins'
}

// Add a new header bar
const newHeader = document.createElement('th');
newHeader.innerHTML = 'Total Def Pop';
$('.command-row').first().prev().prepend(newHeader);

let allSupInc = $('.command-row');
let numberEls = allSupInc.length;
numberEls = 10; // Cap for testing

console.log(numberEls);
console.log(allSupInc);
let totalPop = 0;

// Get units
if (localStorage.getItem(WORLD_SETTINGS) == null) {
    $.get('interface.php?func=get_unit_info', function (unitData) {
        console.log("unitData", unitData)

        let unitList = [];
        let nameItems = unitData.children[0].children;
        for (let unit of nameItems) {
            if ((unit['tagName'] != 'snob') && (unit['tagName'] != 'militia'))
                unitList.push(unit['tagName'])
        }

        let settingsData = {
            'scriptVersion': INCOMING_SUPPORT_COUNTER_VERSION,
            'unitList': unitList,
        }

        console.log("world settings", settingsData)
        // Store the settings
        localStorage.setItem(WORLD_SETTINGS, JSON.stringify(settingsData));

        // Now the settings are available, run the main script
        createBlankUnitCountTemplate(settingsData['unitList']);
        addSupportTotals(0);
    })
}
else {
    let settingsData = JSON.parse(localStorage.getItem(WORLD_SETTINGS));
    console.log("Loaded world settings!", settingsData);

    // Now the settings are available, run the main script
    createBlankUnitCountTemplate(settingsData['unitList']);
    addSupportTotals(0);
}


function createBlankUnitCountTemplate(unitList) {
    for (let unit of unitList) {
        unitCountsBlank[unit] = 0;
    }

    // Find the existing unit count values
    let unitTableBody = $('#unit_overview_table > tbody')[0];

    $('#unit_overview_table > tbody [data-count]').each((i, el) => {
        console.log(i, el);
        unitCountsInitial[el.getAttribute('data-count')] = parseInt(el.innerHTML);
    })

    // Add missing units to the table
    const missingUnits = Object.keys(unitCountsBlank).filter(key => !(key in unitCountsInitial));
    console.log("missingUnits", missingUnits);

    for (let missingUnit of missingUnits) {
        const newTr = document.createElement('tr');
        newTr.classList.add('all_unit');

        const newTd = document.createElement('td');
        newTr.appendChild(newTd);

        const newA = document.createElement('a');
        newA.setAttribute('href', '#');
        newA.classList.add('unit_link');
        newA.setAttribute('data-unit', missingUnit);

        const newImg = document.createElement('img');
        newImg.setAttribute('src', `/graphic/unit/unit_${missingUnit}.png`)
        newImg.classList.add('data-title');
        newA.append(newImg);
        newTd.appendChild(newA);

        const newStrong = document.createElement('strong');
        newStrong.setAttribute('data-count', missingUnit);
        newStrong.innerHTML = 0;
        newTd.appendChild(newStrong);

        const newText = document.createElement('span');
        newText.innerHTML = missingUnit;
        newTd.appendChild(newText);

        unitTableBody.prepend(newTr);
    }
}


// Recursive
function addSupportTotals(elNumber) {
    // Return if finished
    if (elNumber > numberEls) return;
    let el = allSupInc[elNumber];

    let urlString = new URLSearchParams($(el).find('.quickedit-content').find('a')[0].getAttribute('href'));
    let commandID = urlString.get('id');
    console.log(commandID);

    $.get(`game.php?screen=info_command&ajax=details&id=${commandID}`, function (data) {
        const newEl = document.createElement('td');

        for (const [key, value] of Object.entries(unit_pop_counts)) {
            if (key in data['units']) {
                totalPop += data['units'][key]['count'] * value;
            }
        }   
        let totalPopFormatted;
        if (totalPop < 1000) totalPopFormatted = totalPop; else totalPopFormatted = `${Math.floor(totalPop / 100) / 10}k`;
        newEl.innerHTML = totalPopFormatted;
        newEl.style = 'font-weight: bold';
        el.prepend(newEl);
        console.log(data);
        // Check for errors

        // Use setTimeout to add a delay before the next recursive call
        setTimeout(() => addSupportTotals(elNumber + 1), PAUSE_BETWEEN_REQUESTS);
    })
        .fail(function (error) {
            console.error(`Error:`, error);
            UI.ErrorMessage(    
                `${('Error getting data!')}`,
                4000
            );  
            reject(error);
        });

}


/*



let PAUSE_BETWEEN_REQUESTS = 300;
let promises = [];

let unit_pop_counts = {
    'sword': 1,
    'spear': 1,
    'archer': 1,
    'heavy': 4
}

// Add a new header bar
const newHeader = document.createElement('th');
newHeader.innerHTML = 'Total Pop';
$('.command-row').first().prev().prepend(newHeader);

$('.command-row').each((index, el) => {
    el.addEventListener('click', () => {

    });


    const customPromise = new Promise((resolve, reject) => {

        setTimeout(() => {
            console.log(el);

            let urlString = new URLSearchParams($(el).find('.quickedit-content').find('a')[0].getAttribute('href'));
            let commandID = urlString.get('id');
            console.log(commandID);

            $.get(`game.php?screen=info_command&ajax=details&id=${commandID}`, function (data) {
                const newEl = document.createElement('td');
                let totalPop = 0;
                for (const [key, value] of Object.entries(unit_pop_counts)) {
                    if (key in data['units']) {
                        totalPop += data['units'][key]['count'] * value;
                    }
                }
                newEl.innerHTML = totalPop;
                el.prepend(newEl);
                console.log(data);
                resolve(data);
            })
                .done(function () {

                })
                .fail(function (error) {
                    console.error(`Error:`, error);
                    UI.ErrorMessage(
                        `${tt('Error getting data!')}`,
                        4000
                    );
                    reject(error);
                });
        }, index * PAUSE_BETWEEN_REQUESTS);

    });
    promises.push(customPromise)
})

Promise.all(promises)
    .then(results => {
        // All promises have resolved
        console.log('All requests are complete');
        console.log('Results:', results);
    });

*/