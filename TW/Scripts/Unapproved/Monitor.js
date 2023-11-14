function sendPostRequest() {
    let woodAmount = parseInt(document.querySelector("#premium_exchange_rate_wood > div:nth-child(1)").textContent);
    let clayAmount = parseInt(document.querySelector("#premium_exchange_rate_stone > div:nth-child(1)").textContent);
    let ironAmount = parseInt(document.querySelector("#premium_exchange_rate_iron > div:nth-child(1)").textContent);

    console.log(woodAmount, clayAmount, ironAmount)

    jQuery.ajax({
        url: 'https://higamy.com/send_message',
        method: 'POST',
        data: {
            server: game_data.market,
            world: game_data.world,
            continent: game_data.village.display_name.slice(-3,),
            wood: woodAmount,
            clay: clayAmount,
            iron: ironAmount
        },
        dataType: 'JSON',
        success: function ({ message }) {
            UI.SuccessMessage(message);
        },
    });

}

// Call the function when the page loads (for testing purposes)
setInterval(sendPostRequest, 15000);
UI.SuccessMessage('Started monitoring!')



// Check if the Background Fetch API is supported
if ('BackgroundFetchManager' in self) {
    const bgFetch = new BackgroundFetchManager();

    // Create a background fetch registration
    const registration = await bgFetch.register('my-background-fetch');

    // Listen for background fetch events
    registration.addEventListener('fetch', async (event) => {
        // Perform the necessary logic to get the data
        const { woodAmount, clayAmount, ironAmount } = await fetchData();

        // Make a request to the server
        const response = await fetch('https://higamy.com/send_message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                server: game_data.market,
                world: game_data.world,
                continent: game_data.village.display_name.slice(-3),
                wood: woodAmount,
                clay: clayAmount,
                iron: ironAmount,
            }),
        });

        // Respond with the fetched data
        event.respondWith(response);
    });
}

async function fetchData() {
    // Perform the logic to get the data (e.g., from the DOM)
    const woodAmount = parseInt(document.querySelector("#premium_exchange_rate_wood > div:nth-child(1)").textContent);
    const clayAmount = parseInt(document.querySelector("#premium_exchange_rate_stone > div:nth-child(1)").textContent);
    const ironAmount = parseInt(document.querySelector("#premium_exchange_rate_iron > div:nth-child(1)").textContent);
    return { woodAmount, clayAmount, ironAmount };
}
