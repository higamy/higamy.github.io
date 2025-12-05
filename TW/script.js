/*
IDEAS

Python script needs to get all pages, not just page 1 (most recent data)
Search works with tribe tag (as well as name)
Add tribe tag
Add flag of the server
Option to average the tribes
Make custom groupings for average?
Custom selectors -> top N in that ranking across the world
API counter
Helper text on checkbox hover
Link text on checkbox to value - remove span and use description attribute?
Animations on hide / show elements?
Thicker line for tribe averages?
Option to hide a selector without deleting it so can toggle on / off without having to find it again

Backend tasks

Detect if a world is closed and remove from config
*/

// Update counter
// Note - I have put an API key here, but this is a free account so you can steal / use my API key but it's
// pretty pointless as it will cost me nothing and you could make your own free account =)
$.ajax({
    method: 'GET',
    url: 'https://api.api-ninjas.com/v1/counter?id=TW_main&hit=true',
    headers: { 'X-Api-Key': 'tfrjXwZ7ENQ/FwMoOdJZ3g==6Mt1bO9Uksf8o3LO' },
    contentType: 'application/json',
    success: function (result) {
        console.log(result);
    },
    error: function ajaxError(jqXHR) {
        console.error('Error: ', jqXHR.responseText);
    }
});

// Constants
const githubLocation = 'https://higamy.github.io/TW/Data';
const availableStatistics = ['Points', 'Rank', 'Villages', 'OD', 'ODA', 'ODD', 'Daily Defend', 'Daily Attack', 'Daily Support', 'Daily Loot Amount', 'Daily Loot Villages', 'Daily Scavenge', 'Combined Income', 'Daily Conquer'];
const colourRandomSeed = 42;

// DOM Elements
const statisticSelector = document.getElementById("statisticSelector");
const statisticsDropdownOptions = document.getElementById("statisticsDropdownOptions");
const serverSelector = document.getElementById("serverSelector");
const serverSelectorDropdownOptions = document.getElementById("serverSelectorDropdownOptions");
const worldSelector = document.getElementById("worldSelector");
const worldSelectorDropdownOptions = document.getElementById("worldSelectorDropdownOptions");

const serverContainerEl = document.getElementById("serverContainer");
const worldContainerEl = document.getElementById("worldContainer");
const graphAdder = document.getElementById("graphAdder");
const tribePopupContainer = document.getElementById("tribePopupContainer");
const plotContainer = document.getElementById("plotContainer");
const selectedGroupsContainer = document.getElementById("selectedGroupsContainer");

const groupTribeDiv = document.getElementById("groupTribeDiv");
const groupTribeCheckbox = document.getElementById("groupTribeCheckbox");
const groupTypeCheckbox = document.getElementById("groupTypeCheckbox");
const groupTypeDiv = document.getElementById("groupTypeDiv");

const topPlayersSection = document.getElementById("topPlayersSection");
const topPlayersButtonContainer = document.getElementById("topPlayersButtonContainer");


let serverSelectors = [];
let selectedPlayers = [];
let selectedGroups = [];
let saved_data = {};
let selectedData = {};
let current_data;
let activeGroupSelector;
let activeWorldButton;
let topPlayerData = {};

// Load metric from query string
let selectedMetric = getQueryParam("metric");
if (!selectedMetric) selectedMetric = availableStatistics[0];


console.log(selectedMetric)

let groupTribe = getQueryParam('groupTribe') === "true";
groupTribeCheckbox.checked = groupTribe;

let groupType = getQueryParam('groupType');
if (!groupType) groupType = "total";
groupTypeCheckbox.checked = groupType == "avg";

