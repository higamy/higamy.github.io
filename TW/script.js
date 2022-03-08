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

    constructor(serverConfig) {
        this.server = serverConfig['server']

        const serverButton = document.createElement('button');
        this.serverButton = serverButton;
        serverButton.classList.add('btn', 'btn-primary');
        serverButton.innerHTML = this.server.toUpperCase();

        const worldSelectorContainer = document.createElement('div');
        this.worldSelectorContainer = worldSelectorContainer;
        worldSelectorContainer.classList.add("even-spacing");
        for (let world of serverConfig.worlds) {
            new WorldButton(this, world);
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
    }

    deactivate() {
        this.serverButton.classList.add('btn-secondary');
        this.serverButton.classList.remove('btn-primary');
        this.worldSelectorContainer.classList.add('hidden');
    }
}

class WorldButton {
    world
    server
    button


    constructor(ServerContainer, world) {
        const worldButton = document.createElement('button');
        this.button = button
        worldButton.classList.add('btn', 'btn-info');
        worldButton.innerHTML = world;

        ServerContainer.worldSelectorContainer.appendChild(worldButton);

        worldButton.addEventListener('click', () => this.activate())

        this.world = world
        this.server = ServerContainer.server
    }

    activate() {
        // Update styles
        this.button.classList.add('btn-info');
        this.button.classList.remove('btn-secondary');

        // Get the data
        axios.get(`${githubLocation}/${this.server}/${this.world}/tribes.json`)
            .then(data => {
                data = data.data
                console.log(data)
            })
    }

    deactivate() {
        // Update styles
        this.button.classList.remove('btn-info');
        this.button.classList.add('btn-secondary');
    }
}