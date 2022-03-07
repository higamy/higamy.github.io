const githubLocation = 'https://higamy.github.io/TW/Data'
const serverContainer = document.getElementById("serverContainer");

axios.get(`${githubLocation}/Config/tribes.json`)
    .then(data => {
        data = data.data
        console.log(data)
        for (let serverConfig of data) {
            const worldSelector = document.createElement('div');

        }
    })