axios.get(`${githubLocation}/Config/tribes.json`)
    .then(data => {
        data = data.data
        console.log(data)

        for (let serverConfig of data.servers) {
            serverSelectors.push(new ServerSelector(serverConfig));
            saved_data[serverConfig['server']] = {}
        }

        // Load the server to use from the query paramter
        let server = getQueryParam('server');

        let loadedServer = false;
        for (let serverSelector of serverSelectors) {

            if (serverSelector.serverConfig.domain_game == server) {
                serverSelector.activateServer();
                loadedServer = true;
                console.log('loaded server', serverSelector)
            }
        }

        // If a server was not found in the query parameter then just load the first one
        if (!loadedServer) { serverSelectors[0].activateServer(); }

    })

// Written by ChatGPT!
function getDistinctColors(n, seed) {
    var colors = [];
    var i = 0;
    var random = new Math.seedrandom(seed); // initialize the seeded random number generator
    while (colors.length < n) {
        var color = '#' + Math.floor(random() * 16777215).toString(16); // generate a random hex code using the seeded random number generator
        if (color !== '#ffffff' && color !== '#fff' && color !== '#f5f5f5' && color !== '#f8f8f8' && color !== '#fcfcfc') { // check if the color is not close to white
            colors.push(color);
        }
        i++;
        if (i > 1000) { // add a safety net to prevent infinite loop
            break;
        }
    }
    return colors;
}


function getTopNPlayers(n = 10, metric = "current_points") {
    // Filter out players that don't have the metric
    let playersWithMetric = current_data['players'].filter(player => player[metric] != null && player[metric] !== undefined);

    // Sort by the metric (descending)
    let topPlayers = playersWithMetric.sort(function (a, b) {
        return b[metric] - a[metric];
    });

    console.log("result: ", metric, topPlayers.slice(0, n))
    return topPlayers.slice(0, n)
}

function createTopPlayersButtons() {
    // Clear existing buttons
    topPlayersButtonContainer.innerHTML = "";

    // Show the section
    topPlayersSection.classList.remove("hidden");

    // Create a button for each metric
    for (let statistic of availableStatistics) {
        const button = document.createElement('button');
        button.classList.add('btn', 'btn-outline-primary', 'btn-sm', 'm-1');
        button.innerHTML = `Top 10 ${statistic}`;

        button.addEventListener('click', () => {
            // Get the top 10 players for this metric
            let metricKey = `current_${statistic.toLowerCase()}`;
            let topPlayers = getTopNPlayers(10, metricKey);

            if (topPlayers.length > 0) {
                // Create a group selector with the top players
                let groupName = `Top 10 ${statistic}`;
                new GroupSelector(groupName, topPlayers, Group.TOP_PLAYERS).selectGroup();
            } else {
                console.warn(`No players found with metric: ${statistic}`);
            }
        });

        topPlayersButtonContainer.appendChild(button);
    }
}


class ServerSelector {
    serverConfig
    worldDropDowns
    server

    constructor(serverConfig) {
        this.serverConfig = serverConfig;
        this.server = serverConfig['server'];

        const dropDownOption = new DropDownOption(serverSelector, serverSelectorDropdownOptions, serverConfig['domain_game']);
        dropDownOption.link.addEventListener("click", () => this.activateServer())
    }

    activateServer() {
        serverSelector.innerHTML = this.serverConfig['domain_game']

        let qryParamWorld = getQueryParam('world');
        let loadedWorld = false;

        worldSelectorDropdownOptions.innerHTML = ""; // Clear previous options
        this.worldDropDowns = []
        for (let world of this.serverConfig.worlds) {
            const dropDownOption = new DropDownOption(worldSelector, worldSelectorDropdownOptions, world);
            this.worldDropDowns.push(dropDownOption);
            dropDownOption.link.addEventListener("click", () => { this.activateWorld(world) })

            if (qryParamWorld == world) {
                dropDownOption.activate();
                this.activateWorld(world);
                loadedWorld = true;
            }
        }



        // If a world was not found in the query parameter then just load the first one
        if (!loadedWorld) {
            this.worldDropDowns[0].activate();
            this.activateWorld(this.serverConfig.worlds[0]);
        }

        resetGraphAdder();
        removeAllSelectedGroups();
        updateQueryParams('server', this.serverConfig['domain_game'])
    }

