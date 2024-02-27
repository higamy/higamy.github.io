/*
 * Script Name: Incomings Overview
 * Version: v3.1.0
 * Last Updated: 2023-10-30
 * Author: RedAlert
 * Author URL: https://twscripts.dev/
 * Author Contact: redalert_tw (Discord)
 * Approved: t14466468
 * Approved Date: 2020-01-09
 * Mod: JawJaw / MKich
 */

/*--------------------------------------------------------------------------------------
 * This script can NOT be cloned and modified without permission from the script author.
 --------------------------------------------------------------------------------------*/

// User Input
if (typeof DEBUG !== 'boolean') DEBUG = false;
if (typeof NOBLE_GAP === 'undefined') NOBLE_GAP = 100;
if (typeof FORMAT === 'undefined') FORMAT = '%unit% %origin% %player%';
if (typeof RETURNING_TROOPS_SIZE === 'undefined') RETURNING_TROOPS_SIZE = 1000;
if (typeof BACKTIME_GAP === 'undefined') BACKTIME_GAP = 30;

// Script Config
var scriptConfig = {
    scriptData: {
        prefix: 'incomingsOverview',
        name: 'Incomings Overview',
        version: 'v3.1.0',
        author: 'RedAlert',
        authorUrl: 'https://twscripts.dev/',
        helpLink:
            'https://forum.tribalwars.net/index.php?threads/incomings-overview.286459/',
    },
    translations: {
        en_DK: {
            'Incomings Overview': 'Incomings Overview',
            Help: 'Help',
            'It seems like you have no incomings 馃榾':
                'It seems like you have no incomings 馃榾',
            'Redirecting...': 'Redirecting...',
            'Total Incomings': 'Total Incomings',
            'Attacking Players': 'Attacking Players',
            'Destination Villages': 'Destination Villages',
            'Origin Villages': 'Origin Villages',
            'Attack Types': 'Attack Types',
            'OP Spotter': 'OP Spotter',
            'Tag Incomings': 'Tag Incomings',
            'Custom Tag Incomings': 'Custom Tag Incomings',
            'OP Spotter': 'OP Spotter',
            'Fake Finder': 'Fake Finder',
            'Watchtower Timer': 'Watchtower Timer',
            'Toggle Combinations': 'Toggle Combinations',
            'Own Village Info': 'Own Village Info',
            'Filter Incomings': 'Filter Incomings',
            'Tag incoming format': 'Tag incoming format',
            'Format field is required!': 'Format field is required!',
            'Only new and untagged incomings will be tagged!':
                'Only new and untagged incomings will be tagged!',
            'Watchtower Timer script initialized ...':
                'Watchtower Timer script initialized ...',
            'Watchtower Timer script is already initialized!':
                'Watchtower Timer script is already initialized!',
            'Current world does not support watchtower!':
                'Current world does not support watchtower!',
            'At least one coordinate is required!':
                'At least one coordinate is required!',
            'Fakes where found!': 'Fakes where found!',
            'No fakes where found!': 'No fakes where found!',
            'Fakes have been found and selected!':
                'Fakes have been found and selected!',
            'No fakes have been found!': 'No fakes have been found!',
            'Destination Villages': 'Destination Villages',
            'Origin Villages': 'Origin Villages',
            'Possible nobles have been found and highlighted!':
                'Possible nobles have been found and highlighted!',
            Attack: 'Attack',
            'Untagged incomings have been found!':
                'Untagged incomings have been found!',
            Support: 'Support',
            Fetch: 'Fetch',
            Overview: 'Overview',
            Village: 'Village',
            'Start time': 'Start time',
            'End time': 'End time',
            Player: 'Player',
            'Attack type': 'Attack type',
            'Origin village': 'Origin village',
            'Destination village': 'Destination village',
            'No incoming found that could fulfill all the criteria!':
                'No incoming found that could fulfill all the criteria!',
            All: 'All',
            'Mark Duplicates': 'Mark Duplicates',
            'Backtime Finder': 'Backtime Finder',
            'No returning commands found!': 'No returning commands found!',
            'No backtime was found!': 'No backtime was found!',
            'Return Time': 'Return Time',
            'Landing Time': 'Landing Time',
            Gap: 'Gap',
            Type: 'Type',
            Nuke: 'Nuke',
            'Fang/Fake': 'Fang/Fake',
        },
    },
    allowedMarkets: [],
    allowedScreens: ['overview_villages'],
    allowedModes: ['incomings'],
    isDebug: DEBUG,
    enableCountApi: true,
};

