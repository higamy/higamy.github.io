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
let n_to_upgrade = 3474;

// example usage
runFunctionNTimes(() => {
    fetch("https://en139.tribalwars.net/game.php?village=18188&screen=flags&ajaxaction=upgrade_flag&h=6288f0ae", {
        "headers": {
            "accept": "application/json, text/javascript, */*; q=0.01",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Opera\";v=\"112\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest"
        },
        "referrer": "https://en139.tribalwars.net/game.php?village=18188&screen=flags",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": "flag_type=3&from_level=1",
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


}, Math.ceil(n_to_upgrade / 3), 200); // 