    activateWorld(world) {
        clearChart();
        resetGraphAdder();
        removeAllSelectedGroups();
        updateQueryParams('world', world)

        // Get the data - if not retrieved already
        new Promise((resolve, reject) => {

            if (saved_data[this.server][world]) {
                resolve(saved_data[this.server][world]);
            }
            else {
                graphAdder.placeholder = "Loading data, please wait..."
                graphAdder.disabled = true;

                axios.get(`${githubLocation}/${this.server}/${world}/tribes.json`)
                    .then(data => {
                        data = data.data;

                        // Add total income (farm + scav)
                        for (let player of data.players) {
                            if ((!("Daily Scavenge" in player)) & (!("Daily Loot Amount" in player))) {
                                player['Combined Income'] = Array(player.dates.length).fill(0);
                            }
                            else if ((("Daily Scavenge" in player)) & (!("Daily Loot Amount" in player))) {
                                player['Combined Income'] = player["Daily Scavenge"]
                            }
                            else if ((!("Daily Scavenge" in player)) & (("Daily Loot Amount" in player))) {
                                player['Combined Income'] = player["Daily Loot Amount"]
                            }
                            else {
                                player['Combined Income'] = player["Daily Scavenge"].map((element, index) => {
                                    if (element === null) return null;
                                    else return element + player["Daily Loot Amount"][index];
                                });

                            }

                            player["current_combined income"] = player['Combined Income'].filter(arg => arg != null).slice(-1)[0]
                        }

                        console.log(data);
                        saved_data[this.server][world] = data;

                        current_data = data;

                        // Calculate the data for the top players in each category
                        topPlayerData = {};
                        let n = 10;
                        for (let topPlayerType of availableStatistics) {
                            let matchingTopData = getTopNPlayers(n, `current_${topPlayerType.toLowerCase()}`);
                            let groupName = `Top ${n} ${topPlayerType}`;
                            let dataOut = {
                                "Name": groupName,
                                "Data": matchingTopData
                            }
                            topPlayerData[topPlayerType] = dataOut;
                        }


                        // Data has loaded, so enable the search bar again
                        graphAdder.placeholder = "Start typing a player or tribe name..."
                        graphAdder.disabled = false;

                        // Create the top players buttons
                        createTopPlayersButtons();

                        resolve(data);
                    })
            }
        }).then((data) => {



            let tribeList = data.tribes.map(function (value) {
                return value.tribe;
            });

            let playerList = data.players.map(function (value) {
                return value.name;
            });

            graphAdder.oninput = () => {
                // Remove the previous tribe elements
                tribePopupContainer.innerHTML = "";

                if (graphAdder.value == "") return;

                // Add Tribes
                let matchingTribes = tribeList.filter((x) => {
                    return x.toLowerCase().includes(graphAdder.value.toLowerCase());
                })


                matchingTribes.forEach((tribe, i) => {
                    // Find the matching tribe in all the data
                    let matchingTribeData = data.tribes.filter((x) => {
                        return x.tribe == tribe;
                    })
                    new GroupSelector(tribe, matchingTribeData[0], Group.TRIBE);
                });


                // Add players
                let matchingPlayers = playerList.filter((x) => {
                    return x.toLowerCase().includes(graphAdder.value.toLowerCase());
                })


                matchingPlayers.forEach((name, i) => {
                    // Find the matching tribe in all the data
                    let matchingPlayerData = data.players.filter((x) => {
                        return x.name == name;
                    })
                    new GroupSelector(name, matchingPlayerData[0], Group.PLAYER);
                });


                // Add top 10
                // Comment out for now as not ready
                //for (let topPlayerType of availableStatistics){
                //    new GroupSelector(topPlayerData[topPlayerType]["Name"], topPlayerData[topPlayerType], Group.TOP_PLAYERS);
                //}
            }

            // Load anything selected in the query string
            let queryParamTribes = getQueryParam('tribes');
            let queryParamPlayers = getQueryParam('players');

            if (queryParamTribes) {
                queryParamTribes = queryParamTribes.split("_");
                queryParamTribes.forEach((tribe, i) => {
                    // Find the matching tribe in all the data
                    let matchingTribeData = data.tribes.filter((x) => {
                        return x.id == tribe;
                    })
                    new GroupSelector(matchingTribeData[0].tribe, matchingTribeData[0], Group.TRIBE).selectGroup();
                });

            }

            // Load anything selected in the query string

            console.log(queryParamPlayers)
            if (queryParamPlayers) {
                queryParamPlayers = queryParamPlayers.split("_");

                queryParamPlayers.forEach((player, i) => {
                    // Find the matching player in all the data
                    let matchingPlayerData = data.players.filter((x) => {
                        return x.id == player;
                    })
                    new GroupSelector(matchingPlayerData[0].name, matchingPlayerData[0], Group.PLAYER).selectGroup();
                });
            }

            // Load top groups from query string
            let queryParamTopGroups = getQueryParam('topGroups');
            if (queryParamTopGroups) {
                queryParamTopGroups = queryParamTopGroups.split("_");

                queryParamTopGroups.forEach((statistic, i) => {
                    // Get the top 10 players for this metric
                    let metricKey = `current_${statistic.toLowerCase()}`;
                    let topPlayers = getTopNPlayers(10, metricKey);

                    if (topPlayers.length > 0) {
                        // Create a group selector with the top players
                        let groupName = `Top 10 ${statistic}`;
                        new GroupSelector(groupName, topPlayers, Group.TOP_PLAYERS).selectGroup();
                    } else {
                        console.warn(`No players found with metric: ${statistic}`);
                    }
                });
            }
        })
    }
}