$.getScript(
    `https://twscripts.dev/scripts/twSDK.js?url=${document.currentScript.src}`,
    async function () {
        // Initialize Library
        await twSDK.init(scriptConfig);
        const scriptInfo = twSDK.scriptInfo();
        const isValidScreen = twSDK.checkValidLocation('screen');
        const isValidMode = twSDK.checkValidLocation('mode');
        const gameType = twSDK.getParameterByName('subtype');
        const totalIncomingAttacks = parseInt(game_data.player.incomings);

        const { worldConfig } = await fetchWorldConfig();

        // Entry point
        (async function () {
            // check if there are incomings
            if (!totalIncomingAttacks) {
                UI.InfoMessage(
                    twSDK.tt('It seems like you have no incomings 馃榾')
                );
                return;
            }

            // check that we are on the correct screen
            if (isValidScreen && isValidMode && gameType === 'attacks') {
                const pagesToFetch = twSDK.getPagesToFetch();
                if (pagesToFetch.length) {
                    twSDK.startProgressBar(pagesToFetch.length);
                    await twSDK.getAll(
                        pagesToFetch,
                        function (index, data) {
                            twSDK.updateProgressBar(index, pagesToFetch.length);

                            const htmlDoc = jQuery.parseHTML(data);
                            const incomingRows = jQuery(htmlDoc).find(
                                '#incomings_table tbody tr.nowrap'
                            );
                            jQuery('#incomings_table tbody:last-child').append(
                                incomingRows
                            );
                            jQuery(
                                '#incomings_table tbody tr:not(".nowrap"):eq(1)'
                            )
                                .detach()
                                .appendTo('#incomings_table tbody:last-child');
                        },
                        async function () {
                            await initIncomingsOverview();
                        },
                        function (error) {
                            UI.ErrorMessage('Error fetching incomings page!');
                            console.error(`${scriptInfo} Error:`, error);
                        }
                    );
                } else {
                    await initIncomingsOverview();
                }
            } else {
                UI.InfoMessage(twSDK.tt('Redirecting...'));
                twSDK.redirectTo(
                    'overview_villages&mode=incomings&subtype=attacks'
                );
            }
        })();

        // Initialize script
        async function initIncomingsOverview() {
            const incomings = await collectIncomingsList();
            const processedIncomings = processIncomings(incomings);

            // on script initialization events
            onInitHighlightPossibleNobles(processedIncomings);
            onInitFindUntaggedIncomings(processedIncomings);

            // build user interface
            buildUI(processedIncomings);

            // register action handlers
            handleTagIncomings(processedIncomings);
            handleCustomTagIncomings(processedIncomings);
            handleOpSpotter(processedIncomings);
            handleWatchtowerTimer(processedIncomings);
            handleFakeFinder(processedIncomings);
            handleToggleCombinations(processedIncomings);
            handleOwnVillageInfo(processedIncomings);
            handleFilterIncomings(processedIncomings);
            handleMarkDuplicates(processedIncomings);
            handleBacktimeFinder(processedIncomings);
        }

        // On script load highlight possible nobles
        function onInitHighlightPossibleNobles(processedIncomings) {
            const { landingTimes, incomingsObject } = processedIncomings;

            let foundPossibleNobleLandingTimes = [];
            let highlighted = 0;

            landingTimes.forEach((landingTime, index) => {
                const prevLandingTime = landingTimes[index - 1];
                const nextLandingTime = landingTimes[index + 1];

                const currentLandingTimeMs = parseInt(
                    landingTime.split(':')[3]
                );
                const prevLandingTimeMs = prevLandingTime
                    ? parseInt(prevLandingTime.split(':')[3])
                    : currentLandingTimeMs;
                const nextLandingTimeMs = nextLandingTime
                    ? parseInt(nextLandingTime.split(':')[3])
                    : currentLandingTimeMs;

                const timeDiffCurrentNext = Math.abs(
                    currentLandingTimeMs - nextLandingTimeMs
                );
                const timeDiffCurrentPrev = Math.abs(
                    currentLandingTimeMs - prevLandingTimeMs
                );
                if (
                    timeDiffCurrentNext === NOBLE_GAP ||
                    timeDiffCurrentPrev === NOBLE_GAP
                ) {
                    foundPossibleNobleLandingTimes.push(landingTime);
                }
            });

            foundPossibleNobleLandingTimes.forEach(
                (possibleNobleLandingTime) => {
                    Object.values(incomingsObject).forEach((incoming) => {
                        const { id, landingTime, distance } = incoming;
                        if (
                            possibleNobleLandingTime === landingTime &&
                            parseFloat(distance) <=
                                parseFloat(worldConfig.config.snob.max_dist)
                        ) {
                            jQuery(`#incomings_table tr input[name="id_${id}"]`)
                                .parent()
                                .parent()
                                .addClass('ra-possible-noble');
                            highlighted++;
                        }
                    });
                }
            );

            if (highlighted) {
                UI.SuccessMessage(
                    twSDK.tt('Possible nobles have been found and highlighted!')
                );
            }
        }

        // On script load find if there are untagged attacks
        function onInitFindUntaggedIncomings(processedIncomings) {
            setTimeout(() => {
                const { incomingsObject } = processedIncomings;
                let untaggedIncomingsHaveBeenFound = false;

                Object.values(incomingsObject).forEach((incoming) => {
                    const { label } = incoming;
                    if (label === twSDK.tt('Attack')) {
                        untaggedIncomingsHaveBeenFound = true;
                    }
                });

                if (untaggedIncomingsHaveBeenFound) {
                    UI.ErrorMessage(
                        twSDK.tt('Untagged incomings have been found!')
                    );
                }
            }, 1000);
        }

        // Render: Build the user interface
        function buildUI(processedIncomings) {
            const totalsHtml = buildTotalsHtml(processedIncomings);
            const opSpotterHtml = buildOpSpotterHtml(processedIncomings);
            const actionButtonsHtml = buildActionButtonsHtml();

            const content = `
                <div class="ra-mb15">
                    <div class="ra-flex">
                        <div>
                            ${totalsHtml}
                        </div>
                        <div>
                            ${opSpotterHtml}
                        </div>
                    </div>
                </div>
                <div class="ra-buttons">
                    ${actionButtonsHtml}
                </div>
            `;

            const customStyle = `
                .ra-flex { display: flex; flex-flow: row; gap: 15px; }
                .ra-flex div:nth-of-type(1) { width: 56%; }
                .ra-flex div:nth-of-type(2) { width: 46.5%; }
                .ra-textarea { height: 40px; }
                .ra-attack-types-table td { text-align: center; }
                .ra-op-spotter-chart { display: block; width: 100%; border: 2px solid #bd9c5a; }
                .ra-mr10 { margin-right: 10px; }
                .ra-player-item { display: inline-block; }
                .ra-reset-player-filter { color: #ff0000 !important; }
                .ra-input { display: block; width: 100%; height: auto; line-height: 1; padding: 5px; font-size: 14px; }
                .ra-possible-noble td { background-color: #ffe875 !important; }
                .ra-buttons { display: flex; flex-flow: row wrap; gap: 7px 5px; }
            `;

            twSDK.renderBoxWidget(
                content,
                scriptConfig.scriptData.prefix,
                'ra-incs-overview',
                customStyle
            );
        }

        // Event Handler: Handle tag incomings
        function handleTagIncomings(processedIncomings) {
            jQuery('#raMassTagBtn').on('click', function (e) {
                e.preventDefault();

                FORMAT = FORMAT.replace(/#/g, '%');

                if (FORMAT.match(/%backtime%/g) != null) {
                    FORMAT = ('`' + FORMAT + '`').replace(
                        /%backtime%/,
                        "%return%:${('00' + ((arrivalSeconds+parseInt('%duration%'.split(':')[2]))%60).toString()).slice(-2)}"
                    );
                }

                jQuery('input[name="label_format"]').val(FORMAT);

                let rows = jQuery('#incomings_table > tbody > tr')
                    .not(':first')
                    .not(':last');
                rows = jQuery.grep(
                    rows,
                    (obj) =>
                        jQuery('.quickedit-label', obj)[0].innerText.match(
                            /`.*`/g
                        ) != null
                );

                if (rows.length > 0) {
                    jQuery.map(rows, (obj, key) => {
                        setTimeout(() => {
                            let command = jQuery('td:nth-child(1)', obj)[0];
                            let arrivalTime = jQuery('td:nth-child(6)', obj)[0]
                                .innerText;
                            let arrivalSeconds = parseInt(
                                arrivalTime.split(':')[2]
                            );
                            let evalCommandTag;
                            try {
                                evalCommandTag = eval(command.innerText);
                            } catch (err) {
                                evalCommandTag = command.innerText;
                            }

                            jQuery('.rename-icon', command).click();
                            jQuery(
                                '.quickedit-edit input[type="text"]',
                                command
                            ).val(evalCommandTag);
                            jQuery(
                                '.quickedit-edit input[type="button"]',
                                command
                            ).click();
                        }, 160 * key);
                    });
                } else {
                    jQuery('#select_all').click();
                    jQuery('[name="label"]').click();
                }
            });

            if (jQuery('#raMassTagBtn').length) {
                document.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopImmediatePropagation();

                        jQuery('#raMassTagBtn').trigger('click');
                    }
                });
            }
        }

        // Event Handler: Handle tag incomings
        function handleCustomTagIncomings(processedIncomings) {
            jQuery('#raCustomTagIncomingsBtn').on('click', function (e) {
                e.preventDefault();

                const content = `
                    <div class="ra-mb15">
                        <input type="text" class="ra-input" id="raCustomTagValue" placeholder="${twSDK.tt(
                            'Tag incoming format'
                        )}" value="${FORMAT}" />
                    </div>
                    <div class="ra-mb15">
                        <a href="javascript:void(0);" class="btn" id="raCustomTagIncomingsDoBtn">
                            ${twSDK.tt('Tag Incomings')}
                        </a>
                    </div>
                    <div class="ra-mb15">
                        <small>${twSDK.tt(
                            'Only new and untagged incomings will be tagged!'
                        )}</small>
                    </div>
                `;

                twSDK.renderFixedWidget(
                    content,
                    `${scriptConfig.scriptData.prefix}-custom-tag`,
                    'ra-incomings-overview-custom-tag',
                    '',
                    '300px',
                    twSDK.tt('Custom Tag Incomings')
                );

                jQuery('#raCustomTagIncomingsDoBtn').on('click', function (e) {
                    e.preventDefault();

                    const customTag = jQuery('#raCustomTagValue').val();
                    if (customTag.trim().length === 0) {
                        UI.ErrorMessage(twSDK.tt('Format field is required!'));
                        return;
                    }

                    const isAnyIncomingChecked = jQuery(
                        '#incomings_table input[type="checkbox"]'
                    ).is(':checked');
                    if (!isAnyIncomingChecked) {
                        jQuery('#select_all').click();
                    }

                    jQuery('input[name="label_format"]')
                        .val(customTag)
                        .parents('form')
                        .find('input[name=label]')
                        .click();
                });
            });
        }

        // Event Handler: Handle op spotter
        function handleOpSpotter(processedIncomings) {
            jQuery('#raOpSpotterBtn').on('click', function (e) {
                e.preventDefault();

                const { arrivalTimesCount } = processedIncomings;

                const sortedArrivalTimesCount = Object.entries(
                    arrivalTimesCount
                ).sort((a, b) => b[1] - a[1]);

                const arrivalTimesTableRowsHtml = sortedArrivalTimesCount
                    .map((arrivalTime) => {
                        return `
                            <tr>
                                <td class="ra-tac">
                                    ${arrivalTime[0].substring(
                                        1,
                                        arrivalTime[0].length - 1
                                    )}
                                </td>
                                <td class="ra-tac">
                                    ${arrivalTime[1]}
                                </td>
                            </tr>
                        `;
                    })
                    .join('');

                const content = `
                    <div class="ra-mb15 ra-table-container">
                        <table class="ra-table ra-table-v3" width="100%">
                            <tbody>
                                ${arrivalTimesTableRowsHtml}
                            </tbody>
                        </table>
                    </div>
                `;

                twSDK.renderFixedWidget(
                    content,
                    `${scriptConfig.scriptData.prefix}-op-spotter`,
                    'ra-incomings-overview-op-spotter',
                    '',
                    '320px',
                    twSDK.tt('OP Spotter')
                );
            });
        }

        // Event Handler: Handle watchtower timer
        function handleWatchtowerTimer(processedIncomings) {
            jQuery('#raWatchtowerTimerBtn').on('click', function (e) {
                e.preventDefault();

                if (parseInt(worldConfig.config.game.watchtower)) {
                    if (jQuery('#incomings_table tr:eq(0) th').length === 7) {
                        UI.SuccessMessage(
                            twSDK.tt('Watchtower Timer script initialized ...')
                        );
                        $.getScript(
                            'https://dl.dropboxusercontent.com/s/dukcaol8u27wxg2/watchtower_timer.js'
                        );
                        console.debug(
                            'Watchtower Timer Script Link: https://forum.tribalwars.net/index.php?threads/watchtower-timer.285084/'
                        );
                    } else {
                        UI.ErrorMessage(
                            twSDK.tt(
                                'Watchtower Timer script is already initialized!'
                            )
                        );
                    }
                } else {
                    UI.ErrorMessage(
                        twSDK.tt('Current world does not support watchtower!')
                    );
                }
            });
        }

        // Event Handler: Handle fake finder
        function handleFakeFinder(processedIncomings) {
            jQuery('#raFakeFinderBtn').on('click', function (e) {
                e.preventDefault();

                const content = `
                    <div class="ra-mb15">
                        <textarea class="ra-textarea" id="raFakeFinderCoords"></textarea>
                    </div>
                    <div class="ra-mb15">
                        <a href="javascript:void(0);" class="btn" id="raFakeFinderDoBtn">
                            ${twSDK.tt('Fake Finder')}
                        </a>
                    </div>
                `;

                const customStyle = `
                    .ra-incomings-overview-fake-finder .ra-textarea { height: 80px; }
                `;

                twSDK.renderFixedWidget(
                    content,
                    `${scriptConfig.scriptData.prefix}-fake-finder`,
                    'ra-incomings-overview-fake-finder',
                    customStyle,
                    '320px',
                    twSDK.tt('Fake Finder')
                );

                jQuery('#raFakeFinderDoBtn').on('click', function (e) {
                    e.preventDefault();

                    const originCoordinates = jQuery('#raFakeFinderCoords')
                        .val()
                        .match(twSDK.coordsRegex);

                    if (originCoordinates && originCoordinates.length) {
                        // uncheck incomings
                        jQuery('#incomings_form input:checkbox').prop(
                            'checked',
                            false
                        );

                        const {
                            incomingsGrouppedByAttackingVillages,
                            incomingsObject,
                        } = processedIncomings;

                        let affectedRows = 0;

                        originCoordinates.forEach((originCoord) => {
                            Object.entries(
                                incomingsGrouppedByAttackingVillages
                            ).forEach(([coord, incomings]) => {
                                if (originCoord === coord) {
                                    incomings.forEach((incomingId) => {
                                        const { containsNoble, attackType } =
                                            incomingsObject[incomingId][
                                                'metadata'
                                            ];
                                        if (
                                            !containsNoble &&
                                            attackType === 'attack_small.png'
                                        ) {
                                            jQuery(
                                                `#incomings_table tr input[name="id_${incomingId}"]`
                                            ).prop('checked', true);
                                            affectedRows++;
                                        }
                                    });
                                }
                            });
                        });

                        if (affectedRows > 0) {
                            UI.SuccessMessage(
                                twSDK.tt('Fakes have been found and selected!')
                            );
                        } else {
                            UI.SuccessMessage(
                                twSDK.tt('No fakes have been found!')
                            );
                        }
                    } else {
                        UI.ErrorMessage(
                            twSDK.tt('At least one coordinate is required!')
                        );
                    }
                });
            });
        }

        // Event Handler: Handle toggle combinations origin/destination villages
        function handleToggleCombinations(processedIncomings) {
            jQuery('#raToggleCombinationsBtn').on('click', function (e) {
                e.preventDefault();

                const { uniqueAttackingVillages, uniqueDestinationVillages } =
                    processedIncomings;

                const destinationVillagesHtml = Object.values(
                    uniqueDestinationVillages
                )
                    .map((destinationVillage) => {
                        return buildCombinationRowHtml(destinationVillage);
                    })
                    .join('');

                const attackingVillagesHtml = Object.values(
                    uniqueAttackingVillages
                )
                    .map((destinationVillage) => {
                        return buildCombinationRowHtml(destinationVillage);
                    })
                    .join('');

                const content = `
                    <div class="ra-mb15 ra-table-container">
                        <div class="ra-flex">
                            <div>
                                <table class="ra-table ra-table-v3" width="100%">
                                    <thead>
                                        <tr>
                                            <th colspan="2">
                                                ${twSDK.tt(
                                                    'Destination Villages'
                                                )}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${destinationVillagesHtml}
                                    </tbody>
                                </table>
                            </div>
                            <div>
                                <table class="ra-table ra-table-v3" width="100%">
                                    <thead>
                                        <tr>
                                            <th colspan="2">
                                                ${twSDK.tt('Origin Villages')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${attackingVillagesHtml}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;

                const customStyle = `
                    .ra-incomings-overview-toggle-combinations .ra-table-v3 th,
                    .ra-incomings-overview-toggle-combinations .ra-table-v3 td { text-align: center; }
                `;

                twSDK.renderFixedWidget(
                    content,
                    `${scriptConfig.scriptData.prefix}-toggle-combinations`,
                    'ra-incomings-overview-toggle-combinations',
                    customStyle,
                    '540px',
                    twSDK.tt('Toggle Combinations')
                );
            });
        }

        // Event Handler: Show own village info
        function handleOwnVillageInfo(processedIncomings) {
            jQuery('#raOwnVillageInfoBtn').on('click', function (e) {
                e.preventDefault();

                const { uniqueDestinationVillages } = processedIncomings;

                const ownVillages = buildOwnVillagesTableHtml(
                    uniqueDestinationVillages
                );

                const content = `
                    <div class="ra-mb15 ra-table-container">
                        ${ownVillages}
                    </div>
                `;

                const customStyle = `
                    .ra-own-villages-table th,
                    .ra-own-villages-table td { text-align: center !important; }
                `;

                twSDK.renderFixedWidget(
                    content,
                    `${scriptConfig.scriptData.prefix}-own-villages-info`,
                    'ra-incomings-overview-own-villages-info',
                    customStyle,
                    '1024px',
                    twSDK.tt('Own Village Info')
                );

                jQuery('.ra-fetch-info-btn').on('click', function (e) {
                    e.preventDefault();

                    const villageId = jQuery(this).attr('data-village-id');

                    jQuery
                        .get(
                            game_data.link_base_pure +
                                `map&ajax=map_info&source=${villageId}&target=${villageId}&`
                        )
                        .then((response) => {
                            const { units, buildings, mood, flag } = response;
                            const { wall, farm } = buildings;

                            // collect total troops on village
                            const unitsCounts = [];
                            for (const [key, value] of Object.entries(units)) {
                                unitsCounts.push({
                                    unit: key,
                                    count:
                                        parseInt(value.count.home) +
                                        parseInt(value.count.foreign),
                                });
                            }

                            const wallLevel = highlightLevel(wall, 'wall');
                            const moodLevel = highlightLevel(mood, 'loyalty');
                            const farmLevel = highlightLevel(farm, 'farm');

                            // set village flag
                            jQuery(
                                `tr.village-id-${villageId} td.village-flag`
                            ).text(flag?.short_desc || 'N/A');

                            // set wall level
                            jQuery(
                                `tr.village-id-${villageId} td.building-loyalty`
                            ).html(moodLevel);
                            jQuery(
                                `tr.village-id-${villageId} td.ra-building-wall`
                            ).html(wallLevel);
                            jQuery(
                                `tr.village-id-${villageId} td.ra-building-farm`
                            ).html(farmLevel);

                            // set troop counts
                            unitsCounts.forEach((item) => {
                                const { unit, count } = item;
                                jQuery(
                                    `tr.village-id-${villageId} td.unit-${unit}`
                                ).text(twSDK.formatAsNumber(count));
                            });
                        });
                });
            });
        }

        // Event Handler: Handle filtering incomings
        function handleFilterIncomings(processedIncomings) {
            jQuery('#raFilterIncomingsBtn').on('click', function (e) {
                e.preventDefault();

                const {
                    landingTimes,
                    uniqueAttackingPlayers,
                    uniqueAttackingVillages,
                    uniqueDestinationVillages,
                    attackTypesFrequency,
                } = processedIncomings;

                const selectPlayerOptionsHtml = uniqueAttackingPlayers
                    .map((player) => {
                        const { id, name, count } = player;
                        return `
                            <option value="${id}">${name} (${count})</option>
                        `;
                    })
                    .join('');
                const selectPlayerHtml = `
                    <select id="raSelectPlayer" class="ra-input">
                        <option value="0">${twSDK.tt('All')}</option>
                        ${selectPlayerOptionsHtml}
                    </select>
                `;

                const selectAttackTypeOptionsHtml = Object.entries(
                    attackTypesFrequency
                ).map((attackType) => {
                    const attackTypeLabel = attackType[0].split('.')[0];
                    return `
                        <option value="${attackType[0]}">${attackTypeLabel} (${attackType[1]})</option>
                    `;
                });
                const selectAttackTypeHtml = `
                    <select id="raSelectAttackType" class="ra-input">
                        <option value="0">${twSDK.tt('All')}</option>
                        ${selectAttackTypeOptionsHtml}
                    </select>
                `;

                const selectOriginVillagesOptionsHtml = uniqueAttackingVillages
                    .map((player) => {
                        const { id, coord, count } = player;
                        return `
                            <option value="${coord}">${coord} (${count})</option>
                        `;
                    })
                    .join('');
                const selectOriginVillageHtml = `
                    <select id="raSelectOriginVillage" class="ra-input">
                        <option value="0">${twSDK.tt('All')}</option>
                        ${selectOriginVillagesOptionsHtml}
                    </select>
                `;

                const selectDestinationVillageOptionsHtml =
                    uniqueDestinationVillages
                        .map((player) => {
                            const { coord, count } = player;
                            return `
                                <option value="${coord}">${coord} (${count})</option>
                            `;
                        })
                        .join('');
                const selectDestinationVillageHtml = `
                    <select id="raSelectDestinationVillage" class="ra-input">
                        <option value="0">${twSDK.tt('All')}</option>
                        ${selectDestinationVillageOptionsHtml}
                    </select>
                `;

                const startTime = getDate(landingTimes[0], 'start');
                const endTime = getDate(landingTimes.slice(-1)[0], 'end');

                const content = `
                    <div class="ra-mb15">
                        <div class="ra-grid ra-grid-4">
                            <div>
                                <label for="raSelectPlayer" class="ra-label">
                                    ${twSDK.tt('Player')}
                                </label>
                                ${selectPlayerHtml}
                            </div>
                            <div>
                                <label for="raSelectAttackType" class="ra-label">
                                    ${twSDK.tt('Attack type')}
                                </label>
                                ${selectAttackTypeHtml}
                            </div>
                            <div>
                                <label for="raSelectOriginVillage" class="ra-label">
                                    ${twSDK.tt('Origin village')}
                                </label>
                                ${selectOriginVillageHtml}
                            </div>
                            <div>
                                <label for="raSelectDestinationVillage" class="ra-label">
                                    ${twSDK.tt('Destination village')}
                                </label>
                                ${selectDestinationVillageHtml}
                            </div>
                        </div>
                    </div>
                    <div class="ra-mb15">
                        <div class="ra-grid ra-grid-2">
                            <div>
                                <label for="raStartTime" class="ra-label">
                                    ${twSDK.tt('Start time')}
                                </label>
                                <input type="text" class="ra-input" id="raStartTime" name="raStartTime" value="${startTime}" />
                            </div>
                            <div>
                                <label for="raStartTime" class="ra-label">
                                    ${twSDK.tt('End time')}
                                </label>
                                <input type="text" class="ra-input" id="raEndTime" name="raEndTime" value="${endTime}" />
                            </div>
                        </div>
                    </div>
                    <div class="ra-mb15">
                        <a href="javascript:void(0);" class="btn" id="raFilterIncomingsDoBtn">
                            ${twSDK.tt('Filter Incomings')}
                        </a>
                    </div>
                `;

                const customStyle = `
                    .ra-grid { display: grid; gap: 15px; }
                    .ra-grid-2 { grid-template-columns: 1fr 1fr; }
                    .ra-grid-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
                    .ra-label { display: block; width: 100%; margin-bottom: 5px; font-weight: 600; }
                    tr.ra-filtered-incoming td { background-color: red !important; }
                `;

                twSDK.renderFixedWidget(
                    content,
                    `${scriptConfig.scriptData.prefix}-filter-incomings`,
                    'ra-incomings-overview-filter-incomings',
                    customStyle,
                    '768px',
                    twSDK.tt('Filter Incomings')
                );

                handleDoFilterIncomings(processedIncomings);
            });
        }

        // Event Handler: Filter the incomings based on user input
        function handleDoFilterIncomings(processedIncomings) {
            jQuery('#raFilterIncomingsDoBtn').on('click', function (e) {
                e.preventDefault();

                jQuery('#incomings_table tr').removeClass(
                    'ra-filtered-incoming'
                );

                const chosenPlayer = jQuery('#raSelectPlayer').val();
                const chosenAttackType = jQuery('#raSelectAttackType').val();
                const chosenOriginVillage = jQuery(
                    '#raSelectOriginVillage'
                ).val();
                const chosenDestinationVillage = jQuery(
                    '#raSelectDestinationVillage'
                ).val();
                const chosenStartTime = jQuery('#raStartTime').val();
                const chosenEndTime = jQuery('#raEndTime').val();

                const {
                    incomingsGrouppedByPlayer,
                    incomingsGrouppedByDestinationVillages,
                    incomingsGrouppedByAttackingVillages,
                    incomingsGrouppedByType,
                    incomingsObject,
                    incomingIds,
                } = processedIncomings;

                let incomingsByChosenPlayer = incomingsGrouppedByPlayer[
                    chosenPlayer
                ] ?? [...incomingIds];
                let incomingsForChosenAttackType = incomingsGrouppedByType[
                    chosenAttackType
                ] ?? [...incomingIds];
                let incomingsFromChosenOriginVillage =
                    incomingsGrouppedByAttackingVillages[
                        chosenOriginVillage
                    ] ?? [...incomingIds];
                let incomingsOnChosenDestinationVillage =
                    incomingsGrouppedByDestinationVillages[
                        chosenDestinationVillage
                    ] ?? [...incomingIds];

                let filteredIncomingsByLandingTime = Object.values(
                    incomingsObject
                )
                    .filter((incoming) => {
                        const { landingTime } = incoming;
                        const landingTimeObject = new Date(
                            getDate(landingTime, 'full')
                        );
                        const chosenStartTimeObject = new Date(chosenStartTime);
                        const chosenEndTimeObject = new Date(chosenEndTime);

                        if (
                            landingTimeObject >= chosenStartTimeObject &&
                            landingTimeObject <= chosenEndTimeObject
                        ) {
                            return incoming;
                        }
                    })
                    .map((incoming) => incoming.id);

                const filteredIncomings = twSDK.arraysIntersection(
                    incomingsByChosenPlayer,
                    incomingsForChosenAttackType,
                    incomingsFromChosenOriginVillage,
                    incomingsOnChosenDestinationVillage,
                    filteredIncomingsByLandingTime
                );

                if (filteredIncomings.length) {
                    filteredIncomings.forEach((incomingId) => {
                        jQuery(
                            `#incomings_table tr input[name="id_${incomingId}"]`
                        )
                            .parent()
                            .parent()
                            .addClass('ra-filtered-incoming');
                    });
                } else {
                    UI.ErrorMessage(
                        twSDK.tt(
                            'No incoming found that could fulfill all the criteria!'
                        )
                    );
                }
            });
        }

        // Event Handler: Rename duplicate incomings from same origin village
        function handleMarkDuplicates(processedIncomings) {
            jQuery('#raMarkDuplicatesBtn').on('click', function (e) {
                e.preventDefault();

                const {
                    incomingsObject,
                    incomingsGrouppedByAttackingVillages,
                } = processedIncomings;

                const incomingsToBeRenamed = [];

                Object.values(incomingsGrouppedByAttackingVillages).forEach(
                    (incomings) => {
                        incomings.forEach((incomingId, index) => {
                            let nameOfIncomingCommand =
                                incomingsObject[incomingId].label;
                            nameOfIncomingCommand = nameOfIncomingCommand
                                .split('AS:')[0]
                                .trim();
                            nameOfIncomingCommand = `${nameOfIncomingCommand} AS:${
                                index + 1
                            }/${incomings.length}`;

                            incomingsToBeRenamed.push({
                                id: incomingId,
                                label: nameOfIncomingCommand,
                            });
                        });
                    }
                );

                incomingsToBeRenamed.forEach((item, index) => {
                    setTimeout(function () {
                        index++;
                        const { id, label } = item;
                        jQuery('span.quickedit[data-id="' + id + '"]')
                            .find('.rename-icon')
                            .click();
                        jQuery('span.quickedit[data-id="' + id + '"]')
                            .find('input[type=text]')
                            .val(label);
                        jQuery('span.quickedit[data-id="' + id + '"]')
                            .find('input[type=button]')
                            .click();
                        UI.InfoMessage(
                            `${index}/${incomingsToBeRenamed.length}`
                        );
                    }, 160 * index);
                });
            });
        }

        // Event Handler: Find backtimes an enemy player might have sent at you
        function handleBacktimeFinder(processedIncomings) {
            jQuery('#raBacktimeFinderBtn').on('click', async function (e) {
                e.preventDefault();

                const { incomingsObject } = processedIncomings;
                const commands = await fetchCommandsPage();
                const foundBacktimes = [];

                if (!commands.length) {
                    UI.InfoMessage(twSDK.tt('No returning commands found!'));
                    return;
                }

                commands.forEach((command) => {
                    const { origin, returnTime, units, farmSpace } = command;
                    Object.values(incomingsObject).forEach((incoming) => {
                        const { landingTime, destination } = incoming;
                        const { coord } = destination;

                        // find villages which are both under and have returning commands
                        // then check for landing time of the incoming attack to be withing RETURN_TIME + BACKTIME_GAPs
                        if (coord === origin) {
                            const landingTimeInt =
                                getLandingTime(landingTime).getTime() / 1000;
                            const returnTimeInt =
                                getLandingTime(returnTime).getTime() / 1000;
                            const gapBetweenTimes =
                                landingTimeInt - returnTimeInt; // seconds

                            if (gapBetweenTimes <= BACKTIME_GAP) {
                                foundBacktimes.push({
                                    landingTime: landingTime,
                                    destination: destination,
                                    returnTime: returnTime,
                                    gapBetweenTimes: gapBetweenTimes,
                                    returnAmount: farmSpace,
                                });
                            }
                        }
                    });
                });

                if (!foundBacktimes.length) {
                    UI.InfoMessage(twSDK.tt('No backtime was found!'));
                    return;
                }

                let backtimeRows = buildBackTimesTableHtml(foundBacktimes);

                const content = `
                    <div class="ra-mb15">
                        ${backtimeRows}
                    </div>
                `;

                const customStyle = `
                    .ra-incomings-overview-backtime-finder th,
                    .ra-incomings-overview-backtime-finder td { text-align: center !important; }
                `;

                twSDK.renderFixedWidget(
                    content,
                    `${scriptConfig.scriptData.prefix}-backtime-finder`,
                    'ra-incomings-overview-backtime-finder',
                    customStyle,
                    '768px',
                    twSDK.tt('Backtime Finder')
                );
            });
        }

        // Helper: Build the totals elements
        function buildTotalsHtml(processedIncomings) {
            const {
                uniqueAttackingPlayers,
                uniqueAttackingVillages,
                uniqueDestinationVillages,
                attackTypesFrequency,
            } = processedIncomings;

            const uniqueAttackingPlayersHtml = uniqueAttackingPlayers
                .map((player) => {
                    const { id, name, count } = player;
                    return `
                        <span class="ra-mr10 ra-player-item">
                            <a href="/game.php?screen=info_player&id=${id}" target="_blank" rel="noopener referrer">
                                ${name}
                            </a>
                            <b>(${count})</b>
                        </span>
                    `;
                })
                .join('');

            const uniqueAttackingVillagesHtml = uniqueAttackingVillages
                .map((village) => {
                    const { coord } = village;
                    return coord;
                })
                .join(' ');

            const uniqueDestinationVillagesHtml = uniqueDestinationVillages
                .map((village) => {
                    const { coord } = village;
                    return coord;
                })
                .join(' ');

            const attackTypesHtml =
                buildAttackTypesTableHtml(attackTypesFrequency);

            let totalsHtml = `
                <table class="ra-table ra-table-v3" width="100%">
                    <tbody>
                        <tr>
                            <td width="40%">
                                <b>${twSDK.tt('Total Incomings')}</b>
                            </td>
                            <td>
                                ${twSDK.formatAsNumber(totalIncomingAttacks)}
                            </td>
                        </tr>
                        <tr>
                            <td width="40%">
                                <b>${twSDK.tt('Attacking Players')} (${
                uniqueAttackingPlayers.length
            })</b>
                            </td>
                            <td>
                                ${uniqueAttackingPlayersHtml}
                            </td>
                        </tr>
                        <tr>
                            <td width="40%">
                                <b>${twSDK.tt('Destination Villages')} (${
                uniqueDestinationVillages.length
            })</b>
                            </td>
                            <td>
                                <textarea class="ra-textarea">${uniqueDestinationVillagesHtml}</textarea>
                            </td>
                        </tr>
                        <tr>
                            <td width="40%">
                                <b>${twSDK.tt('Origin Villages')} (${
                uniqueAttackingVillages.length
            })</b>
                            </td>
                            <td>
                                <textarea class="ra-textarea">${uniqueAttackingVillagesHtml}</textarea>
                            </td>
                        </tr>
                        <tr>
                            <td width="40%">
                                <b>${twSDK.tt('Attack Types')}</b>
                            </td>
                            <td>
                                ${attackTypesHtml}
                            </td>
                        </tr>
                    </tbody>
                </table>
            `;

            return totalsHtml;
        }

        // Helper: Build a combination village info
        function buildCombinationRowHtml(village) {
            const { id, coord, count } = village;
            return `
                <tr>
                    <td>
                        <a href="/game.php?screen=info_village&id=${id}" target="_blank" rel="noopener noreferrer">
                            ${coord}
                        </a>
                    </td>
                    <td>
                        ${count}
                    </td>
                </tr>
            `;
        }

        // Helper: Build the attack types table
        function buildAttackTypesTableHtml(attackTypesFrequency) {
            return `
                <table width="100%" class="ra-table ra-attack-types-table">
                    <tbody>
                        <tr>
                            <td>
                                <img src="/graphic/command/snob.png" />
                            </td>
                            <td>
                                ${
                                    attackTypesFrequency['snob.png'] ?? 0
                                }/${totalIncomingAttacks}
                            </td>
                            <td>
                                ${twSDK.calculatePercentages(
                                    attackTypesFrequency['snob.png'],
                                    totalIncomingAttacks
                                )}%
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <img src="/graphic/command/attack_large.png" />
                            </td>
                            <td>
                                ${
                                    attackTypesFrequency['attack_large.png'] ??
                                    0
                                }/${totalIncomingAttacks}
                            </td>
                            <td>
                                ${twSDK.calculatePercentages(
                                    attackTypesFrequency['attack_large.png'],
                                    totalIncomingAttacks
                                )}%
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <img src="/graphic/command/attack_medium.png" />
                            </td>
                            <td>
                                ${
                                    attackTypesFrequency['attack_medium.png'] ??
                                    0
                                }/${totalIncomingAttacks}
                            </td>
                            <td>
                                ${twSDK.calculatePercentages(
                                    attackTypesFrequency['attack_medium.png'],
                                    totalIncomingAttacks
                                )}%
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <img src="/graphic/command/attack_small.png" />
                            </td>
                            <td>
                                ${
                                    attackTypesFrequency['attack_small.png'] ??
                                    0
                                }/${totalIncomingAttacks}
                            </td>
                            <td>
                                ${twSDK.calculatePercentages(
                                    attackTypesFrequency['attack_small.png'],
                                    totalIncomingAttacks
                                )}%
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <img src="/graphic/command/attack.png" />
                            </td>
                            <td>
                                ${
                                    attackTypesFrequency['attack.png'] ?? 0
                                }/${totalIncomingAttacks}
                            </td>
                            <td>
                                ${twSDK.calculatePercentages(
                                    attackTypesFrequency['attack.png'],
                                    totalIncomingAttacks
                                )}%
                            </td>
                        </tr>
                    </tbody>
                </table>
            `;
        }

        // Helper: Build op spotter chart
        function buildOpSpotterHtml(processedIncomings) {
            const { arrivalTimesCount } = processedIncomings;

            const arrivalTimesKeys = Object.keys(arrivalTimesCount);
            const arrivalTimesValues = Object.values(arrivalTimesCount);
            const chartOptions = encodeURIComponent(
                `{"type":"bar","data":{"labels":[${arrivalTimesKeys}],"datasets":[{"label":"${twSDK.tt(
                    'OP Spotter'
                )}","data":[${arrivalTimesValues}]}]}}`
            );
            // Charts generated using QuickChart (https://quickchart.io/)
            // There is a built-in rate limit of 60 charts/min (1 chart/sec) per IP for free users.
            // https://quickchart.io/documentation/#faq
            return `<img class="ra-op-spotter-chart" src="https://quickchart.io/chart?bkg=white&c=${chartOptions}" />`;
        }

        // Helper: Build the action buttons
        function buildActionButtonsHtml() {
            return `
                <a href="javascript:void(0);" class="btn" id="raMassTagBtn">
                    ${twSDK.tt('Tag Incomings')}
                </a>
                <a href="javascript:void(0);" class="btn" id="raCustomTagIncomingsBtn">
                    ${twSDK.tt('Custom Tag Incomings')}
                </a>
                <a href="javascript:void(0);" class="btn" id="raOpSpotterBtn">
                    ${twSDK.tt('OP Spotter')}
                </a>
                <a href="javascript:void(0);" class="btn" id="raWatchtowerTimerBtn">
                    ${twSDK.tt('Watchtower Timer')}
                </a>
                <a href="javascript:void(0);" class="btn" id="raFakeFinderBtn">
                    ${twSDK.tt('Fake Finder')}
                </a>
                <a href="javascript:void(0);" class="btn" id="raToggleCombinationsBtn">
                    ${twSDK.tt('Toggle Combinations')}
                </a>
                <a href="javascript:void(0);" class="btn" id="raOwnVillageInfoBtn">
                    ${twSDK.tt('Own Village Info')}
                </a>
                <a href="javascript:void(0);" class="btn" id="raFilterIncomingsBtn">
                    ${twSDK.tt('Filter Incomings')}
                </a>
                <a href="javascript:void(0);" class="btn" id="raMarkDuplicatesBtn">
                    ${twSDK.tt('Mark Duplicates')}
                </a>
                <a href="javascript:void(0);" class="btn" id="raBacktimeFinderBtn">
                    ${twSDK.tt('Backtime Finder')}
                </a>
            `;
        }

        // Helper: Build own  villages table
        function buildOwnVillagesTableHtml(villages) {
            let thVillageUnits = ``;
            let tdVillageUnits = ``;

            game_data.units.forEach((unit) => {
                if (unit !== 'militia') {
                    thVillageUnits += `<th><img src="/graphic/unit/unit_${unit}.png"></th>`;
                    tdVillageUnits += `<td class="unit-${unit}"></td>`;
                }
            });

            let villagesTable = `
                <table class="ra-table ra-table-v3 ra-own-villages-table" width="100%">
                    <thead>
                        <tr>
                            <th>${twSDK.tt('Overview')}</th>
                            <th>${twSDK.tt('Village')}</th>
                            <th>${twSDK.tt('Support')}</th>
                            <th>${twSDK.tt('Fetch')}</th>
                            <th><span class="icon header flags"></span></th>
                            <th><img src="/graphic/buildings/snob.png"></th>
                            <th><img src="/graphic/buildings/wall.png"></th>
                            <th><img src="/graphic/buildings/farm.png"></th>
                            ${thVillageUnits}
                        </tr>
                    </thead>
                    <tbody>
            `;

            villages.forEach((village) => {
                const { id, coord, count } = village;

                villagesTable += `
                    <tr class="village-id-${id}">
                        <td>
                            <a href="/game.php?village=${id}&screen=overview" target="_blank" rel="noopener noreferrer">
                                ${coord}
                            </a> (${count})
                        </td>
                        <td>
                            <a href="${
                                game_data.link_base_pure
                            }info_village&id=${id}" target="_blank" rel="noopener noreferrer">
                                ${coord}
                            </a>
                        </td>
                        <td>
                            <a href="${
                                game_data.link_base_pure
                            }place&mode=call&target=${id}&village=${id}" class="btn ra-ask-support-btn" target="_blank" rel="noopener noreferrer">
                                ${twSDK.tt('Support')}
                            </a>
                        </td>
                        <td>
                            <a href="javascript:void(0);" class="ra-fetch-info-btn btn" data-village-id="${id}">
                                ${twSDK.tt('Fetch')}
                            </a>
                        </td>
                        <td class="village-flag"></td>
                        <td class="building-loyalty"></td>
                        <td class="ra-building-wall"></td>
                        <td class="ra-building-farm"></td>
                        ${tdVillageUnits}
                    </tr>
                `;
            });

            villagesTable += `</tbody></table>`;

            return villagesTable;
        }

        // Helper: Build the backtimes table
        function buildBackTimesTableHtml(backtimes) {
            let backtimesTableHtml = `
                <table class="ra-table ra-table-v3" width="100%">
                    <thead>
                        <tr>
                            <th>
                                #
                            </th>
                            <th>
                                ${twSDK.tt('Village')}
                            </th>
                            <th>
                                ${twSDK.tt('Return Time')}
                            </th>
                            <th>
                                ${twSDK.tt('Landing Time')}
                            </th>
                            <th>
                                ${twSDK.tt('Gap')}
                            </th>
                            <th>
                                ${twSDK.tt('Type')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            backtimesTableHtml += backtimes
                .map((backtime, index) => {
                    index++;
                    const {
                        destination,
                        landingTime,
                        returnTime,
                        returnAmount,
                        gapBetweenTimes,
                    } = backtime;

                    return `
                        <tr>
                            <td>${index}</td>
                            <td>
                                <a href="/game.php?village=${
                                    destination.id
                                }&screen=overview" target="_blank" rel="noopener noreferrer">
                                    ${destination.coord}
                                </a>
                            </td>
                            <td>
                                ${returnTime}
                            </td>
                            <td>
                                ${landingTime}
                            </td>
                            <td>
                                ${gapBetweenTimes}s
                            </td>
                            <td>
                                ${
                                    returnAmount > 5000
                                        ? twSDK.tt('Nuke')
                                        : twSDK.tt('Fang/Fake')
                                }
                            </td>
                        </tr>
                    `;
                })
                .join('');

            backtimesTableHtml += `</tbody></table>`;

            return backtimesTableHtml;
        }

        // Helper: Collect incomings
        async function collectIncomingsList() {
            let incomingsObject = {};

            jQuery('#incomings_table tbody tr.nowrap').each((_, incoming) => {
                const incomingId = parseInt(
                    jQuery(incoming).find('span.quickedit').attr('data-id')
                );
                const attackType = jQuery(incoming)
                    .find('td:eq(0)')
                    .find('img')
                    .attr('src')
                    .split('/')
                    .pop()
                    .split('#')[0]
                    .split('?')[0];
                const containsNoble =
                    jQuery(incoming)
                        .find('td:eq(0)')
                        .find('img:eq(1)')
                        .attr('src') &&
                    jQuery(incoming)
                        .find('td:eq(0)')
                        .find('img:eq(1)')
                        .attr('src')
                        .split('/')
                        .pop()
                        .split('#')[0]
                        .split('?')[0] === 'snob.png'
                        ? true
                        : false;

                const incomingData = {
                    id: incomingId,
                    label: jQuery(incoming)
                        .find('span.quickedit-label')
                        .text()
                        .trim(),
                    attacker: {
                        id: parseInt(
                            jQuery(incoming)
                                .find('td:eq(3) a')
                                .attr('href')
                                .split('id=')[1]
                        ),
                        name: jQuery(incoming).find('td:eq(3)').text().trim(),
                    },
                    destination: {
                        id: parseInt(
                            jQuery(incoming)
                                .find('td:eq(1) a')
                                .attr('href')
                                .split('village=')[1]
                        ),
                        coord: jQuery(incoming)
                            .find('td:eq(1)')
                            .text()
                            .match(twSDK.coordsRegex)[0],
                    },
                    origin: {
                        id: parseInt(
                            jQuery(incoming)
                                .find('td:eq(2) a')
                                .attr('href')
                                .split('id=')[1]
                        ),
                        coord: jQuery(incoming)
                            .find('td:eq(2)')
                            .text()
                            .match(twSDK.coordsRegex)[0],
                    },
                    landingTime: twSDK.getTimeFromString(
                        jQuery(incoming).find('td:eq(5)').text().trim()
                    ),
                    arrivesIn: jQuery(incoming).find('td:eq(6)').text().trim(),
                    distance: jQuery(incoming).find('td:eq(4)').text().trim(),
                    metadata: {
                        attackType: attackType,
                        containsNoble: containsNoble,
                    },
                };

                incomingsObject = {
                    ...incomingsObject,
                    [incomingId]: incomingData,
                };
            });

            return incomingsObject;
        }

        // Helper: Process incomings data
        function processIncomings(incomingsObject) {
            const attackingPlayers = [];
            const attackingVillages = [];
            const destinationVillages = [];
            const landingTimes = [];
            const incomingTypes = [];
            const arrivals = [];
            const incomingIds = [];

            const incomings = Object.values(incomingsObject);

            incomings.forEach((incoming) => {
                let {
                    id,
                    attacker,
                    destination,
                    origin,
                    landingTime,
                    metadata,
                    arrivesIn,
                } = incoming;

                let { containsNoble } = metadata;
                if (containsNoble) {
                    metadata = {
                        ...metadata,
                        attackType: 'snob.png',
                    };
                }

                attackingPlayers.push(attacker);
                attackingVillages.push(origin);
                destinationVillages.push(destination);
                landingTimes.push(landingTime);
                incomingTypes.push(metadata);
                arrivals.push(arrivesIn);
                incomingIds.push(id);
            });

            let uniqueAttackingPlayers = twSDK.removeDuplicateObjectsFromArray(
                attackingPlayers,
                'name'
            );
            let uniqueAttackingVillages = twSDK.removeDuplicateObjectsFromArray(
                attackingVillages,
                'id'
            );
            let uniqueDestinationVillages =
                twSDK.removeDuplicateObjectsFromArray(
                    destinationVillages,
                    'id'
                );

            let attackingPlayerNames = attackingPlayers.map(
                (player) => player.name
            );
            let attackingVillagesIds = attackingVillages.map(
                (village) => village.id
            );
            let destinationVillagesIds = destinationVillages.map(
                (village) => village.id
            );
            let attackTypesList = incomingTypes.map((incMetadata) => {
                const { attackType } = incMetadata;
                return attackType;
            });

            let attackingPlayersFrequency =
                twSDK.frequencyCounter(attackingPlayerNames);
            let attackingVillagesFrequency =
                twSDK.frequencyCounter(attackingVillagesIds);
            let destinationVillagesFrequency = twSDK.frequencyCounter(
                destinationVillagesIds
            );
            let attackTypesFrequency = twSDK.frequencyCounter(attackTypesList);

            let incomingsGrouppedByPlayer = groupIncomingsByPlayer(
                incomings,
                uniqueAttackingPlayers
            );
            let incomingsGrouppedByAttackingVillages = groupIncomingsByVillage(
                incomings,
                attackingVillages,
                'origin'
            );
            let incomingsGrouppedByDestinationVillages =
                groupIncomingsByVillage(
                    incomings,
                    destinationVillages,
                    'destination'
                );
            let incomingsGrouppedByType = groupIncomingsByType(
                incomings,
                incomingTypes
            );

            const arrivalTimes = getArrivalTimes(arrivals);
            const arrivalTimesCount = twSDK.frequencyCounter(arrivalTimes);

            uniqueAttackingPlayers = uniqueAttackingPlayers.map((player) => {
                return {
                    ...player,
                    count: attackingPlayersFrequency[player.name],
                };
            });

            uniqueAttackingVillages = uniqueAttackingVillages.map((village) => {
                return {
                    ...village,
                    count: attackingVillagesFrequency[village.id],
                };
            });

            uniqueDestinationVillages = uniqueDestinationVillages.map(
                (village) => {
                    return {
                        ...village,
                        count: destinationVillagesFrequency[village.id],
                    };
                }
            );

            // sort arrays of data
            uniqueAttackingPlayers.sort((a, b) => b.count - a.count);
            uniqueAttackingVillages.sort((a, b) => b.count - a.count);
            uniqueDestinationVillages.sort((a, b) => b.count - a.count);
            landingTimes.sort(compareDates);

            return {
                landingTimes,
                incomingTypes,
                uniqueAttackingPlayers,
                uniqueAttackingVillages,
                uniqueDestinationVillages,
                attackTypesFrequency,
                incomingsGrouppedByPlayer,
                incomingsGrouppedByDestinationVillages,
                incomingsGrouppedByAttackingVillages,
                incomingsGrouppedByType,
                arrivals,
                arrivalTimesCount,
                incomingsObject,
                incomingIds,
            };
        }

        // Helper: Group incomings by player
        function groupIncomingsByPlayer(incomings, attackingPlayers) {
            let grouppedIncomings = {};

            attackingPlayers.forEach((player) => {
                const incomingsByPlayer = [];
                incomings.forEach((incoming) => {
                    const { id: incomingId, attacker } = incoming;
                    if (attacker.id === player.id) {
                        incomingsByPlayer.push(incomingId);
                        grouppedIncomings = {
                            ...grouppedIncomings,
                            [player.id]: incomingsByPlayer,
                        };
                    }
                });
            });

            return grouppedIncomings;
        }

        // Helper: Group incomings by village
        function groupIncomingsByVillage(incomings, villages, type) {
            let grouppedIncomings = {};

            villages.forEach((village) => {
                const incomingsByVillage = [];
                incomings.forEach((incoming) => {
                    const { id: incomingId, origin, destination } = incoming;
                    const { id: originId, coord: originCoord } = origin;
                    const { id: destinationId, coord: destinationCoord } =
                        destination;

                    if (type === 'origin') {
                        if (village.id === originId) {
                            incomingsByVillage.push(incomingId);
                            grouppedIncomings = {
                                ...grouppedIncomings,
                                [originCoord]: incomingsByVillage,
                            };
                        }
                    } else if (type === 'destination') {
                        if (village.id === destinationId) {
                            incomingsByVillage.push(incomingId);
                            grouppedIncomings = {
                                ...grouppedIncomings,
                                [destinationCoord]: incomingsByVillage,
                            };
                        }
                    }
                });
            });

            return grouppedIncomings;
        }

        // Helper: Group incomings by incoming type
        function groupIncomingsByType(incomings, incomingTypes) {
            let grouppedIncomings = {};

            incomingTypes.forEach((incomingType) => {
                const { attackType } = incomingType;
                const incomingsByType = [];
                incomings.forEach((incoming) => {
                    const { id, metadata } = incoming;
                    if (
                        metadata.attackType === attackType ||
                        (metadata.containsNoble && attackType === 'snob.png')
                    ) {
                        incomingsByType.push(id);
                        grouppedIncomings = {
                            ...grouppedIncomings,
                            [attackType]: incomingsByType,
                        };
                    }
                });
            });

            return grouppedIncomings;
        }

        // Helper: Get arrival times
        function getArrivalTimes(arrivals) {
            const arrivalTimes = [];
            const currentServerTime = twSDK.getServerDateTimeObject();

            arrivals.forEach((arrival) => {
                const [hours, minutes, seconds] = arrival.split(':');
                const totalSeconds = +hours * 3600 + +minutes * 60 + +seconds;
                const arrivalDateTime = new Date(
                    currentServerTime.getTime() + totalSeconds * 1000
                );

                let arrivalMonth = arrivalDateTime.getMonth();
                let arrivalDate = arrivalDateTime.getDate();
                let arrivalHour = '' + arrivalDateTime.getHours();

                arrivalMonth = arrivalMonth + 1;
                arrivalMonth = '' + arrivalMonth;
                arrivalMonth = arrivalMonth.padStart(2, '0');

                arrivalHour = arrivalHour.padStart(2, '0');

                arrivalTimes.push(
                    `"${arrivalDate}/${arrivalMonth} ${arrivalHour}H"`
                );
            });

            arrivalTimes.sort((a, b) => a - b);
            return arrivalTimes;
        }

        // Helper: Highlight level differently
        function highlightLevel(level, type) {
            let levelOutput = level;
            if (type === 'wall') {
                if (level != 20) {
                    levelOutput = `<span><b>${level}</b></span>`;
                }
            }
            if (type === 'loyalty') {
                if (level <= 70) {
                    levelOutput = `<span style="color:#ff6f00;"><b>${level}</b></span>`;
                }
                if (level <= 35) {
                    levelOutput = `<span style="color:#ff0000;"><b>${level}</b></span>`;
                }
            }
            if (type === 'farm') {
                if (level < 30) {
                    levelOutput = `<span style="color:#ff6f00;"><b>${level}</b></span>`;
                }
            }
            return levelOutput;
        }

        // Helper: Get date for input type date in the format 2018-06-12T19:30
        function getDate(landingTime, type) {
            const [date, time] = landingTime.split(' ');
            const [day, month, year] = date.split('/');
            const [hour, minutes, seconds, milliseconds] = time.split(':');
            if (type === 'start') {
                return `${year}-${month}-${day} 00:00`;
            } else if (type === 'end') {
                return `${year}-${month}-${day} 23:59`;
            } else if (type === 'full') {
                return `${year}-${month}-${day}T${hour}:${minutes}`;
            } else {
                return '';
            }
        }

        // Helper: Compare dates
        function compareDates(a, b) {
            const dateA = new Date(
                a.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3')
            );
            const dateB = new Date(
                b.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3')
            );
            return dateA - dateB;
        }

        // Helper: Get landing time date object
        function getLandingTime(landingTime) {
            const [landingDay, landingHour] = landingTime.split(' ');
            const [day, month, year] = landingDay.split('/');
            const [hours, minutes, seconds, milliseconds] =
                landingHour.split(':');
            const landingHourFormatted = `${hours}:${minutes}:${seconds}`;
            const landingTimeFormatted =
                year + '-' + month + '-' + day + ' ' + landingHourFormatted;
            const landingTimeObject = new Date(landingTimeFormatted);
            return landingTimeObject;
        }

        // Service: Fetch the commands page
        async function fetchCommandsPage() {
            let commandsPageUrl =
                game_data.link_base_pure +
                `overview_villages&mode=commands&type=return&group=0&page=-1${twSDK.sitterId}`;

            let commands = [];

            await jQuery.get(commandsPageUrl, function (data) {
                const htmlDoc = jQuery.parseHTML(data);
                const tableRows = jQuery(htmlDoc).find(
                    '#commands_table .nowrap'
                );

                if (tableRows.length) {
                    tableRows.each(function () {
                        const origin = jQuery(this)
                            .find('td:eq(1)')
                            .text()
                            .match(twSDK.coordsRegex)[0];
                        const arrivalTime = jQuery(this)
                            .find('td:eq(2)')
                            .text()
                            .trim();

                        let commandUnits = [];
                        let units = {};
                        let totalFarmSpace = 0;

                        jQuery(this)
                            .find('td.unit-item')
                            .each(function () {
                                commandUnits.push(
                                    parseInt(jQuery(this).text().trim())
                                );
                            });

                        commandUnits.forEach(function (_, index) {
                            units = {
                                ...units,
                                [twSDK.units[index]]: commandUnits[index],
                            };
                        });

                        for (let [key, value] of Object.entries(units)) {
                            totalFarmSpace += value * twSDK.unitsFarmSpace[key];
                        }

                        if (totalFarmSpace > RETURNING_TROOPS_SIZE) {
                            commands.push({
                                origin: origin,
                                returnTime:
                                    twSDK.getTimeFromString(arrivalTime),
                                units: units,
                                farmSpace: totalFarmSpace,
                            });
                        }
                    });

                    return commands;
                }
            });

            return commands;
        }

        // Helper: Fetch all world configuration
        async function fetchWorldConfig() {
            try {
                const worldConfig = await twSDK.getWorldConfig();
                return { worldConfig };
            } catch (error) {
                UI.ErrorMessage(error);
                console.error(`${scriptInfo} Error:`, error);
            }
        }
    }
);