// Helpers for reading Account Manager trading routes ("deliveries") and
// current resource levels. Run from any in-game page (needs game_data and jQuery-free DOM).

// ---------------------------------------------------------------------------
// 1. Parse every trading route listed on the am_market screen.
//    Pass a Document (defaults to the current page).
// ---------------------------------------------------------------------------
function parseTradingRoutes(doc = document) {
    const toInt = (text) => parseInt(String(text).replace(/\D/g, ''), 10) || 0;

    const parseVillage = (cell) => {
        const link = cell.querySelector('a');
        const text = link.textContent.trim();
        // Take the LAST coordinate in the text, in case the village name contains one
        const coords = [...text.matchAll(/(\d{1,3})\|(\d{1,3})/g)].pop();
        return {
            id: toInt(new URL(link.getAttribute('href'), 'https://x/').searchParams.get('id')),
            name: text.replace(/\s*\(\d{1,3}\|\d{1,3}\)\s*K\d+\s*$/, ''),
            x: parseInt(coords[1], 10),
            y: parseInt(coords[2], 10),
            coord: coords[1] + '|' + coords[2],
        };
    };

    const parseResource = (cell, type) => {
        const icon = cell.querySelector('.icon.header.' + type);
        return icon ? toInt(icon.parentElement.textContent) : 0;
    };

    return Array.from(doc.querySelectorAll('input[name="trading_routes[]"]')).map((checkbox) => {
        const cells = checkbox.closest('tr').cells;
        const resCell = cells[3];
        const timeCell = cells[5];
        const merchantSpan = resCell.querySelector('span[title]');

        return {
            routeId: toInt(checkbox.value),
            start: parseVillage(cells[1]),
            target: parseVillage(cells[2]),
            wood: parseResource(resCell, 'wood'),
            stone: parseResource(resCell, 'stone'),
            iron: parseResource(resCell, 'iron'),
            merchants: merchantSpan ? toInt(merchantSpan.getAttribute('title')) : null,
            days: cells[4].textContent.split(',').map((d) => d.trim()).filter(Boolean),
            recurring: !!timeCell.querySelector('img[alt="Recurring"]'),
            time: timeCell.textContent.trim(),
            nextDelivery: cells[6].textContent.trim(),
        };
    });
}

// Fetch the am_market screen and parse it (use when not already on that page).
async function fetchTradingRoutes() {
    const html = await (await fetch(game_data.link_base_pure + 'am_market', { credentials: 'include' })).text();
    return parseTradingRoutes(new DOMParser().parseFromString(html, 'text/html'));
}

// ---------------------------------------------------------------------------
// 2. Current resource levels, warehouse capacity and merchants for every village.
//    Reads the production overview (Overviews -> Production), following all pages.
//    Selectors are the same ones the approved "Resource Balancer" script uses
//    (desktop layout only).
// ---------------------------------------------------------------------------
async function fetchVillageResources() {
    const toInt = (text) => parseInt(String(text).replace(/\D/g, ''), 10) || 0;
    const getDoc = async (url) => {
        const html = await (await fetch(url, { credentials: 'include' })).text();
        return new DOMParser().parseFromString(html, 'text/html');
    };

    const firstUrl = game_data.link_base_pure + 'overview_villages&mode=prod&group=0'; // group 0 = all villages
    const firstDoc = await getDoc(firstUrl);

    // Work out the list of page URLs (same logic as the Resource Balancer)
    let pageUrls = [];
    const navItems = Array.from(firstDoc.querySelectorAll('.paged-nav-item'));
    const pageSelect = navItems.length ? navItems[0].parentElement.querySelector('select') : null;
    if (pageSelect) {
        pageUrls = Array.from(pageSelect.options).map((o) => o.value);
        pageUrls.pop(); // last option is "all"
    } else if (navItems.length) {
        pageUrls = navItems.map((item, n) => item.getAttribute('href').split('page=')[0] + 'page=' + n);
    }

    // If the game is already showing every village on one page (">all<" is the selected page), use it as is
    const showingAll = navItems.length > 0 && /all/i.test(navItems[0].parentElement.querySelector('strong')?.textContent || '');

    const docs = [firstDoc];
    if (pageUrls.length && !showingAll) {
        docs.length = 0;
        for (const url of pageUrls) {
            docs.push(await getDoc(url));
            await new Promise((r) => setTimeout(r, 200)); // stay under the request rate limit
        }
    }

    return docs.flatMap((doc) => parseProductionOverview(doc));
}

// Parse the village rows of one production overview page (desktop layout).
function parseProductionOverview(doc = document) {
    const toInt = (text) => parseInt(String(text).replace(/\D/g, ''), 10) || 0;
    const villages = [];
    for (const row of doc.querySelectorAll('#production_table .row_a, #production_table .row_b')) {
        const label = row.querySelector('.quickedit-vn');
        if (!label) continue;
        const text = row.querySelector('.quickedit-label').textContent.trim();
        const coords = [...text.matchAll(/(\d{1,3})\|(\d{1,3})/g)].pop();
        // Resource spans are 'res wood' normally but 'warn_90 wood' etc. when nearly full, so match on the type only
        const [merchantsHome, merchantsTotal] = row
            .querySelector("a[href*='screen=market']")
            .textContent.split('/')
            .map(toInt);

        villages.push({
            id: toInt(label.getAttribute('data-id')),
            name: text.replace(/\s*\(\d{1,3}\|\d{1,3}\)\s*K\d+\s*$/, ''),
            x: parseInt(coords[1], 10),
            y: parseInt(coords[2], 10),
            coord: coords[1] + '|' + coords[2],
            wood: toInt(row.cells[3].querySelector('.wood').textContent),
            stone: toInt(row.cells[3].querySelector('.stone').textContent),
            iron: toInt(row.cells[3].querySelector('.iron').textContent),
            capacity: toInt(row.cells[4].textContent),
            merchantsHome,
            merchantsTotal,
        });
    }
    return villages;
}