function getQueryParam(paramName) {

    // Get the current URL
    const url = new URL(window.location.href);

    // Get the search parameters
    const searchParams = url.searchParams;

    // Retrieve the parameter value
    //return searchParams.get(paramName).toString().replace("_", ".");
    return searchParams.get(paramName)
}

function updateQueryParams(paramName, paramValue) {
    // Function to update the URL the user is on to have the right query params
    // So that can refresh and the same plot will appear
    // So that can share links with query params set up and plot will show right away


    // Get the current URL
    const url = new URL(window.location.href);

    // Get the search parameters
    const searchParams = url.searchParams;

    // Update or add a parameter
    // If it is empty then delete it
    if (paramValue === "") {
        searchParams.delete(paramName);
    }
    else {
        searchParams.set(paramName, paramValue);
    }

    // Replace the existing query string with the updated parameters
    url.search = searchParams.toString();

    // Create a new history state with the updated URL
    const newUrl = url.href;
    window.history.replaceState({ path: newUrl }, '', newUrl);
}

function removeAllSelectedGroups() {
    console.log("Selected groups", selectedGroups);
    for (let group of selectedGroups.slice().reverse()) {
        group.Container.removeGroup();
    }
    selectedGroups = [];
}

class DropDownOption {
    link
    selector
    text

    constructor(selector, parent, text = "") {
        const newOption = document.createElement("li");
        const newLink = document.createElement("a");
        newLink.setAttribute("class", "dropdown-item");
        newLink.setAttribute("href", "javascript:void(0)");

        newLink.innerHTML = text;

        newLink.addEventListener("click", () => { this.activate() })

        // Build the DOM
        newOption.appendChild(newLink);
        parent.appendChild(newOption);

        // Store properties
        this.link = newLink;
        this.selector = selector;
        this.text = text;
    }

    activate() {
        this.selector.innerHTML = this.text

        /* Need to make subclass of this only for the world selector that stores the server and the world, or just add the below function when the world gets created higher up */

    }


}

class ServerContainer {
    worldSelectorContainer
    serverButton
    server
    worldButtons

