// PP Exchange Monitor v2
//
// Watches the Premium Exchange screen and POSTs rate/stock/capacity to the
// backend. All tunables live in an inline settings panel injected above the
// exchange table, and persist to localStorage across page loads.
(function () {
    'use strict';

    // ---- Page guard: only run on the exchange screen, else redirect there ----
    const urlParams = new URLSearchParams(window.location.search);
    const screenParam = urlParams.get('screen');
    const modeParam = urlParams.get('mode');

    if ((modeParam != 'exchange') || (screenParam != 'market')) {
        if (typeof UI !== 'undefined') UI.SuccessMessage('Redirecting to PP Exchange...', 1000);
        urlParams.delete('village');
        urlParams.set('mode', 'exchange');
        urlParams.set('screen', 'market');
        window.location.replace(`game.php?${urlParams}`);
        return;
    }

    // ---- Settings (persisted) ----
    const LS_KEY = 'tw_pp_monitor_settings_v2';

    // Backward-compat: honour a pre-set `serverLocation` global as the initial URL.
    const initialServerUrl =
        (typeof serverLocation !== 'undefined' && serverLocation) || 'http://127.0.0.1:8000';

    const DEFAULTS = {
        serverUrl: initialServerUrl,
        intervalSeconds: 1,
        sendRate: true,
        sendStock: true,
        sendCapacity: true,
        enabled: true,      // auto-start on load (matches previous behaviour)
    };

    function loadSettings() {
        let stored = {};
        try {
            stored = JSON.parse(localStorage.getItem(LS_KEY)) || {};
        } catch (e) {
            stored = {};
        }
        return Object.assign({}, DEFAULTS, stored);
    }

    function persist() {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(settings));
        } catch (e) {
            /* localStorage may be unavailable; settings just won't persist */
        }
    }

    const settings = loadSettings();

    // ---- Constants ----
    const noChangeMessage = 'No change in PP data.';
    // The DOM uses "stone" for clay everywhere. We normalise to clay for the wire.
    const RESOURCE_DOM_TO_WIRE = { wood: 'wood', stone: 'clay', iron: 'iron' };
    const MIN_INTERVAL_SECONDS = 1;

    // ---- Network worker (keeps fetch off the main thread) ----
    const workerSrc = `
        onmessage = function (e) {
            var url = e.data.url;
            var body = e.data.body;
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: body
            })
                .then(function (r) { postMessage({ ok: true, status: r.status, statusText: r.statusText }); })
                .catch(function (err) { postMessage({ ok: false, error: String(err) }); });
        };
    `;
    const worker = new Worker('data:text/javascript,' + encodeURIComponent(workerSrc));

    // ---- Data collection ----
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
            if (settings.sendRate) {
                const rate = readInt(`#premium_exchange_rate_${domName} > div:nth-child(1)`);
                if (rate !== null) data[wireName] = rate;
            }
            if (settings.sendStock) {
                const stock = readInt(`#premium_exchange_stock_${domName}`);
                if (stock !== null) data[`${wireName}_stock`] = stock;
            }
            if (settings.sendCapacity) {
                const capacity = readInt(`#premium_exchange_capacity_${domName}`);
                if (capacity !== null) data[`${wireName}_capacity`] = capacity;
            }
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

    // ---- Monitoring loop ----
    let lastSnapshot = null;
    let timerId = null;
    let inFlight = false;

    function endpointUrl() {
        return settings.serverUrl.replace(/\/+$/, '') + '/send_message';
    }

    function clearTimer() {
        if (timerId) {
            clearTimeout(timerId);
            timerId = null;
        }
    }

    function scheduleNext() {
        clearTimer();
        if (!settings.enabled) return;
        const secs = Math.max(MIN_INTERVAL_SECONDS, Number(settings.intervalSeconds) || MIN_INTERVAL_SECONDS);
        timerId = setTimeout(tick, secs * 1000);
    }

    function tick() {
        timerId = null;
        if (!settings.enabled) return;

        let data;
        try {
            data = collectData();
        } catch (e) {
            setStatus('error', 'Could not read page: ' + e.message);
            scheduleNext();
            return;
        }

        const snap = snapshotOf(data);
        if (snap === '{}') {
            setStatus('idle', 'No metrics on page (check toggles)');
            scheduleNext();
            return;
        }
        if (snap === lastSnapshot) {
            setStatus('idle', noChangeMessage);
            scheduleNext();
            return;
        }

        lastSnapshot = snap;
        send(data);
    }

    function send(data) {
        inFlight = true;
        setStatus('active', 'Sending…');
        worker.postMessage({ url: endpointUrl(), body: JSON.stringify(data) });
    }

    worker.onmessage = function (event) {
        inFlight = false;
        const r = event.data || {};
        if (r.ok) {
            setStatus('active', `Sent ✓ (${r.status} ${r.statusText || ''})`.trim());
        } else {
            setStatus('error', `Send failed: ${r.error}`);
            if (typeof UI !== 'undefined') UI.ErrorMessage(`PP Monitor: ${r.error}`);
        }
        scheduleNext();
    };

    function start() {
        settings.enabled = true;
        persist();
        reflectButtons();
        if (!timerId && !inFlight) tick();   // fire immediately, then schedule
    }

    function stop() {
        settings.enabled = false;
        persist();
        clearTimer();
        reflectButtons();
        setStatus('paused', 'Stopped');
    }

    // Manual one-off send that bypasses the change-detection guard.
    function sendOnce() {
        let data;
        try {
            data = collectData();
        } catch (e) {
            setStatus('error', 'Could not read page: ' + e.message);
            return;
        }
        if (snapshotOf(data) === '{}') {
            setStatus('idle', 'No metrics on page (check toggles)');
            return;
        }
        lastSnapshot = snapshotOf(data);
        send(data);
    }

    // ================= Settings panel UI =================
    function injectStyles() {
        if (document.getElementById('ppm-styles')) return;
        const style = document.createElement('style');
        style.id = 'ppm-styles';
        style.textContent = `
            #ppm-panel {
                font-family: Verdana, Arial, sans-serif;
                border: 1px solid #7d510f;
                background: #f4e4bc;
                border-radius: 6px;
                padding: 10px 12px;
                margin: 0 0 12px 0;
                font-size: 12px;
                color: #4a3213;
                box-shadow: inset 0 0 0 1px #e3c896;
            }
            #ppm-panel .ppm-head {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
                font-weight: bold;
                font-size: 13px;
            }
            #ppm-panel .ppm-dot {
                width: 10px; height: 10px; border-radius: 50%;
                background: #999; flex-shrink: 0;
                box-shadow: 0 0 0 1px rgba(0,0,0,.25);
            }
            #ppm-panel .ppm-dot.idle { background: #4a90d9; }
            #ppm-panel .ppm-dot.active { background: #3fae4b; }
            #ppm-panel .ppm-dot.error { background: #d93f3f; }
            #ppm-panel .ppm-dot.paused { background: #b0b0b0; }
            #ppm-panel .ppm-grid {
                display: grid;
                grid-template-columns: auto 1fr;
                gap: 6px 10px;
                align-items: center;
                margin-bottom: 8px;
            }
            #ppm-panel label { font-weight: normal; }
            #ppm-panel input[type="text"],
            #ppm-panel input[type="number"] {
                width: 100%;
                box-sizing: border-box;
                padding: 3px 5px;
                border: 1px solid #b8926a;
                border-radius: 3px;
                background: #fffdf5;
                font-size: 12px;
            }
            #ppm-panel input[type="number"] { width: 80px; }
            #ppm-panel .ppm-metrics { display: flex; gap: 14px; }
            #ppm-panel .ppm-metrics label {
                display: inline-flex; align-items: center; gap: 4px; cursor: pointer;
            }
            #ppm-panel .ppm-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
            #ppm-panel button {
                cursor: pointer;
                border: 1px solid #7d510f;
                border-radius: 4px;
                padding: 4px 12px;
                font-size: 12px;
                background: linear-gradient(#f0d9a8, #e2c184);
                color: #3a2708;
                font-weight: bold;
            }
            #ppm-panel button:hover:not(:disabled) { background: linear-gradient(#f6e3ba, #eccf98); }
            #ppm-panel button:disabled { opacity: .5; cursor: default; }
            #ppm-panel button.ppm-stop { background: linear-gradient(#eab0b0, #d98a8a); border-color: #8a2020; color: #4a0d0d; }
            #ppm-panel .ppm-status {
                margin-top: 8px; padding-top: 6px; border-top: 1px solid #e3c896;
                color: #5a4320; font-size: 11px; min-height: 14px;
            }
            #ppm-panel .ppm-status b { color: #3a2708; }
        `;
        document.head.appendChild(style);
    }

    let elDot, elStatus, elStart, elStop;

    function setStatus(state, message) {
        if (elDot) elDot.className = 'ppm-dot ' + state;
        if (elStatus) {
            const t = new Date().toLocaleTimeString();
            elStatus.innerHTML = `<b>${t}</b> — ${message}`;
        }
    }

    function reflectButtons() {
        if (elStart) elStart.disabled = settings.enabled;
        if (elStop) elStop.disabled = !settings.enabled;
    }

    function buildPanel() {
        injectStyles();

        const panel = document.createElement('div');
        panel.id = 'ppm-panel';
        panel.innerHTML = `
            <div class="ppm-head">
                <span class="ppm-dot paused" id="ppm-dot"></span>
                <span>PP Exchange Monitor</span>
            </div>
            <div class="ppm-grid">
                <label for="ppm-url">Backend URL</label>
                <input type="text" id="ppm-url" spellcheck="false">

                <label for="ppm-interval">Interval (s)</label>
                <input type="number" id="ppm-interval" min="${MIN_INTERVAL_SECONDS}" step="1">

                <label>Send metrics</label>
                <div class="ppm-metrics">
                    <label><input type="checkbox" id="ppm-rate"> Rate</label>
                    <label><input type="checkbox" id="ppm-stock"> Stock</label>
                    <label><input type="checkbox" id="ppm-capacity"> Capacity</label>
                </div>
            </div>
            <div class="ppm-actions">
                <button id="ppm-start">Start</button>
                <button id="ppm-stop" class="ppm-stop">Stop</button>
                <button id="ppm-once">Send once</button>
            </div>
            <div class="ppm-status" id="ppm-status"></div>
        `;

        // Insert inline, directly above the exchange table.
        const form = document.querySelector('#premium_exchange_form');
        if (form && form.parentNode) {
            form.parentNode.insertBefore(panel, form);
        } else {
            // Defensive fallback: float it top-right if the form isn't found.
            panel.style.position = 'fixed';
            panel.style.top = '10px';
            panel.style.right = '10px';
            panel.style.zIndex = '99999';
            panel.style.maxWidth = '340px';
            document.body.appendChild(panel);
        }

        // Grab handles
        elDot = panel.querySelector('#ppm-dot');
        elStatus = panel.querySelector('#ppm-status');
        elStart = panel.querySelector('#ppm-start');
        elStop = panel.querySelector('#ppm-stop');
        const elUrl = panel.querySelector('#ppm-url');
        const elInterval = panel.querySelector('#ppm-interval');
        const elRate = panel.querySelector('#ppm-rate');
        const elStock = panel.querySelector('#ppm-stock');
        const elCapacity = panel.querySelector('#ppm-capacity');

        // Seed from settings
        elUrl.value = settings.serverUrl;
        elInterval.value = settings.intervalSeconds;
        elRate.checked = settings.sendRate;
        elStock.checked = settings.sendStock;
        elCapacity.checked = settings.sendCapacity;

        // Wire changes -> settings (auto-persist)
        elUrl.addEventListener('change', () => { settings.serverUrl = elUrl.value.trim(); persist(); });
        elInterval.addEventListener('change', () => {
            let v = parseInt(elInterval.value, 10);
            if (!Number.isFinite(v) || v < MIN_INTERVAL_SECONDS) v = MIN_INTERVAL_SECONDS;
            settings.intervalSeconds = v;
            elInterval.value = v;
            persist();
        });
        elRate.addEventListener('change', () => { settings.sendRate = elRate.checked; persist(); });
        elStock.addEventListener('change', () => { settings.sendStock = elStock.checked; persist(); });
        elCapacity.addEventListener('change', () => { settings.sendCapacity = elCapacity.checked; persist(); });

        elStart.addEventListener('click', start);
        elStop.addEventListener('click', stop);
        panel.querySelector('#ppm-once').addEventListener('click', sendOnce);

        reflectButtons();
        setStatus(settings.enabled ? 'active' : 'paused', settings.enabled ? 'Monitoring…' : 'Idle (press Start)');
    }

    // ---- Boot ----
    buildPanel();
    if (settings.enabled) start();

    if (typeof UI !== 'undefined') {
        UI.SuccessMessage('PP Monitor v2 ready (settings panel added above the exchange).');
    }

    // Expose a small handle for debugging / local testing.
    window.PP_MONITOR = {
        getSettings: () => Object.assign({}, settings),
        collectData,
        start,
        stop,
        sendOnce,
    };
})();
