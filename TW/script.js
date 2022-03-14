/*
IDEAS

Python script needs to get all pages, not just page 1 (most recent data)
Search works with tribe tag (as well as name)
Add tribe tag

*/


// Constants
const githubLocation = 'https://higamy.github.io/TW/Data';
const availableStatistics = ['Points', 'Rank', 'villages', 'OD', 'ODA', 'ODD'];

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


let serverSelectors = [];
let activeTribeSelector;
let selectedMetric = availableStatistics[0];
let saved_data = {};

axios.get(`${githubLocation}/Config/tribes.json`)
    .then(data => {
        data = data.data
        console.log(data)

        for (let serverConfig of data.config) {
            serverSelectors.push(new ServerSelector(serverConfig));
            saved_data[serverConfig['server']] = {}
        }
        serverSelectors[0].activate();

    })

class ServerSelector {
    serverConfig
    worldDropDowns
    server

    constructor(serverConfig) {
        this.serverConfig = serverConfig;
        this.server = serverConfig['server'];

        const dropDownOption = new DropDownOption(serverSelector, serverSelectorDropdownOptions, serverConfig['domain_game']);
        dropDownOption.link.addEventListener("click", () => this.activate())
    }

    activate() {
        serverSelector.innerHTML = this.serverConfig['domain_game']

        worldSelectorDropdownOptions.innerHTML = ""; // Clear previous options
        this.worldDropDowns = []
        for (let world of this.serverConfig.worlds) {

            const dropDownOption = new DropDownOption(worldSelector, worldSelectorDropdownOptions, world);
            this.worldDropDowns.push(dropDownOption);

            dropDownOption.link.addEventListener("click", () => {
                clearChart();
                resetGraphAdder();

                // Get the data - if not retrieved already
                new Promise((resolve, reject) => {

                    if (saved_data[this.server][world]) {
                        resolve(saved_data[this.server][world]);
                    }
                    else {
                        axios.get(`${githubLocation}/${this.server}/${world}/tribes.json`)
                            .then(data => {
                                data = data.data;
                                console.log(data);
                                saved_data[this.server][world] = data;
                                resolve(data);
                            })
                    }
                }).then((data) => {

                    let tribeList = data.tribes.map(function (value) {
                        return value.tribe;
                    });

                    graphAdder.oninput = () => {
                        // Remove the previous tribe elements
                        tribePopupContainer.innerHTML = "";

                        if (graphAdder.value == "") return;

                        let matchingTribes = tribeList.filter((x) => {
                            return x.toLowerCase().startsWith(graphAdder.value.toLowerCase());
                        })


                        matchingTribes.forEach((tribe, i) => {
                            // Find the matching tribe in all the data
                            let matchingTribeData = data.tribes.filter((x) => {
                                return x.tribe == tribe;
                            })
                            new TribeSelector(tribe, matchingTribeData[0]);
                        });
                    }
                })
            })


        }
        this.worldDropDowns[0].activate();

        resetGraphAdder();
    }
}

class DropDownOption {
    link
    selector
    text

    constructor(selector, parent, text = "") {
        const newOption = document.createElement("li");
        const newLink = document.createElement("a");
        newLink.setAttribute("class", "dropdown-item");
        newLink.setAttribute("href", "#");

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
                    new TribeSelector(tribe, matchingTribeData[0]);
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

class TribeSelector {
    tribeName
    tribeData
    all_data

    constructor(tribeName, tribeData) {
        this.tribeName = tribeName;
        this.tribeData = tribeData

        const tribePopup = document.createElement("div");
        tribePopup.innerHTML = tribeName;
        tribePopup.classList.add("tribe-popup");
        tribePopupContainer.appendChild(tribePopup);

        tribePopup.addEventListener("click", () => { this.selectTribe() })
    }

    selectTribe() {
        activeTribeSelector = this;
        this.calculateData();
        redrawChart();
    }

    calculateData() {
        let all_data = []
        for (let player of this.tribeData.players) {
            let player_data = []
            for (let i = 0; i < player.dates.length; i++) {
                player_data.push([player.dates[i], player[selectedMetric][i]])
            }
            all_data.push({
                name: player.name,
                data: player_data
            });
        }

        this.all_data = all_data
    }

}

function redrawChart() {
    activeTribeSelector.calculateData();
    clearChart();

    Highcharts.chart('plotContainer', {
        chart: {
            type: 'line',
            zoomType: 'xy'
        },

        subtitle: {
            text: 'Created by higamy'
        },

        yAxis: {
            title: {
                text: selectedMetric
            }
        },
        title: {
            text: `${activeTribeSelector.tribeData.tribe} (${selectedMetric})`
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

        series: activeTribeSelector.all_data,


        responsive: {
            rules: [{
                condition: {
                    //  maxWidth: 500
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
        redrawChart();
    })
}