    constructor(serverConfig) {
        this.worldButtons = []
        this.server = serverConfig['server']


        const worldSelectorContainer = document.createElement('div');
        this.worldSelectorContainer = worldSelectorContainer;
        worldSelectorContainer.classList.add("even-spacing");
        for (let world of serverConfig.worlds) {
            this.worldButtons.push(new WorldButton(this, world));
        }

        serverButton.addEventListener('click', () => {
            for (let serverSelector of serverSelectors) serverSelector.deactivate();
            this.activate();
        })

        // Build up the DOM        
        worldContainerEl.appendChild(worldSelectorContainer);
        serverContainerEl.appendChild(serverButton);

        // Hide by default
        this.deactivate();
    }

    activate() {
        this.serverButton.classList.remove('btn-secondary');
        this.serverButton.classList.add('btn-primary');
        this.worldSelectorContainer.classList.remove('hidden');
        this.worldButtons[0].activate();
        resetGraphAdder();
    }

    deactivate() {
        this.serverButton.classList.add('btn-secondary');
        this.serverButton.classList.remove('btn-primary');
        this.worldSelectorContainer.classList.add('hidden');
    }

    deactiveAllButtons() {
        for (let button of this.worldButtons) {
            button.deactivate();
        }
    }
}

class SelectedGroupContainer {
    InputGroup
    GroupContainer

    constructor(inputGroup) {
        this.InputGroup = inputGroup;
        console.log(inputGroup);
        const groupContainer = document.createElement('div');
        this.GroupContainer = groupContainer;
        groupContainer.classList.add('groupContainer');

        const groupText = document.createElement('span');
        groupText.classList.add('groupText');
        groupText.innerHTML = inputGroup.Name;

        if (inputGroup.Type == Group.PLAYER) {
            groupContainer.classList.add("playerContainer")
        } else if (inputGroup.Type == Group.TOP_PLAYERS) {
            groupContainer.classList.add("topPlayersContainer")
        }

        const removeGroupButton = document.createElement('span');
        removeGroupButton.classList.add('removeGroupButton');
        removeGroupButton.innerHTML = '❌';

        removeGroupButton.addEventListener('click', () => {
            this.removeGroup();
        })



        groupContainer.appendChild(groupText);
        groupContainer.appendChild(removeGroupButton);
        selectedGroupsContainer.appendChild(groupContainer);
    }

    removeGroup() {
        console.log("Removing... ", this)

        // Remove this group from the selected ones
        let index = selectedGroups.indexOf(this.InputGroup);
        if (index > -1) {
            selectedGroups.splice(index, 1);
        }


        updatePlayerList();
        resetGraphAdder();
        redrawChart();
        updateGroupsInQueryString();

        // Update UI
        selectedGroupsContainer.removeChild(this.GroupContainer);
    }

}

class WorldButton {
    world
    server
    button
    serverContainer
    data

    constructor(ServerContainer, world) {

        this.serverContainer = ServerContainer;

        const worldButton = document.createElement('button');
        this.button = worldButton
        worldButton.classList.add('btn', 'btn-secondary');
        worldButton.innerHTML = world;

        ServerContainer.worldSelectorContainer.appendChild(worldButton);

        worldButton.addEventListener('click', () => this.activate())

        this.world = world
        this.server = ServerContainer.server
    }

