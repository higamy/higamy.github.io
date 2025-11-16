// Redirect to pp market page if not on it
const urlParams = new URLSearchParams(window.location.search);
const screenParam = urlParams.get('screen');
const modeParam = urlParams.get('mode');

if (typeof serverLocation === 'undefined') {
    serverLocation = 'https://higamy.com';
}

if ((modeParam != 'exchange') | (screenParam != 'market')) {
    UI.SuccessMessage("Redirecting to PP Exchange...", 1000)

    urlParams.delete('village');
    urlParams.set('mode', 'exchange');
    urlParams.set('screen', 'market');

    // Perform the redirect
    window.location.replace(`game.php?${urlParams}`);
}
else {

    let noChangeMessage = 'No change in PP prices.';
    let intervalToSendRequests_SECONDS = 5;

    let worker = new Worker(
        `data:text/javascript,
        onmessage = function(event){    //This will be called when worker.postMessage is called in the outside code.
    
        
            let foo = event.data;    //Get the argument that was passed from the outside code, in this case foo.
            console.log(foo)
            if (foo == "${noChangeMessage}") {
                postMessage("${noChangeMessage}")
            }
            else{
                const url = '${serverLocation}/send_message';
                const options = {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(foo),
                };
                
                fetch(url, options)
                    .then(response => postMessage(response['statusText']) )
                    .catch(error => {
                    console.error('Error:', error);
                    postMessage(error);
                    });
        
                    //Send the result to the outside code.
            }
    
        
    
        };
        `
    );

    worker.onmessage = function (event) {    //Get the result from the worker. This code will be called when postMessage is called in the worker.
        if (event.data == noChangeMessage) {
            UI.SuccessMessage(noChangeMessage)
        }
        else if (event.data.stack) {
            UI.ErrorMessage(`Error: ${event.data}`)
        }
        else {
            UI.SuccessMessage(`Server response: ${event.data}`)
        }


        // Set the next iteration to be queued
        setTimeout(sendPostRequest, intervalToSendRequests_SECONDS * 1000);
    }

    let lastWood = 0;
    let lastClay = 0;
    let lastIron = 0;

    function sendPostRequest() {

        let woodAmount = parseInt(document.querySelector("#premium_exchange_rate_wood > div:nth-child(1)").textContent);
        let clayAmount = parseInt(document.querySelector("#premium_exchange_rate_stone > div:nth-child(1)").textContent);
        let ironAmount = parseInt(document.querySelector("#premium_exchange_rate_iron > div:nth-child(1)").textContent);

        console.log()


        if ((lastWood == woodAmount) && (lastClay == clayAmount) && (lastIron == ironAmount)) {
            worker.postMessage(noChangeMessage);
        }
        else {


            // Update previous amounts
            lastWood = woodAmount;
            lastClay = clayAmount;
            lastIron = ironAmount

            let data = {
                server: game_data.market,
                world: game_data.world,
                continent: game_data.village.display_name.slice(-3,),
                wood: woodAmount,
                clay: clayAmount,
                iron: ironAmount
            }

            worker.postMessage(data);
        }
    }

    setTimeout(sendPostRequest, 1000);

    // Call the function when the page loads (for testing purposes)
    //setInterval(sendPostRequest, 15000);
    UI.SuccessMessage('Started monitoring!')


}

