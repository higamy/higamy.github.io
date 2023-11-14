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