    activate() {
        clearChart();
        resetGraphAdder();

        this.serverContainer.deactiveAllButtons();

        // Update styles
        this.button.classList.add('btn-info');
        this.button.classList.remove('btn-secondary');

        // Get the data - if not retrieved already
        new Promise((resolve, reject) => {

            if (this.data) {
                resolve('Data loaded from previous save.');
            }
            else {
                axios.get(`${githubLocation}/${this.server}/${this.world}/tribes.json`)
                    .then(data => {
                        data = data.data;
                        console.log(data);
                        this.data = data;
                        resolve('Data retrieved via XHR.');
                    })
            }
        }).then((message) => {
            //console.log(message);
            let tribeList = this.data.tribes.map(function (value) {
                return value.tribe;
            });
            //console.log(tribeList);

            graphAdder.oninput = () => {
                // Remove the previous tribe elements
                tribePopupContainer.innerHTML = "";

                if (graphAdder.value == "") return;

                let matchingTribes = tribeList.filter((x) => {
                    return x.toLowerCase().startsWith(graphAdder.value.toLowerCase());
                })


                matchingTribes.forEach((tribe, i) => {
                    // Find the matching tribe in all the data
                    let matchingTribeData = this.data.tribes.filter((x) => {
                        return x.tribe == tribe;
                    })
                    new GroupSelector(tribe, matchingTribeData[0]);
                });
            }
        })

    }

    deactivate() {
        // Update styles
        this.button.classList.remove('btn-info');
        this.button.classList.add('btn-secondary');
    }
}

function resetGraphAdder() {
    graphAdder.value = "";
    var event = new Event('input', {
        bubbles: true,
        cancelable: true,
    });

    graphAdder.dispatchEvent(event);
}

function clearChart() {
    plotContainer.innerHTML = "";
}

const Group = {
    TRIBE: "tribe",
    PLAYER: "player",
    TOP_PLAYERS: "top players"
}

class GroupSelector {
    Name
    Data
    PlayerData
    Container

    // Is this group already selected?
    get Selected() {
        for (let group of selectedGroups) {
            // For TOP_PLAYERS, compare by name since Data is an array
            if (this.Type == Group.TOP_PLAYERS && group.Type == Group.TOP_PLAYERS) {
                if (group.Name == this.Name) return true;
            } else {
                if (group.Data == this.Data) return true;
            }
        }
        return false
    }

    constructor(Name, Data, Type) {
        this.Name = Name;
        this.Data = Data;
        this.Type = Type;


        // Below for tribes, will need other logic for other types of selector
        if (Type == Group.TRIBE) {
            this.PlayerData = current_data.players.filter((x) => {
                return x.tribe == Data.id;
            });
        }
        else if (Type == Group.PLAYER) {
            this.PlayerData = [Data];
        }
        else if (Type == Group.TOP_PLAYERS) {
            // Data is already an array of player objects
            this.PlayerData = Data;
        }

        const tribePopup = document.createElement("div");
        tribePopup.classList.add("tribe-popup");

        const groupIcon = document.createElement('span');
        groupIcon.classList.add("typeIcon");

        switch (Type) {
            case Group.PLAYER:
                groupIcon.classList.add("playerIcon");
                tribePopup.classList.add("group-popup-player");
                break;
            case Group.TRIBE:
                groupIcon.classList.add("tribeIcon");
                break;
            case Group.TOP_PLAYERS:
                groupIcon.classList.add("topPlayersIcon");
                tribePopup.classList.add("group-popup-top");
                break;
        }

        tribePopup.appendChild(groupIcon);

        // Highlight if already on the plot
        if (this.Selected) tribePopup.classList.add("tribe-popup-selected");

        // Add the span with the name
        const nameSpan = document.createElement("span");
        nameSpan.innerHTML = Name;
        tribePopup.appendChild(nameSpan);


        tribePopupContainer.appendChild(tribePopup);

        tribePopup.addEventListener("click", () => { this.selectGroup() })
    }


    selectGroup() {

        // Don't select the group if it is already selected
        if (this.Selected) return;


        selectedGroups.push(this);
        activeGroupSelector = this;
        this.Container = new SelectedGroupContainer(this);
        updatePlayerList();
        resetGraphAdder();
        redrawChart();
        updateGroupsInQueryString();
    }


}

