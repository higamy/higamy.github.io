const githubLocation = 'https://higamy.github.io/TW/Data'
const serverContainerEl = document.getElementById("serverContainer");
const worldContainerEl = document.getElementById("worldContainer");

let serverSelectors = []

axios.get(`${githubLocation}/Config/tribes.json`)
    .then(data => {
        data = data.data
        console.log(data)
        for (let serverConfig of data.config) {
            const serverContainer = new ServerContainer(serverConfig);
            serverSelectors.push(serverContainer);
        }

        serverSelectors[0].activate();
    })


class ServerContainer {
    worldSelectorContainer
    serverButton
    server
    worldButtons

    constructor(serverConfig) {
        this.worldButtons = []
        this.server = serverConfig['server']

        const serverButton = document.createElement('button');
        this.serverButton = serverButton;
        serverButton.classList.add('btn', 'btn-primary');
        serverButton.innerHTML = this.server.toUpperCase();

        const worldSelectorContainer = document.createElement('div');
        this.worldSelectorContainer = worldSelectorContainer;
        worldSelectorContainer.classList.add("even-spacing");
        for (let world of serverConfig.worlds) {
            this.worldButtons.push(new WorldButton(this, world));
        }
        this.worldButtons[0].activate();

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

let dataGlobal

class WorldButton {
    world
    server
    button
    serverContainer
    data

    // **************** Save ref to data if already loaded


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
                        dataGlobal = data;
                        resolve('Data retrieved via XHR.');
                    })
            }
        }).then((message) => {
            console.log(message);
            let tribeList = this.data.tribes.map(function (value) {
                return value.tribe;
            });
            console.log(tribeList);
        })


    }

    deactivate() {
        // Update styles
        this.button.classList.remove('btn-info');
        this.button.classList.add('btn-secondary');
    }
}