// Redirect to pp market page if not on it
const urlParams = new URLSearchParams(window.location.search);
const screenParam = urlParams.get('screen');
const modeParam = urlParams.get('mode');

if (typeof serverLocation === 'undefined') {
    serverLocation = 'http://127.0.0.1:8000';
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

    let noChangeMessage = 'No change in PP data.';
    let intervalToSendRequests_SECONDS = 1;

    let worker = new Worker(
        `data:text/javascript,
        onmessage = function(event){
            let foo = event.data;
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
            }
        };
        `
    );

    worker.onmessage = function (event) {
        if (event.data == noChangeMessage) {
            UI.SuccessMessage(noChangeMessage, intervalToSendRequests_SECONDS * 500)
        }
        else if (event.data.stack) {
            UI.ErrorMessage(`Error: ${event.data}`)
        }
        else {
            UI.SuccessMessage(`Server response: ${event.data}`, intervalToSendRequests_SECONDS * 500)
        }

        setTimeout(sendPostRequest, intervalToSendRequests_SECONDS * 1000);
    }

    // The DOM uses "stone" for clay everywhere. We normalise to clay for the wire.
    const RESOURCE_DOM_TO_WIRE = { wood: 'wood', stone: 'clay', iron: 'iron' };

    // Snapshot of the last-sent payload's metric values so we can detect changes.
    let lastSnapshot = null;

    function readInt(selector) {
        const el = document.querySelector(selector);
        if (!el) return null;
        const n = parseInt(el.textContent.replace(/[^0-9-]/g, ''), 10);
        return Number.isFinite(n) ? n : null;
    }

    function collectData() {
        const data = {
            server: game_data.market,
            world: game_data.world,
            continent: game_data.village.display_name.slice(-3),
        };

        for (const [domName, wireName] of Object.entries(RESOURCE_DOM_TO_WIRE)) {
            // Rate is the first div inside the rate cell.
            const rate = readInt(`#premium_exchange_rate_${domName} > div:nth-child(1)`);
            const stock = readInt(`#premium_exchange_stock_${domName}`);
            const capacity = readInt(`#premium_exchange_capacity_${domName}`);

            if (rate !== null) data[wireName] = rate;
            if (stock !== null) data[`${wireName}_stock`] = stock;
            if (capacity !== null) data[`${wireName}_capacity`] = capacity;
        }

        return data;
    }

    // The comparable subset: everything except server/world/continent.
    function snapshotOf(payload) {
        const out = {};
        for (const [k, v] of Object.entries(payload)) {
            if (k === 'server' || k === 'world' || k === 'continent') continue;
            out[k] = v;
        }
        return JSON.stringify(out);
    }

    function sendPostRequest() {
        const data = collectData();

        // If none of the 9 metric fields were readable, skip this tick.
        const snap = snapshotOf(data);
        if (snap === '{}') {
            worker.postMessage(noChangeMessage);
            return;
        }

        if (snap === lastSnapshot) {
            worker.postMessage(noChangeMessage);
        } else {
            lastSnapshot = snap;
            worker.postMessage(data);
        }
    }

    setTimeout(sendPostRequest, 1000);

    UI.SuccessMessage('Started monitoring (v2 - rate, stock, capacity)!')
}