function updatePlayerList() {

    selectedPlayers = []
    for (let group of selectedGroups) {

        if ((group.Type == Group.TRIBE) & (groupTribe)) {

            // ** Make a date list of all dates **
            let allDates = [];

            for (let playerData of group.PlayerData) {
                allDates = allDates.concat(playerData.dates)
            }

            // Make unique
            allDates = [...new Set(allDates)];

            // Sort
            allDates.sort(function (a, b) {
                return a - b;
            });


            let aggregateDict = {
                "name": group.Name,
                "dates": allDates
            }

            for (let statistic of availableStatistics) {
                let aggregateVals = [];

                for (let dateVal of allDates) {
                    let aggregateVal = null;
                    for (let playerData of group.PlayerData) {
                        let dateIndex = playerData.dates.indexOf(dateVal);

                        if ((dateIndex > -1) & (statistic in playerData)) {
                            if (playerData[statistic][dateIndex] !== null) {
                                aggregateVal = aggregateVal + playerData[statistic][dateIndex]
                            }
                        }
                    }

                    if ((groupType == "avg") & (aggregateVal !== null)) aggregateVal = aggregateVal / group.PlayerData.length;

                    aggregateVals.push(aggregateVal);
                }


                // Assign the aggregate value back to the object
                aggregateDict[statistic] = aggregateVals;
            }

            Array.prototype.push.apply(selectedPlayers, [aggregateDict]);
            console.log("aggregateDict", aggregateDict);
        }
        else {
            Array.prototype.push.apply(selectedPlayers, group.PlayerData);
        }
    }

    // Remove duplicates
    selectedPlayers = [...new Set(selectedPlayers)];

    current_metric_name = `current_${selectedMetric.toLowerCase()}`

    // Return the data sorted by current points
    selectedPlayers.sort(function (a, b) {
        return b[current_metric_name] - a[current_metric_name];
    });

    console.log("selectedPlayers", selectedPlayers)
    selectedData = []
    for (let player of selectedPlayers) {
        let player_data = []

        if (selectedMetric in player) {
            console.log("Metric found", selectedMetric)
            for (let i = 0; i < player.dates.length; i++) {
                player_data.push([player.dates[i], player[selectedMetric][i]])
            }

            // Calculate global rank for this player and metric
            let playerName = player.name;
            let currentMetricName = `current_${selectedMetric.toLowerCase()}`;
            if (currentMetricName in player && player[currentMetricName] !== null && player[currentMetricName] !== undefined) {
                // Get all players sorted by this metric
                let allPlayersSorted = current_data.players
                    .filter(p => p[currentMetricName] !== null && p[currentMetricName] !== undefined)
                    .sort((a, b) => b[currentMetricName] - a[currentMetricName]);

                // Find this player's rank (1-indexed)
                let rank = allPlayersSorted.findIndex(p => p.name === player.name) + 1;

                if (rank > 0) {
                    playerName = `${player.name} (#${rank})`;
                }
            }

            selectedData.push({
                name: playerName,
                data: player_data
            });
        }

    }
    console.log("selectedData", selectedData)

}

groupTribeCheckbox.addEventListener("change", () => {
    groupTribe = groupTribeCheckbox.checked;
    updateQueryParams("groupTribe", groupTribe);
    console.log(groupTribe)

    // The grouping type only makes sense to be visible if grouping is being used.
    if (groupTribe) groupTypeDiv.classList.remove("hidden"); else groupTypeDiv.classList.add("hidden");

    updatePlayerList();
    redrawChart();
})

groupTypeCheckbox.addEventListener("change", () => {
    groupType = (groupTypeCheckbox.checked) ? "avg" : "total";
    updateQueryParams("groupType", groupType);

    updatePlayerList();
    redrawChart();
})


function updateGroupsInQueryString() {

    let players = [];
    let tribes = [];
    let topGroups = [];

    for (let group of selectedGroups) {
        if (group.Type == Group.TRIBE) {
            tribes.push(group.Data.id);
        } else if (group.Type == Group.PLAYER) {
            players.push(group.Data.id);
        } else if (group.Type == Group.TOP_PLAYERS) {
            // Extract the statistic from the group name (e.g., "Top 10 Points" -> "Points")
            let statistic = group.Name.replace("Top 10 ", "");
            topGroups.push(statistic);
        }
    }

    updateQueryParams("players", players.join("_"));
    updateQueryParams("tribes", tribes.join("_"));
    updateQueryParams("topGroups", topGroups.join("_"));
}

