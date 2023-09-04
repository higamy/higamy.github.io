// THIS SCRIPT IS NOT FINISHED!!!

async function runFunctionNTimes(func, n, delay) {
    let count = 0;
    while (count < n) {
        func();
        await new Promise((resolve) => setTimeout(resolve, delay));
        count++;
    }
}

let n_flags_upgraded = 0;
let data2
// example usage
runFunctionNTimes(() => {

    fetch("https://en132.tribalwars.net/game.php?village=34350&screen=flags&ajaxaction=upgrade_flag&h=27e10d29", {
        "headers": {
            "accept": "application/json, text/javascript, */*; q=0.01",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "sec-ch-ua": "\"Opera\";v=\"95\", \"Chromium\";v=\"109\", \"Not;A=Brand\";v=\"24\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest"
        },
        "referrer": "https://en132.tribalwars.net/game.php?village=34350&screen=flags",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": "flag_type=1&from_level=1",
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    }).then((response) => response.json())
        .then((data) => {
            // Status update
            if ('error' in data) window.top.UI.ErrorMessage(
                `Error: ${data['error']}`,
                2000
            )
            else {
                n_flags_upgraded++;
                UI.SuccessMessage(
                    `Upgraded ${n_flags_upgraded} flags`,
                    2000
                );
            }
        });


}, 5515 / 3, 200); // 


