let worker = new Worker(
    `data:text/javascript,
    onmessage = function(event){    //This will be called when worker.postMessage is called in the outside code.
        let foo = event.data;    //Get the argument that was passed from the outside code, in this case foo.
        console.log(foo)
        const url = 'https://higamy.com/send_message';
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
            });

          //Send the result to the outside code.
    };
    `
);

worker.onmessage = function (event) {    //Get the result from the worker. This code will be called when postMessage is called in the worker.
    console.log("The result is " + event.data);
    UI.SuccessMessage(`Server response: ${event.data}`)

    // Set the next iteration to be queued
    setTimeout(sendPostRequest, 15000);
}

function sendPostRequest() {

    let woodAmount = parseInt(document.querySelector("#premium_exchange_rate_wood > div:nth-child(1)").textContent);
    let clayAmount = parseInt(document.querySelector("#premium_exchange_rate_stone > div:nth-child(1)").textContent);
    let ironAmount = parseInt(document.querySelector("#premium_exchange_rate_iron > div:nth-child(1)").textContent);

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

setTimeout(sendPostRequest, 1000);

// Call the function when the page loads (for testing purposes)
//setInterval(sendPostRequest, 15000);
UI.SuccessMessage('Started monitoring!')