let layoutVal;
let alignVal;
let verticalAlign;

function redrawChart() {
    if (!activeGroupSelector) {
        return;
    }
    clearChart();

    // If no data, then show nothing
    if (selectedPlayers.length == 0) return;

    // How many groups are there
    let numGroups = selectedGroups.length;

    const playerCount = selectedGroups.reduce((count, obj) => {
        if (obj.Type === Group.PLAYER) {
            return count + 1;
        }
        return count;
    }, 0);


    const tribeCount = selectedGroups.reduce((count, obj) => {
        if (obj.Type === Group.TRIBE) {
            return count + 1;
        }
        return count;
    }, 0);


    const specialGroupCount = numGroups - playerCount - tribeCount;

    // Show the option to group tribes, only if at least 1 tribe is selected
    if (playerCount == numGroups) groupTribeDiv.classList.add("hidden"); else groupTribeDiv.classList.remove("hidden");

    // Title text signifying what groups / players are present
    let titleText;
    if ((numGroups == 1) && (tribeCount == 1)) {
        titleText = `${selectedGroups[0].Data.tribe}`
    }
    else if ((numGroups == 1) && (playerCount == 1)) {
        titleText = `${selectedGroups[0].Name}`
    }
    else if ((numGroups > 1) && (playerCount == 0)) {
        titleText = `${numGroups} Tribes`
    }
    else if ((numGroups > 1) && (tribeCount == 0)) {
        titleText = `${numGroups} Players`
    }
    else if ((playerCount == 0) && (tribeCount == 0) && (specialGroupCount == 1)) {
        titleText = `${selectedGroups[0].Name}`
    }
    else if ((playerCount == 0) && (tribeCount == 0) && (specialGroupCount > 1)) {
        titleText = `${numGroups} Special Groups`
    }
    else {
        titleText = `${playerCount} Player, ${tribeCount} Tribes`
    }


    titleText = titleText + ` (${selectedMetric})`

    const windowWidth = window.innerWidth;
    if (windowWidth > 850) {
        layoutVal = 'vertical';
        alignVal = 'right';
        verticalVal = 'middle';
    }
    else {
        layoutVal = 'horizontal';
        alignVal = 'center';
        verticalVal = 'bottom';
    }

    Highcharts.chart('plotContainer', {
        chart: {
            type: 'spline',
            zoomType: 'xy',
            height: 600
        },

        colors: getDistinctColors(selectedData.length, colourRandomSeed),

        subtitle: {
            text: 'Created by higamy'
        },

        yAxis: {
            title: {
                text: selectedMetric
            }
        },
        title: {
            text: titleText
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
            layout: layoutVal,
            align: alignVal,
            verticalAlign: verticalVal,
            floating: false
        },

        plotOptions: {
            series: {
                marker: {
                    enabled: true
                }
            }
        },

        series: selectedData,

        responsive: {
            rules: [{
                condition: {

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
}

// Set up the drop down to select the statistic
for (let statistic of availableStatistics) {
    const dropDownOption = new DropDownOption(statisticSelector, statisticsDropdownOptions, statistic);

    dropDownOption.link.addEventListener("click", () => {
        selectedMetric = statistic;
        updateQueryParams("metric", statistic);
        updatePlayerList();
        redrawChart();
    })

    if (selectedMetric == statistic) { dropDownOption.activate() };
}

// Set up the help button to show the help modal
const helpButton = document.getElementById("helpButton");
if (helpButton) {
    helpButton.addEventListener("click", () => {
        const helpModal = new bootstrap.Modal(document.getElementById('helpModal'));
        helpModal.show();
    });
}