// Background PP Exchange Monitor - Readable Version
(function () {
    if (window.backgroundPPMonitorRunning) {
        UI.SuccessMessage('Background monitor already running!');
        return;
    }

    window.backgroundPPMonitorRunning = true;

    // Check if we're on the settings screen
    const urlParams = new URLSearchParams(window.location.search);
    const screenParam = urlParams.get('screen');
    const isSettingsScreen = screenParam === 'settings';

    // Settings and storage management
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    function setCookie(name, value) {
        document.cookie = `${name}=${value}; path=/; max-age=31536000`;
    }

    function getLocalStorage(key) {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch {
            return null;
        }
    }

    function setLocalStorage(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    // Get continent info for continent-specific settings
    const { world, continent } = getCurrentWorldInfo();

    // Initialize settings
    let settings = {
        MIN_RESOURCE_PER_PP: parseInt(getCookie(`bgmMinResourcePerPP_${world}_${continent}`)) || 170,
        MIN_DELAY_BETWEEN_REQUESTS: parseFloat(getCookie(`bgmMinDelay_${world}_${continent}`)) || 1,
        MAX_DELAY_BETWEEN_REQUESTS: parseFloat(getCookie(`bgmMaxDelay_${world}_${continent}`)) || 3,
        // Price check intervals (in seconds)
        MIN_PRICE_CHECK_INTERVAL: parseFloat(getCookie(`bgmMinPriceCheckInterval_${world}_${continent}`)) || 5,
        MAX_PRICE_CHECK_INTERVAL: parseFloat(getCookie(`bgmMaxPriceCheckInterval_${world}_${continent}`)) || 20,
        // Pre-transaction delay (in seconds)
        MIN_PRE_TRANSACTION_DELAY: parseFloat(getCookie(`bgmMinPreTransactionDelay_${world}_${continent}`)) || 1,
        MAX_PRE_TRANSACTION_DELAY: parseFloat(getCookie(`bgmMaxPreTransactionDelay_${world}_${continent}`)) || 2,
        DRY_RUN: getCookie(`bgmDryRun_${world}_${continent}`) === 'true' || false,
        MINIMAL_PURCHASE_MODE: getCookie(`bgmMinimalPurchaseMode_${world}_${continent}`) === 'true' || getCookie(`bgmMinimalPurchaseMode_${world}_${continent}`) === null ? true : false,
        WAREHOUSE_TOLERANCE: parseInt(getCookie(`bgmWarehouseTolerance_${world}_${continent}`)) || 1000,
        MAX_SESSION_PP_SPEND: getCookie(`bgmMaxSessionPP_${world}_${continent}`) !== null ? parseInt(getCookie(`bgmMaxSessionPP_${world}_${continent}`)) : 20,
        // Selling settings
        ENABLE_SELLING: getCookie(`bgmEnableSelling_${world}_${continent}`) === 'true' || getCookie(`bgmEnableSelling_${world}_${continent}`) === null ? true : false,
        MAX_SELL_RESOURCE_PER_PP: parseInt(getCookie(`bgmMaxSellResourcePerPP_${world}_${continent}`)) || 100,
        MIN_RESOURCE_KEEP: parseInt(getCookie(`bgmMinResourceKeep_${world}_${continent}`)) || 0,
        MAX_PURCHASE_AMOUNT: parseInt(getCookie(`bgmMaxPurchaseAmount_${world}_${continent}`)) || 1000,
        MIN_SELL_AMOUNT: parseInt(getCookie(`bgmMinSellAmount_${world}_${continent}`)) || 500,
        MAX_SELL_AMOUNT: parseInt(getCookie(`bgmMaxSellAmount_${world}_${continent}`)) || 4000,
        MAX_CONSECUTIVE_SELLS: parseInt(getCookie(`bgmMaxConsecutiveSells_${world}_${continent}`)) || 5,
        // Recovery intervals (in minutes)
        SESSION_RECOVERY_MIN_INTERVAL: parseInt(getCookie(`bgmSessionRecoveryMinInterval_${world}_${continent}`)) || 1,
        SESSION_RECOVERY_MAX_INTERVAL: parseInt(getCookie(`bgmSessionRecoveryMaxInterval_${world}_${continent}`)) || 10,
        BOT_PROTECTION_RECOVERY_MIN_INTERVAL: parseInt(getCookie(`bgmBotProtectionRecoveryMinInterval_${world}_${continent}`)) || 10,
        BOT_PROTECTION_RECOVERY_MAX_INTERVAL: parseInt(getCookie(`bgmBotProtectionRecoveryMaxInterval_${world}_${continent}`)) || 60,
        // Dynamic threshold updates
        ENABLE_DYNAMIC_THRESHOLDS: getCookie(`bgmEnableDynamicThresholds_${world}_${continent}`) === 'true',
        // Auto-threshold band width controls (0.05 = 5%, 0.20 = 20%)
        AUTO_BUY_BAND_WIDTH: parseFloat(getCookie(`bgmAutoBuyBandWidth_${world}_${continent}`)) || 0.07, // Default 7% safety margin for buy
        AUTO_SELL_BAND_WIDTH: parseFloat(getCookie(`bgmAutoSellBandWidth_${world}_${continent}`)) || 0.12 // Default 12% safety margin for sell
    };

    // Initialize session data (village-specific)
    let sessionData = getLocalStorage(getVillageStorageKey('backgroundMonitorSession')) || {
        transactions: [],
        totalSpent: 0,
        totalEarned: 0,
        totalWood: 0,
        totalStone: 0,
        totalIron: 0,
        soldWood: 0,
        soldStone: 0,
        soldIron: 0,
        sessionStart: Date.now(),
        consecutiveFailedSells: 0
    };
    
    // Migrate old consecutiveSells to consecutiveFailedSells and ensure property exists
    if (sessionData.consecutiveFailedSells === undefined) {
        sessionData.consecutiveFailedSells = sessionData.consecutiveSells || 0;
        // Remove old property if it exists
        delete sessionData.consecutiveSells;
    }

    let isRunning = false;
    let nextTimeout = null;
    let lastTransactionTime = 0;
    let merchantsHome = 0;
    let lastMerchantCheck = 0;
    let currentPrices = { wood: 0, stone: 0, iron: 0 };
    let priceChanges = { wood: 'none', stone: 'none', iron: 'none' }; // 'up', 'down', 'none'
    let transactionInProgress = false;
    let rateLimitTime = 0; // Time when rate limiting was triggered
    let priceCheckInProgress = false; // Prevent concurrent price checks
    let sessionExpired = false; // Track session expiry state
    let botProtectionActive = false; // Track bot protection state
    let recoveryActive = false; // Prevent multiple recovery attempts (for both session and bot protection)
    let recoveryTimeout = null; // Track recovery timeout
    let recoveryCountdownInterval = null; // Track recovery countdown interval

    // Price history tracking
    let priceHistory = getLocalStorage('backgroundMonitorPriceHistory') || {};

    // Auto-threshold recommendations
    let autoThresholdRecommendations = { buyThreshold: null, sellThreshold: null };

    // Graph state tracking
    let currentGraphResource = 'all';
    let currentTimeRange = 'all'; // 'all', 'week', '24h'
    let currentNetTimeRange = 'all'; // Separate time range for net trend chart
    let currentAvgPriceTimeRange = 'all'; // Separate time range for average price chart

    function updatePricesWithChangeTracking(newPrices) {
        const resources = ['wood', 'stone', 'iron'];
        resources.forEach(resource => {
            const oldPrice = currentPrices[resource];
            const newPrice = newPrices[resource];

            if (oldPrice > 0 && newPrice > 0 && oldPrice !== newPrice) {
                // Only update arrows when price actually changes
                // Convert to resources per PP for comparison
                const oldResourcePerPP = 1 / oldPrice;
                const newResourcePerPP = 1 / newPrice;

                const change = newResourcePerPP - oldResourcePerPP;
                const changeThreshold = 0.001; // Minimum change to register as up/down

                if (change > changeThreshold) {
                    priceChanges[resource] = 'up';
                } else if (change < -changeThreshold) {
                    priceChanges[resource] = 'down';
                }
                // If change is below threshold, keep existing arrow state
            } else if (oldPrice === 0 && newPrice > 0) {
                // First time getting price data, no arrow
                priceChanges[resource] = 'none';
            }
            // If prices are identical, don't change the arrow state

            currentPrices[resource] = newPrice;
        });
    }

    function getCurrentWorldInfo() {
        // Extract world and continent from game data
        const worldName = window.location.hostname.split('.')[0]; // e.g., 'en121'
        const continent = Math.floor((game_data.village.y / 100)) + '' + Math.floor((game_data.village.x / 100))
        const villageId = game_data.village.id;
        return { world: worldName, continent: continent, villageId: villageId };
    }

    // Store original page title
    const originalTitle = document.title;

    function updatePageTitle(isRunning = false) {
        if (!isRunning) {
            document.title = originalTitle;
        }
        // When starting monitoring, the detailed task updates will handle the title
    }

    function getVillageStorageKey(baseKey) {
        const { world, villageId } = getCurrentWorldInfo();
        return `${baseKey}_${world}_${villageId}`;
    }

    function shouldLogPrices(priceData) {
        const { world, continent } = getCurrentWorldInfo();
        const key = `${world}_${continent}`;
        const lastLog = priceHistory[key]?.lastLogTime || 0;
        const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

        // Log if it's been more than 1 hour
        if (Date.now() - lastLog > oneHour) {
            return { shouldLog: true, reason: 'time-based (>1 hour)' };
        }

        // Check for significant price changes (30% or more)
        if (priceHistory[key] && priceHistory[key].prices) {
            const resources = ['wood', 'stone', 'iron'];
            for (const resource of resources) {
                const prices = priceHistory[key].prices[resource];
                if (prices.length > 0) {
                    const lastPrice = prices[prices.length - 1];
                    const currentResPerPP = 1 / priceData.rates[resource];
                    const lastResPerPP = lastPrice.resPerPP;

                    if (lastResPerPP > 0) {
                        const changePercent = Math.abs((currentResPerPP - lastResPerPP) / lastResPerPP);
                        if (changePercent >= 0.30) { // 30% change
                            return {
                                shouldLog: true,
                                reason: `${resource} price changed ${(changePercent * 100).toFixed(1)}%`,
                                priceChange: {
                                    resource: resource,
                                    before: lastResPerPP,
                                    after: currentResPerPP,
                                    changePercent: changePercent
                                }
                            };
                        }
                    }
                }
            }
        }

        return { shouldLog: false, reason: 'no significant change' };
    }

    function logPriceHistory(priceData) {
        const logCheck = shouldLogPrices(priceData);
        if (!logCheck.shouldLog) return;

        console.log(`[BGM] Logging price history: ${logCheck.reason}`);

        // If this is a large price change, log the before/after details
        if (logCheck.priceChange) {
            const change = logCheck.priceChange;
            console.log(`[BGM] Large price change detected - ${change.resource}: ${change.before} → ${change.after} res/PP (${(change.changePercent * 100).toFixed(1)}% change)`);
        }

        const { world, continent } = getCurrentWorldInfo();
        const key = `${world}_${continent}`;
        const timestamp = Date.now();

        if (!priceHistory[key]) {
            priceHistory[key] = {
                world: world,
                continent: continent,
                prices: { wood: [], stone: [], iron: [] },
                priceChangeEvents: [], // Store significant price change events
                lastLogTime: 0
            };
        }

        // Ensure priceChangeEvents array exists (backward compatibility)
        if (!priceHistory[key].priceChangeEvents) {
            priceHistory[key].priceChangeEvents = [];
        }

        // Add new price points
        priceHistory[key].prices.wood.push({ timestamp, rate: priceData.rates.wood, resPerPP: Math.round(1 / priceData.rates.wood) });
        priceHistory[key].prices.stone.push({ timestamp, rate: priceData.rates.stone, resPerPP: Math.round(1 / priceData.rates.stone) });
        priceHistory[key].prices.iron.push({ timestamp, rate: priceData.rates.iron, resPerPP: Math.round(1 / priceData.rates.iron) });

        // Store price change event if this was triggered by a large change
        if (logCheck.priceChange) {
            const change = logCheck.priceChange;
            priceHistory[key].priceChangeEvents.push({
                timestamp: timestamp,
                resource: change.resource,
                before: change.before,
                after: change.after,
                changePercent: change.changePercent,
                reason: 'large_price_change'
            });
        }

        priceHistory[key].lastLogTime = timestamp;

        // Keep only last 7 days of data
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        const cutoff = timestamp - sevenDays;
        ['wood', 'stone', 'iron'].forEach(resource => {
            priceHistory[key].prices[resource] = priceHistory[key].prices[resource].filter(p => p.timestamp > cutoff);
        });

        // Also clean up price change events older than 7 days
        if (priceHistory[key].priceChangeEvents) {
            priceHistory[key].priceChangeEvents = priceHistory[key].priceChangeEvents.filter(e => e.timestamp > cutoff);
        }

        setLocalStorage('backgroundMonitorPriceHistory', priceHistory);

        // Apply dynamic thresholds if enabled (only when price history is actually logged)
        applyDynamicThresholdsIfEnabled();
    }

    // Adaptive Moving Average Algorithm
    function calculateAutoThresholds() {
        const { world, continent } = getCurrentWorldInfo();
        const key = `${world}_${continent}`;
        const data = priceHistory[key];

        if (!data || !data.prices.wood.length) {
            autoThresholdRecommendations = { buyThreshold: null, sellThreshold: null };
            return autoThresholdRecommendations;
        }

        // Combine all resource price data for analysis
        const allPrices = [];
        const resources = ['wood', 'stone', 'iron'];
        const now = Date.now();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        const cutoff = now - oneWeek;

        resources.forEach(resource => {
            const prices = data.prices[resource].filter(p => p.timestamp > cutoff);
            prices.forEach(p => {
                allPrices.push({
                    timestamp: p.timestamp,
                    resPerPP: p.resPerPP,
                    resource: resource
                });
            });
        });

        if (allPrices.length < 10) {
            autoThresholdRecommendations = { buyThreshold: null, sellThreshold: null };
            return autoThresholdRecommendations;
        }

        // Sort by timestamp
        allPrices.sort((a, b) => a.timestamp - b.timestamp);

        // Calculate moving averages with different window sizes
        const shortWindow = Math.min(20, Math.floor(allPrices.length * 0.2));
        const longWindow = Math.min(50, Math.floor(allPrices.length * 0.5));

        // Get recent data for analysis
        const recentPrices = allPrices.slice(-shortWindow).map(p => p.resPerPP);
        const longerPrices = allPrices.slice(-longWindow).map(p => p.resPerPP);

        // Calculate statistics
        const recentAvg = recentPrices.reduce((sum, p) => sum + p, 0) / recentPrices.length;
        const longerAvg = longerPrices.reduce((sum, p) => sum + p, 0) / longerPrices.length;

        // Calculate standard deviation for recent prices
        const variance = recentPrices.reduce((sum, p) => sum + Math.pow(p - recentAvg, 2), 0) / recentPrices.length;
        const stdDev = Math.sqrt(variance);

        // Calculate trend (price direction)
        const recentTimestamps = allPrices.slice(-shortWindow);
        let trendSlope = 0;
        if (recentTimestamps.length >= 2) {
            const n = recentTimestamps.length;
            const sumX = recentTimestamps.reduce((sum, _, i) => sum + i, 0);
            const sumY = recentTimestamps.reduce((sum, p) => sum + p.resPerPP, 0);
            const sumXY = recentTimestamps.reduce((sum, p, i) => sum + (i * p.resPerPP), 0);
            const sumX2 = recentTimestamps.reduce((sum, _, i) => sum + (i * i), 0);

            trendSlope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        }

        // Adaptive safety margin based on volatility and user settings
        const baseBuyMargin = settings.AUTO_BUY_BAND_WIDTH; // User-configurable buy margin
        const baseSellMargin = settings.AUTO_SELL_BAND_WIDTH; // User-configurable sell margin
        const volatilityMargin = Math.min(0.10, stdDev / recentAvg); // Cap volatility adjustment at 10%
        const buyMargin = baseBuyMargin + volatilityMargin;
        const sellMargin = baseSellMargin + (volatilityMargin * 0.8); // Slightly less volatility impact on sell

        // Trend adjustment
        const trendAdjustment = trendSlope * 5; // Scale trend impact

        // Calculate thresholds
        const avgPrice = (recentAvg * 0.7) + (longerAvg * 0.3); // Weight recent more heavily

        // Buy threshold: Be more conservative when prices are rising
        const buyThreshold = Math.round(avgPrice * (1 + buyMargin) + Math.max(0, trendAdjustment));

        // Sell threshold: Be more aggressive when prices are falling
        const sellThreshold = Math.round(avgPrice * (1 - sellMargin) + Math.min(0, trendAdjustment));

        // Ensure reasonable bounds
        const minBuyThreshold = 50;
        const maxBuyThreshold = 200;
        const minSellThreshold = 30;
        const maxSellThreshold = 150;

        autoThresholdRecommendations = {
            buyThreshold: Math.max(minBuyThreshold, Math.min(maxBuyThreshold, buyThreshold)),
            sellThreshold: Math.max(minSellThreshold, Math.min(maxSellThreshold, sellThreshold)),
            confidence: Math.min(1.0, allPrices.length / 50), // Higher confidence with more data
            dataPoints: allPrices.length,
            avgPrice: Math.round(avgPrice),
            volatility: Math.round(stdDev),
            trend: trendSlope > 0.1 ? 'rising' : trendSlope < -0.1 ? 'falling' : 'stable'
        };

        return autoThresholdRecommendations;
    }

    function updateAutoThresholds() {
        const recommendations = calculateAutoThresholds();

        // Update header based on dynamic mode
        const headerEl = document.getElementById('autoThresholdHeader');
        if (headerEl) {
            if (settings.ENABLE_DYNAMIC_THRESHOLDS) {
                headerEl.innerHTML = '🤖 Dynamic Auto-Thresholds <span style="color: #4CAF50; font-size: 12px;">(ACTIVE)</span>';
                headerEl.parentElement.style.background = '#f0fff0'; // Light green background
                headerEl.parentElement.style.borderColor = '#4CAF50';
            } else {
                headerEl.innerHTML = '🤖 Auto-Threshold Recommendations';
                headerEl.parentElement.style.background = '#f0f8ff'; // Light blue background
                headerEl.parentElement.style.borderColor = '#ddd';
            }
        }

        // Update current thresholds display
        document.getElementById('currentBuyThreshold').textContent = `${settings.MIN_RESOURCE_PER_PP} res/PP`;
        document.getElementById('currentSellThreshold').textContent = settings.ENABLE_SELLING ? `${settings.MAX_SELL_RESOURCE_PER_PP} res/PP` : 'Disabled';

        if (recommendations.buyThreshold !== null && recommendations.sellThreshold !== null) {
            // Update recommended thresholds display
            document.getElementById('recommendedBuyThreshold').textContent = recommendations.buyThreshold;
            document.getElementById('recommendedSellThreshold').textContent = recommendations.sellThreshold;

            // Update info text
            const confidencePercent = Math.round(recommendations.confidence * 100);
            let infoText;
            if (settings.ENABLE_DYNAMIC_THRESHOLDS) {
                infoText = `Dynamic mode: Auto-applies on price updates | ${recommendations.dataPoints} data points, ${confidencePercent}% confidence, trend: ${recommendations.trend}`;
            } else {
                infoText = `Analysis: ${recommendations.dataPoints} data points, ${confidencePercent}% confidence, trend: ${recommendations.trend}`;
            }
            document.getElementById('autoThresholdInfo').textContent = infoText;

            // Enable apply button if recommendations differ from current
            const buyDifferent = recommendations.buyThreshold !== settings.MIN_RESOURCE_PER_PP;
            const sellDifferent = recommendations.sellThreshold !== settings.MAX_SELL_RESOURCE_PER_PP;
            const applyBtn = document.getElementById('applyAutoThresholds');

            if (buyDifferent || sellDifferent) {
                applyBtn.disabled = false;
                applyBtn.style.background = '#2196F3';
                applyBtn.style.cursor = 'pointer';
            } else {
                applyBtn.disabled = true;
                applyBtn.style.background = '#ccc';
                applyBtn.style.cursor = 'not-allowed';
            }

            // Highlight differences with colors
            const buyEl = document.getElementById('recommendedBuyThreshold');
            const sellEl = document.getElementById('recommendedSellThreshold');

            if (buyDifferent) {
                buyEl.style.background = '#fff3cd';
                buyEl.style.padding = '2px 4px';
                buyEl.style.borderRadius = '2px';
            } else {
                buyEl.style.background = 'transparent';
            }

            if (sellDifferent) {
                sellEl.style.background = '#fff3cd';
                sellEl.style.padding = '2px 4px';
                sellEl.style.borderRadius = '2px';
            } else {
                sellEl.style.background = 'transparent';
            }

        } else {
            // No recommendations available
            document.getElementById('recommendedBuyThreshold').textContent = 'N/A';
            document.getElementById('recommendedSellThreshold').textContent = 'N/A';

            let noDataText;
            if (settings.ENABLE_DYNAMIC_THRESHOLDS) {
                noDataText = 'Dynamic mode enabled but insufficient price history data (need at least 10 data points)';
            } else {
                noDataText = 'Insufficient price history data (need at least 10 data points)';
            }
            document.getElementById('autoThresholdInfo').textContent = noDataText;

            const applyBtn = document.getElementById('applyAutoThresholds');
            applyBtn.disabled = true;
            applyBtn.style.background = '#ccc';
            applyBtn.style.cursor = 'not-allowed';
        }

        // Update the price chart to show current and recommended thresholds
        updatePriceChart();
    }

    function applyAutoThresholds() {
        if (autoThresholdRecommendations.buyThreshold === null || autoThresholdRecommendations.sellThreshold === null) {
            return;
        }

        // Apply the recommended thresholds
        settings.MIN_RESOURCE_PER_PP = autoThresholdRecommendations.buyThreshold;
        settings.MAX_SELL_RESOURCE_PER_PP = autoThresholdRecommendations.sellThreshold;

        // Update cookies
        const { world, continent } = getCurrentWorldInfo();
        setCookie(`bgmMinResourcePerPP_${world}_${continent}`, settings.MIN_RESOURCE_PER_PP);
        setCookie(`bgmMaxSellResourcePerPP_${world}_${continent}`, settings.MAX_SELL_RESOURCE_PER_PP);

        // Update settings panel if visible
        const minResourceInput = document.getElementById('minResourcePerPP');
        const maxSellInput = document.getElementById('maxSellResourcePerPP');
        if (minResourceInput) minResourceInput.value = settings.MIN_RESOURCE_PER_PP;
        if (maxSellInput) maxSellInput.value = settings.MAX_SELL_RESOURCE_PER_PP;

        // Refresh the auto-threshold display
        updateAutoThresholds();

        // Show success message
        updateStatus(`Applied auto-thresholds: Buy ≥${settings.MIN_RESOURCE_PER_PP}, Sell ≤${settings.MAX_SELL_RESOURCE_PER_PP} res/PP`, '#4CAF50');
    }

    function updateThresholdInputsState() {
        const isDynamic = settings.ENABLE_DYNAMIC_THRESHOLDS;
        const buyInput = document.getElementById('minResourcePerPP');
        const sellInput = document.getElementById('maxSellResourcePerPP');

        if (buyInput && sellInput) {
            buyInput.disabled = isDynamic;
            sellInput.disabled = isDynamic;

            // Update visual appearance
            const disabledStyle = isDynamic ? 'background: #f5f5f5; color: #999; cursor: not-allowed;' : '';
            buyInput.style.cssText = `width: 100%; padding: 3px; border: 1px solid #ccc; border-radius: 2px; font-size: 10px; ${disabledStyle}`;
            sellInput.style.cssText = `width: 100%; padding: 3px; border: 1px solid #ccc; border-radius: 2px; font-size: 10px; ${disabledStyle}`;
        }

    }

    function applyDynamicThresholdsIfEnabled() {
        if (!settings.ENABLE_DYNAMIC_THRESHOLDS) {
            return false; // Dynamic mode disabled
        }

        const recommendations = calculateAutoThresholds();
        if (recommendations.buyThreshold === null || recommendations.sellThreshold === null) {
            return false; // No valid recommendations
        }

        // Check if recommendations differ from current settings
        const buyDifferent = recommendations.buyThreshold !== settings.MIN_RESOURCE_PER_PP;
        const sellDifferent = recommendations.sellThreshold !== settings.MAX_SELL_RESOURCE_PER_PP;

        if (buyDifferent || sellDifferent) {
            // Apply the recommended thresholds automatically
            settings.MIN_RESOURCE_PER_PP = recommendations.buyThreshold;
            settings.MAX_SELL_RESOURCE_PER_PP = recommendations.sellThreshold;

            // Update cookies
            const { world, continent } = getCurrentWorldInfo();
            setCookie(`bgmMinResourcePerPP_${world}_${continent}`, settings.MIN_RESOURCE_PER_PP);
            setCookie(`bgmMaxSellResourcePerPP_${world}_${continent}`, settings.MAX_SELL_RESOURCE_PER_PP);

            // Update settings panel inputs (even though they're disabled)
            const minResourceInput = document.getElementById('minResourcePerPP');
            const maxSellInput = document.getElementById('maxSellResourcePerPP');
            if (minResourceInput) minResourceInput.value = settings.MIN_RESOURCE_PER_PP;
            if (maxSellInput) maxSellInput.value = settings.MAX_SELL_RESOURCE_PER_PP;

            // Update the price chart to reflect new thresholds
            updatePriceChart();

            // Show status message
            updateStatus(`🤖 Dynamic thresholds applied: Buy ≥${settings.MIN_RESOURCE_PER_PP}, Sell ≤${settings.MAX_SELL_RESOURCE_PER_PP} res/PP`, '#2196F3');

            return true; // Thresholds were updated
        }

        return false; // No changes needed
    }

    function updateGraphThresholds() {
        const recommendations = calculateAutoThresholds();

        // Update current thresholds display
        document.getElementById('currentBuyThresholdGraph').textContent = `${settings.MIN_RESOURCE_PER_PP}`;
        document.getElementById('currentSellThresholdGraph').textContent = settings.ENABLE_SELLING ? `${settings.MAX_SELL_RESOURCE_PER_PP}` : 'Disabled';

        // Update dynamic mode indicator
        const dynamicIndicator = document.getElementById('dynamicModeIndicator');
        if (settings.ENABLE_DYNAMIC_THRESHOLDS) {
            dynamicIndicator.textContent = '(AUTO)';
            dynamicIndicator.style.color = '#4CAF50';
        } else {
            dynamicIndicator.textContent = '';
        }

        if (recommendations.buyThreshold !== null && recommendations.sellThreshold !== null) {
            // Update recommended thresholds display
            document.getElementById('recommendedBuyThresholdGraph').textContent = recommendations.buyThreshold;
            document.getElementById('recommendedSellThresholdGraph').textContent = recommendations.sellThreshold;

            // Update info text
            const confidencePercent = Math.round(recommendations.confidence * 100);
            let infoText;
            if (settings.ENABLE_DYNAMIC_THRESHOLDS) {
                infoText = `Dynamic mode: Auto-applies on price updates | ${recommendations.dataPoints} data points, ${confidencePercent}% confidence, trend: ${recommendations.trend}`;
            } else {
                infoText = `Analysis: ${recommendations.dataPoints} data points, ${confidencePercent}% confidence, trend: ${recommendations.trend}`;
            }
            document.getElementById('autoThresholdInfoGraph').textContent = infoText;

            // Enable apply button if recommendations differ from current and not in dynamic mode
            const buyDifferent = recommendations.buyThreshold !== settings.MIN_RESOURCE_PER_PP;
            const sellDifferent = recommendations.sellThreshold !== settings.MAX_SELL_RESOURCE_PER_PP;
            const applyBtn = document.getElementById('applyAutoThresholdsGraph');

            if (!settings.ENABLE_DYNAMIC_THRESHOLDS && (buyDifferent || sellDifferent)) {
                applyBtn.disabled = false;
                applyBtn.style.background = '#2196F3';
                applyBtn.style.cursor = 'pointer';
            } else {
                applyBtn.disabled = true;
                applyBtn.style.background = '#ccc';
                applyBtn.style.cursor = 'not-allowed';
            }

            // Hide apply button in dynamic mode
            if (settings.ENABLE_DYNAMIC_THRESHOLDS) {
                applyBtn.style.display = 'none';
            } else {
                applyBtn.style.display = 'inline-block';
            }

            // Highlight differences with colors
            const buyEl = document.getElementById('recommendedBuyThresholdGraph');
            const sellEl = document.getElementById('recommendedSellThresholdGraph');

            if (buyDifferent && !settings.ENABLE_DYNAMIC_THRESHOLDS) {
                buyEl.style.background = '#fff3cd';
                buyEl.style.padding = '2px 4px';
                buyEl.style.borderRadius = '2px';
            } else {
                buyEl.style.background = 'transparent';
            }

            if (sellDifferent && !settings.ENABLE_DYNAMIC_THRESHOLDS) {
                sellEl.style.background = '#fff3cd';
                sellEl.style.padding = '2px 4px';
                sellEl.style.borderRadius = '2px';
            } else {
                sellEl.style.background = 'transparent';
            }

        } else {
            // No recommendations available
            document.getElementById('recommendedBuyThresholdGraph').textContent = 'N/A';
            document.getElementById('recommendedSellThresholdGraph').textContent = 'N/A';

            let noDataText;
            if (settings.ENABLE_DYNAMIC_THRESHOLDS) {
                noDataText = 'Dynamic mode enabled but insufficient price history data (need at least 10 data points)';
            } else {
                noDataText = 'Insufficient price history data (need at least 10 data points)';
            }
            document.getElementById('autoThresholdInfoGraph').textContent = noDataText;

            const applyBtn = document.getElementById('applyAutoThresholdsGraph');
            applyBtn.disabled = true;
            applyBtn.style.background = '#ccc';
            applyBtn.style.cursor = 'not-allowed';
        }
    }

    function applyAutoThresholdsFromGraph() {
        if (autoThresholdRecommendations.buyThreshold === null || autoThresholdRecommendations.sellThreshold === null) {
            return;
        }

        // Apply the recommended thresholds
        settings.MIN_RESOURCE_PER_PP = autoThresholdRecommendations.buyThreshold;
        settings.MAX_SELL_RESOURCE_PER_PP = autoThresholdRecommendations.sellThreshold;

        // Update cookies
        const { world, continent } = getCurrentWorldInfo();
        setCookie(`bgmMinResourcePerPP_${world}_${continent}`, settings.MIN_RESOURCE_PER_PP);
        setCookie(`bgmMaxSellResourcePerPP_${world}_${continent}`, settings.MAX_SELL_RESOURCE_PER_PP);

        // Update settings panel if visible
        const minResourceInput = document.getElementById('minResourcePerPP');
        const maxSellInput = document.getElementById('maxSellResourcePerPP');
        if (minResourceInput) minResourceInput.value = settings.MIN_RESOURCE_PER_PP;
        if (maxSellInput) maxSellInput.value = settings.MAX_SELL_RESOURCE_PER_PP;

        // Refresh the graph threshold display
        updateGraphThresholds();

        // Update the price chart to reflect new thresholds
        updatePriceChart();

        // Show success message
        updateStatus(`Applied auto-thresholds: Buy ≥${settings.MIN_RESOURCE_PER_PP}, Sell ≤${settings.MAX_SELL_RESOURCE_PER_PP} res/PP`, '#4CAF50');
    }

    function updateBuyBandWidth() {
        const slider = document.getElementById('autoBuyBandWidth');
        const valueDisplay = document.getElementById('autoBuyBandWidthValue');
        const newValue = parseFloat(slider.value);

        settings.AUTO_BUY_BAND_WIDTH = newValue;
        valueDisplay.textContent = Math.round(newValue * 100) + '%';

        // Save setting
        const { world, continent } = getCurrentWorldInfo();
        setCookie(`bgmAutoBuyBandWidth_${world}_${continent}`, settings.AUTO_BUY_BAND_WIDTH);

        // Update thresholds and refresh displays
        updateGraphThresholds();

        // If dynamic mode is enabled, apply new thresholds immediately
        if (settings.ENABLE_DYNAMIC_THRESHOLDS) {
            applyDynamicThresholdsIfEnabled();
        } else {
            // Just update the historical chart with new threshold lines
            drawGraph(currentGraphResource);
        }
    }

    function updateSellBandWidth() {
        const slider = document.getElementById('autoSellBandWidth');
        const valueDisplay = document.getElementById('autoSellBandWidthValue');
        const newValue = parseFloat(slider.value);

        settings.AUTO_SELL_BAND_WIDTH = newValue;
        valueDisplay.textContent = Math.round(newValue * 100) + '%';

        // Save setting
        const { world, continent } = getCurrentWorldInfo();
        setCookie(`bgmAutoSellBandWidth_${world}_${continent}`, settings.AUTO_SELL_BAND_WIDTH);

        // Update thresholds and refresh displays
        updateGraphThresholds();

        // If dynamic mode is enabled, apply new thresholds immediately
        if (settings.ENABLE_DYNAMIC_THRESHOLDS) {
            applyDynamicThresholdsIfEnabled();
        } else {
            // Just update the historical chart with new threshold lines
            drawGraph(currentGraphResource);
        }
    }

    // UI Elements
    let statusUI = null;
    let statsTable = null;

    function createUI() {
        // Create main container
        statusUI = document.createElement('div');
        statusUI.id = 'bgMonitorUI';
        statusUI.style.cssText = `
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            position: fixed;
            background: white;
            border: 2px solid #8B4513;
            border-radius: 8px;
            padding: 15px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            z-index: 9999;
            min-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        `;

        statusUI.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 10px; color: #8B4513; border-bottom: 1px solid #8B4513; padding-bottom: 5px;">
                Background PP Monitor - ${getCurrentWorldInfo().world} Village ${getCurrentWorldInfo().villageId}
            </div>
            <div style="margin-bottom: 10px; text-align: center;">
                <button id="bgmStart" style="font-size: 10px; padding: 4px 8px; margin: 0 2px;">▶️ Start</button>
                <button id="bgmStop" style="font-size: 10px; padding: 4px 8px; margin: 0 2px; display: none;">⏹️ Stop</button>
                <button id="bgmSettings" style="font-size: 10px; padding: 4px 8px; margin: 0 2px;">⚙️ Settings</button>
                <button id="bgmGraphs" style="font-size: 10px; padding: 4px 8px; margin: 0 2px;">📊 Graphs</button>
                <button id="bgmTransactions" style="font-size: 10px; padding: 4px 8px; margin: 0 2px;">📋 Log</button>
                <button id="bgmClose" style="font-size: 10px; padding: 4px 8px; margin: 0 2px;">❌ Close</button>
            </div>
            <div id="bgmStatus" style="margin-bottom: 10px;">Status: <span style="color: #2196F3;">Starting...</span></div>
            <div id="bgmCurrentTask" style="margin-bottom: 10px; font-size: 11px; color: #666; font-style: italic;">Current task: <span id="taskDescription">Initializing...</span></div>
            <div style="margin-bottom: 10px;">
                <div>Session PP: <span id="sessionSpent" style="font-weight: bold; color: #f44336;">-0</span> / <span id="sessionEarned" style="font-weight: bold; color: #4CAF50;">+0</span> / <span id="maxSessionPP">${settings.MAX_SESSION_PP_SPEND}</span></div>
                <div>Current PP: <span id="currentPP" style="font-weight: bold; color: #2196F3;">-</span> | Merchants: <span id="merchantsHome" style="font-weight: bold; color: #FF9800;">-</span></div>
                <div id="lastEvent" style="font-size: 10px; color: #666; margin-bottom: 2px;">Last event: <span id="lastEventText">No transactions yet</span></div>
                <div style="font-size: 10px; color: #666;">Started: <span id="sessionStart">${new Date(sessionData.sessionStart).toLocaleTimeString()}</span></div>
            </div>
            <table id="bgmStats" style="width: 100%; border-collapse: collapse; font-size: 11px;">
                <thead>
                    <tr style="background: #f0f0f0;">
                        <th style="border: 1px solid #ccc; padding: 4px;">Resource</th>
                        <th style="border: 1px solid #ccc; padding: 4px;">Current Price</th>
                        <th style="border: 1px solid #ccc; padding: 4px;">Bought</th>
                        <th style="border: 1px solid #ccc; padding: 4px;">Sold</th>
                        <th style="border: 1px solid #ccc; padding: 4px;">Net PP</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border: 1px solid #ccc; padding: 4px;">🪵 Wood</td>
                        <td style="border: 1px solid #ccc; padding: 4px;" id="woodPrice">-</td>
                        <td style="border: 1px solid #ccc; padding: 4px;" id="totalWood">${sessionData.totalWood}</td>
                        <td style="border: 1px solid #ccc; padding: 4px;" id="soldWood">${sessionData.soldWood || 0}</td>
                        <td style="border: 1px solid #ccc; padding: 4px;" id="woodNet">0</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ccc; padding: 4px;">🧱 Clay</td>
                        <td style="border: 1px solid #ccc; padding: 4px;" id="stonePrice">-</td>
                        <td style="border: 1px solid #ccc; padding: 4px;" id="totalStone">${sessionData.totalStone}</td>
                        <td style="border: 1px solid #ccc; padding: 4px;" id="soldStone">${sessionData.soldStone || 0}</td>
                        <td style="border: 1px solid #ccc; padding: 4px;" id="clayNet">0</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ccc; padding: 4px;">⚙️ Iron</td>
                        <td style="border: 1px solid #ccc; padding: 4px;" id="ironPrice">-</td>
                        <td style="border: 1px solid #ccc; padding: 4px;" id="totalIron">${sessionData.totalIron}</td>
                        <td style="border: 1px solid #ccc; padding: 4px;" id="soldIron">${sessionData.soldIron || 0}</td>
                        <td style="border: 1px solid #ccc; padding: 4px;" id="ironNet">0</td>
                    </tr>
                    <tr style="background: #f8f8f8; font-weight: bold; border-top: 2px solid #8B4513;">
                        <td style="border: 1px solid #ccc; padding: 4px;">📊 Total</td>
                        <td style="border: 1px solid #ccc; padding: 4px;">-</td>
                        <td style="border: 1px solid #ccc; padding: 4px;" id="totalBought">0</td>
                        <td style="border: 1px solid #ccc; padding: 4px;" id="totalSold">0</td>
                        <td style="border: 1px solid #ccc; padding: 4px;" id="totalNetPP">0</td>
                    </tr>
                </tbody>
            </table>
            <div id="netSummary" style="margin: 10px 0; padding: 8px; background: #f0f8ff; border-radius: 4px; border: 1px solid #b0d4f1; font-size: 11px; text-align: center; color: #2c5aa0;">
                <strong>Net Summary:</strong> <span id="netSummaryText">Calculating...</span>
            </div>
            <div id="avgPrices" style="margin: 10px 0; display: flex; gap: 10px; justify-content: center;">
                <div style="padding: 6px 12px; background: #ffe8e8; border-radius: 4px; border: 1px solid #f5c6c6; font-size: 11px; text-align: center; color: #c62d42;">
                    <div style="font-weight: bold;">📈 Avg Buy Price</div>
                    <div id="avgBuyPrice" style="font-size: 12px; font-weight: bold; margin-top: 2px;">-</div>
                </div>
                <div style="padding: 6px 12px; background: #e8f5e8; border-radius: 4px; border: 1px solid #c3e6c3; font-size: 11px; text-align: center; color: #2e7d2e;">
                    <div style="font-weight: bold;">📉 Avg Sell Price</div>
                    <div id="avgSellPrice" style="font-size: 12px; font-weight: bold; margin-top: 2px;">-</div>
                </div>
            </div>
            <div id="priceChart" style="margin: 10px 0; padding: 8px; background: #f8f8f8; border-radius: 4px; border: 1px solid #ddd;">
                <div style="font-weight: bold; margin-bottom: 30px; font-size: 18px; color: #8B4513; text-align: center;">📊 Current Prices vs Thresholds (Resources/PP)</div>
                <div id="chartContent" style="font-size: 10px;">
                    <!-- Chart will be populated by updatePriceChart() -->
                </div>
            </div>
            <div id="bgmSettingsPanel" style="margin-top: 15px; padding: 10px; background: #f9f9f9; border-radius: 4px; display: none; font-size: 11px;">
                <h4 style="margin: 0 0 15px 0; color: #8B4513; text-align: center;">Settings</h4>
                
                <!-- Trading Thresholds -->
                <div style="margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; padding: 8px;">
                    <h5 style="margin: 0 0 8px 0; color: #8B4513; font-size: 12px;">📈 Trading Thresholds</h5>
                    <div style="margin-bottom: 8px;">
                        <label style="display: flex; align-items: center; font-size: 10px; cursor: pointer;">
                            <input type="checkbox" id="enableDynamicThresholds" style="margin-right: 6px;">
                            <span style="font-weight: bold; color: #2196F3;">🤖 Enable Dynamic Auto-Thresholds</span>
                        </label>
                        <div style="font-size: 9px; color: #666; margin-left: 18px; margin-top: 2px;">
                            Automatically applies recommended thresholds when price history is updated
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <div>
                            <label style="display: block; margin-bottom: 2px; font-weight: bold; font-size: 10px;">Min Resources per PP (Buy Threshold):</label>
                            <input type="number" id="minResourcePerPP" style="width: 100%; padding: 3px; border: 1px solid #ccc; border-radius: 2px; font-size: 10px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 2px; font-weight: bold; font-size: 10px;">Max Resources per PP (Sell Threshold):</label>
                            <input type="number" id="maxSellResourcePerPP" style="width: 100%; padding: 3px; border: 1px solid #ccc; border-radius: 2px; font-size: 10px;">
                        </div>
                    </div>
                </div>
                
                <!-- Transaction Limits -->
                <div style="margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; padding: 8px;">
                    <h5 style="margin: 0 0 8px 0; color: #8B4513; font-size: 12px;">💰 Transaction Limits</h5>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <div>
                            <label style="display: block; margin-bottom: 2px; font-weight: bold; font-size: 10px;">Max Purchase Amount (per transaction):</label>
                            <input type="number" id="maxPurchaseAmount" style="width: 100%; padding: 3px; border: 1px solid #ccc; border-radius: 2px; font-size: 10px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 2px; font-weight: bold; font-size: 10px;">Min Sell Amount (per transaction):</label>
                            <input type="number" id="minSellAmount" style="width: 100%; padding: 3px; border: 1px solid #ccc; border-radius: 2px; font-size: 10px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 2px; font-weight: bold; font-size: 10px;">Max Sell Amount (per transaction):</label>
                            <input type="number" id="maxSellAmount" style="width: 100%; padding: 3px; border: 1px solid #ccc; border-radius: 2px; font-size: 10px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 2px; font-weight: bold; font-size: 10px;">Max Consecutive Sells:</label>
                            <input type="number" id="maxConsecutiveSells" style="width: 100%; padding: 3px; border: 1px solid #ccc; border-radius: 2px; font-size: 10px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 2px; font-weight: bold; font-size: 10px;">Max Session PP Spend:</label>
                            <input type="number" id="maxSessionPPInput" style="width: 100%; padding: 3px; border: 1px solid #ccc; border-radius: 2px; font-size: 10px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 2px; font-weight: bold; font-size: 10px;">Min Resources to Keep (reserve):</label>
                            <input type="number" id="minResourceKeep" style="width: 100%; padding: 3px; border: 1px solid #ccc; border-radius: 2px; font-size: 10px;">
                        </div>
                    </div>
                </div>
                
                <!-- Timing & Delays -->
                <div style="margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; padding: 8px;">
                    <h5 style="margin: 0 0 8px 0; color: #8B4513; font-size: 12px;">⏱️ Timing & Delays (seconds)</h5>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <div>
                            <label style="display: block; margin-bottom: 2px; font-weight: bold; font-size: 10px;">Price Check Interval - Min:</label>
                            <input type="number" id="minPriceCheckInterval" step="0.1" min="0.1" style="width: 100%; padding: 3px; border: 1px solid #ccc; border-radius: 2px; font-size: 10px;">
                            <div id="minPriceCheckInterval-error" style="color: #f44336; font-size: 8px; display: none;">Must be ≤ max value</div>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 2px; font-weight: bold; font-size: 10px;">Price Check Interval - Max:</label>
                            <input type="number" id="maxPriceCheckInterval" step="0.1" min="0.1" style="width: 100%; padding: 3px; border: 1px solid #ccc; border-radius: 2px; font-size: 10px;">
                            <div id="maxPriceCheckInterval-error" style="color: #f44336; font-size: 8px; display: none;">Must be ≥ min value</div>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 2px; font-weight: bold; font-size: 10px;">Pre-Transaction Delay - Min:</label>
                            <input type="number" id="minPreTransactionDelay" step="0.1" min="0" style="width: 100%; padding: 3px; border: 1px solid #ccc; border-radius: 2px; font-size: 10px;">
                            <div id="minPreTransactionDelay-error" style="color: #f44336; font-size: 8px; display: none;">Must be ≤ max value</div>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 2px; font-weight: bold; font-size: 10px;">Pre-Transaction Delay - Max:</label>
                            <input type="number" id="maxPreTransactionDelay" step="0.1" min="0" style="width: 100%; padding: 3px; border: 1px solid #ccc; border-radius: 2px; font-size: 10px;">
                            <div id="maxPreTransactionDelay-error" style="color: #f44336; font-size: 8px; display: none;">Must be ≥ min value</div>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 2px; font-weight: bold; font-size: 10px;">Transaction Step Delay - Min:</label>
                            <input type="number" id="minDelay" step="0.1" min="0" style="width: 100%; padding: 3px; border: 1px solid #ccc; border-radius: 2px; font-size: 10px;">
                            <div id="minDelay-error" style="color: #f44336; font-size: 8px; display: none;">Must be ≤ max value</div>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 2px; font-weight: bold; font-size: 10px;">Transaction Step Delay - Max:</label>
                            <input type="number" id="maxDelay" step="0.1" min="0" style="width: 100%; padding: 3px; border: 1px solid #ccc; border-radius: 2px; font-size: 10px;">
                            <div id="maxDelay-error" style="color: #f44336; font-size: 8px; display: none;">Must be ≥ min value</div>
                        </div>
                    </div>
                </div>
                
                <!-- Recovery Intervals -->
                <div style="margin-top: 15px; border: 1px solid #ddd; border-radius: 4px; padding: 8px;">
                    <h5 style="margin: 0 0 8px 0; color: #8B4513; font-size: 12px;">🔄 Recovery Intervals (minutes)</h5>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <div>
                            <label style="display: block; margin-bottom: 2px; font-weight: bold; font-size: 10px;">Session Recovery - Min:</label>
                            <input type="number" id="sessionRecoveryMinInterval" min="1" style="width: 100%; padding: 3px; border: 1px solid #ccc; border-radius: 2px; font-size: 10px;">
                            <div id="sessionRecoveryMinInterval-error" style="color: #f44336; font-size: 8px; display: none;">Must be ≤ max value</div>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 2px; font-weight: bold; font-size: 10px;">Session Recovery - Max:</label>
                            <input type="number" id="sessionRecoveryMaxInterval" min="1" style="width: 100%; padding: 3px; border: 1px solid #ccc; border-radius: 2px; font-size: 10px;">
                            <div id="sessionRecoveryMaxInterval-error" style="color: #f44336; font-size: 8px; display: none;">Must be ≥ min value</div>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 2px; font-weight: bold; font-size: 10px;">Bot Protection Recovery - Min:</label>
                            <input type="number" id="botProtectionRecoveryMinInterval" min="1" style="width: 100%; padding: 3px; border: 1px solid #ccc; border-radius: 2px; font-size: 10px;">
                            <div id="botProtectionRecoveryMinInterval-error" style="color: #f44336; font-size: 8px; display: none;">Must be ≤ max value</div>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 2px; font-weight: bold; font-size: 10px;">Bot Protection Recovery - Max:</label>
                            <input type="number" id="botProtectionRecoveryMaxInterval" min="1" style="width: 100%; padding: 3px; border: 1px solid #ccc; border-radius: 2px; font-size: 10px;">
                            <div id="botProtectionRecoveryMaxInterval-error" style="color: #f44336; font-size: 8px; display: none;">Must be ≥ min value</div>
                        </div>
                    </div>
                </div>
                
                <!-- Other Settings -->
                <div style="margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; padding: 8px;">
                    <h5 style="margin: 0 0 8px 0; color: #8B4513; font-size: 12px;">⚙️ Other Settings</h5>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <div>
                            <label style="display: block; margin-bottom: 2px; font-weight: bold; font-size: 10px;">Warehouse Tolerance (safety buffer):</label>
                            <input type="number" id="warehouseTolerance" style="width: 100%; padding: 3px; border: 1px solid #ccc; border-radius: 2px; font-size: 10px;">
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 3px; justify-content: center;">
                            <label style="display: flex; align-items: center; font-weight: bold; font-size: 10px;">
                                <input type="checkbox" id="enableSelling" style="margin-right: 5px;">Enable Selling
                            </label>
                            <label style="display: flex; align-items: center; font-weight: bold; font-size: 10px;">
                                <input type="checkbox" id="dryRun" style="margin-right: 5px;">Dry Run Mode
                            </label>
                            <label style="display: flex; align-items: center; font-weight: bold; font-size: 10px;">
                                <input type="checkbox" id="minimalMode" style="margin-right: 5px;">Minimal Purchase Mode
                            </label>
                        </div>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 10px;">
                    <button id="resetSession" style="background: #ff9800; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 11px;">Reset Session</button>
                </div>
                <div style="margin-top: 15px; border: 1px solid #ddd; border-radius: 4px; padding: 8px;">
                    <h5 style="margin: 0 0 8px 0; color: #8B4513; font-size: 12px;">💾 Settings Import/Export</h5>
                    <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 10px;">
                        <button id="exportSettings" style="background: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 10px;">📤 Export Settings</button>
                        <button id="importSettings" style="background: #2196F3; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 10px;">📥 Import Settings</button>
                    </div>
                    <textarea id="settingsTextArea" placeholder="Settings JSON will appear here for export, or paste settings JSON here for import..." style="width: 100%; height: 80px; padding: 5px; border: 1px solid #ccc; border-radius: 2px; font-size: 10px; font-family: monospace; resize: vertical;" readonly></textarea>
                </div>
            </div>
            
            <div id="bgmGraphsPanel" style="margin-top: 15px; padding: 10px; background: #f9f9f9; border-radius: 4px; display: none; font-size: 11px;">
                <h4 style="margin: 0 0 15px 0; color: #8B4513; text-align: center;">Price History Graphs</h4>
                <div style="margin-bottom: 15px;">
                    <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 10px;">
                        <button id="graphWood" style="background: #A0522D; color: white; border: none; padding: 3px 8px; border-radius: 2px; cursor: pointer; font-size: 10px;">🪵 Wood</button>
                        <button id="graphStone" style="background: #FF8C00; color: white; border: none; padding: 3px 8px; border-radius: 2px; cursor: pointer; font-size: 10px;">🧱 Clay</button>
                        <button id="graphIron" style="background: #888; color: white; border: none; padding: 3px 8px; border-radius: 2px; cursor: pointer; font-size: 10px;">⚙️ Iron</button>
                        <button id="graphAll" style="background: #2196F3; color: white; border: none; padding: 3px 8px; border-radius: 2px; cursor: pointer; font-size: 10px;">📊 All</button>
                    </div>
                    <div style="display: flex; justify-content: center; gap: 5px; margin-bottom: 10px;">
                        <span style="font-size: 10px; color: #666; margin-right: 5px;">Time range:</span>
                        <button id="timeAll" style="background: #666; color: white; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 9px;">All</button>
                        <button id="timeWeek" style="background: #ccc; color: #333; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 9px;">Week</button>
                        <button id="time24h" style="background: #ccc; color: #333; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 9px;">24h</button>
                    </div>
                    <div id="thresholdInfo" style="margin-bottom: 10px; padding: 8px; background: #f8f8f8; border-radius: 4px; border: 1px solid #ddd;">
                        <div style="font-weight: bold; margin-bottom: 8px; font-size: 12px; color: #8B4513; text-align: center;">📊 Trading Thresholds</div>
                        <div style="display: flex; justify-content: space-around; margin-bottom: 8px;">
                            <div style="text-align: center;">
                                <div style="font-size: 10px; color: #666; margin-bottom: 2px;">Current</div>
                                <div style="display: flex; gap: 15px;">
                                    <div style="display: flex; align-items: center;">
                                        <span style="color: #f44336; margin-right: 3px; font-size: 10px;">🔴</span>
                                        <span style="font-size: 10px; color: #f44336; font-weight: bold;">Buy: <span id="currentBuyThresholdGraph">-</span></span>
                                    </div>
                                    <div style="display: flex; align-items: center;">
                                        <span style="color: #4CAF50; margin-right: 3px; font-size: 10px;">🟢</span>
                                        <span style="font-size: 10px; color: #4CAF50; font-weight: bold;">Sell: <span id="currentSellThresholdGraph">-</span></span>
                                    </div>
                                </div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 10px; color: #666; margin-bottom: 2px;">Recommended <span id="dynamicModeIndicator" style="color: #4CAF50; font-weight: bold;"></span></div>
                                <div style="display: flex; gap: 15px;">
                                    <div style="display: flex; align-items: center;">
                                        <span style="color: #FF5722; margin-right: 3px; font-size: 10px;">🔶</span>
                                        <span style="font-size: 10px; color: #FF5722; font-weight: bold;">Buy: <span id="recommendedBuyThresholdGraph">-</span></span>
                                    </div>
                                    <div style="display: flex; align-items: center;">
                                        <span style="color: #8BC34A; margin-right: 3px; font-size: 10px;">🔶</span>
                                        <span style="font-size: 10px; color: #8BC34A; font-weight: bold;">Sell: <span id="recommendedSellThresholdGraph">-</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; justify-content: center; gap: 10px;">
                            <button id="applyAutoThresholdsGraph" style="background: #2196F3; color: white; border: none; padding: 4px 8px; border-radius: 2px; cursor: pointer; font-size: 9px;" disabled>📝 Apply Recommendations</button>
                        </div>
                        <div id="autoThresholdInfoGraph" style="font-size: 9px; color: #666; text-align: center; margin-top: 5px;">
                            Automatically updated when viewing graphs or when thresholds change
                        </div>
                        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #ddd;">
                            <div style="font-weight: bold; margin-bottom: 6px; font-size: 10px; color: #8B4513; text-align: center;">🎛️ Auto-Threshold Band Width</div>
                            <div style="display: flex; justify-content: space-between; gap: 15px;">
                                <div style="flex: 1;">
                                    <label style="display: block; font-size: 9px; color: #f44336; font-weight: bold; margin-bottom: 3px;">🔴 Buy Safety Margin:</label>
                                    <div style="display: flex; align-items: center; gap: 5px;">
                                        <input type="range" id="autoBuyBandWidth" min="0" max="0.30" step="0.01" style="flex: 1; height: 4px;">
                                        <span id="autoBuyBandWidthValue" style="font-size: 9px; font-weight: bold; color: #f44336; min-width: 25px;">15%</span>
                                    </div>
                                    <div style="font-size: 8px; color: #666; margin-top: 2px;">Higher = more conservative buying</div>
                                </div>
                                <div style="flex: 1;">
                                    <label style="display: block; font-size: 9px; color: #4CAF50; font-weight: bold; margin-bottom: 3px;">🟢 Sell Safety Margin:</label>
                                    <div style="display: flex; align-items: center; gap: 5px;">
                                        <input type="range" id="autoSellBandWidth" min="0" max="0.25" step="0.01" style="flex: 1; height: 4px;">
                                        <span id="autoSellBandWidthValue" style="font-size: 9px; font-weight: bold; color: #4CAF50; min-width: 25px;">12%</span>
                                    </div>
                                    <div style="font-size: 8px; color: #666; margin-top: 2px;">Higher = more conservative selling</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="graphInfo" style="text-align: center; font-size: 10px; color: #666; margin-bottom: 10px;"></div>
                    <div id="priceChartContainer" style="width: 100%; height: 300px; border: 1px solid #ccc; border-radius: 2px; background: white;"></div>
                    
                    <div style="margin-top: 15px;">
                        <h5 style="margin: 0 0 10px 0; color: #8B4513; font-size: 12px; text-align: center;">📈 Net Trading Trends</h5>
                        <div style="display: flex; justify-content: center; gap: 5px; margin-bottom: 10px;">
                            <span style="font-size: 10px; color: #666; margin-right: 5px;">Time range:</span>
                            <button id="netTimeAll" style="background: #666; color: white; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 9px;">All</button>
                            <button id="netTimeWeek" style="background: #ccc; color: #333; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 9px;">Week</button>
                            <button id="netTime24h" style="background: #ccc; color: #333; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 9px;">24h</button>
                        </div>
                        <div id="netTrendChartContainer" style="width: 100%; height: 300px; border: 1px solid #ccc; border-radius: 2px; background: white;"></div>
                    </div>
                    
                    <div style="margin-top: 15px;">
                        <h5 style="margin: 0 0 10px 0; color: #8B4513; font-size: 12px; text-align: center;">💰 Average Buy/Sell Prices Over Time</h5>
                        <div style="display: flex; justify-content: center; gap: 5px; margin-bottom: 10px;">
                            <span style="font-size: 10px; color: #666; margin-right: 5px;">Time range:</span>
                            <button id="avgPriceTimeAll" style="background: #666; color: white; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 9px;">All</button>
                            <button id="avgPriceTimeWeek" style="background: #ccc; color: #333; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 9px;">Week</button>
                            <button id="avgPriceTime24h" style="background: #ccc; color: #333; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 9px;">24h</button>
                        </div>
                        <div id="avgPriceChartContainer" style="width: 100%; height: 300px; border: 1px solid #ccc; border-radius: 2px; background: white;"></div>
                    </div>
                </div>
            </div>
            
            <div id="bgmTransactionsPanel" style="margin-top: 15px; padding: 10px; background: #f9f9f9; border-radius: 4px; display: none; font-size: 11px;">
                <h4 style="margin: 0 0 15px 0; color: #8B4513; text-align: center;">Transaction Log</h4>
                <div style="margin-bottom: 15px;">
                    <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 10px;">
                        <button id="clearTransactions" style="background: #f44336; color: white; border: none; padding: 3px 8px; border-radius: 2px; cursor: pointer; font-size: 10px;">🗑️ Clear Log</button>
                        <button id="exportTransactions" style="background: #4CAF50; color: white; border: none; padding: 3px 8px; border-radius: 2px; cursor: pointer; font-size: 10px;">💾 Export CSV</button>
                    </div>
                    <div style="max-height: 300px; overflow-y: auto; border: 1px solid #ccc; border-radius: 2px; background: white;">
                        <table id="transactionTable" style="width: 100%; border-collapse: collapse; font-size: 10px;">
                            <thead style="background: #f0f0f0; position: sticky; top: 0;">
                                <tr>
                                    <th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Time</th>
                                    <th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Type</th>
                                    <th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Resource</th>
                                    <th style="border: 1px solid #ccc; padding: 4px; text-align: right;">Amount</th>
                                    <th style="border: 1px solid #ccc; padding: 4px; text-align: right;">PP Cost</th>
                                    <th style="border: 1px solid #ccc; padding: 4px; text-align: right;">Rate</th>
                                    <th style="border: 1px solid #ccc; padding: 4px; text-align: right;">Res/PP</th>
                                </tr>
                            </thead>
                            <tbody id="transactionTableBody">
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(statusUI);

        // Add event listeners
        document.getElementById('bgmStop').onclick = stopMonitor;
        document.getElementById('bgmStart').onclick = startMonitor;
        document.getElementById('bgmClose').onclick = closeMonitor;
        document.getElementById('bgmSettings').onclick = toggleSettings;
        document.getElementById('bgmGraphs').onclick = toggleGraphs;
        document.getElementById('bgmTransactions').onclick = toggleTransactions;

        // Auto-threshold graph section event listeners
        document.getElementById('applyAutoThresholdsGraph').onclick = applyAutoThresholdsFromGraph;

        // Band width slider event listeners
        document.getElementById('autoBuyBandWidth').oninput = updateBuyBandWidth;
        document.getElementById('autoSellBandWidth').oninput = updateSellBandWidth;


        // Initialize settings values
        initializeSettingsPanel();

        updateStatsDisplay();

        // Initialize threshold input states
        updateThresholdInputsState();

        // Initialize graph threshold display
        updateGraphThresholds();
    }

    function updateStatus(message, color = '#2196F3') {
        if (statusUI) {
            const statusEl = document.getElementById('bgmStatus');
            statusEl.innerHTML = `Status: <span style="color: ${color};">${message}</span>`;
        }
    }

    let currentTaskCountdown = null;

    function updateCurrentTask(task, countdown = null) {
        if (statusUI) {
            const taskEl = document.getElementById('taskDescription');
            let displayText;
            if (countdown !== null) {
                displayText = `${task} (${countdown}s)`;
                taskEl.textContent = displayText;
                // Update browser tab title with countdown - keep it short
                const { world, continent } = getCurrentWorldInfo();
                document.title = `${world} K${continent}: ${task} (${countdown}s)`;
            } else {
                displayText = task;
                taskEl.textContent = displayText;
                // Update browser tab title - keep it short
                const { world, continent } = getCurrentWorldInfo();
                document.title = `${world} K${continent}: ${task}`;
            }
        }
    }

    function startCountdown(task, seconds) {
        let remaining = seconds;
        updateCurrentTask(task, remaining);

        // Clear any existing countdown
        if (currentTaskCountdown) {
            clearInterval(currentTaskCountdown);
        }

        currentTaskCountdown = setInterval(() => {
            remaining--;
            if (remaining <= 0) {
                clearInterval(currentTaskCountdown);
                currentTaskCountdown = null;
                updateCurrentTask("Checking prices...");
            } else {
                updateCurrentTask(task, remaining);
            }
        }, 1000);
    }

    function updateStatsDisplay() {
        if (!statusUI) return;

        document.getElementById('sessionSpent').textContent = `-${sessionData.totalSpent}`;
        document.getElementById('sessionEarned').textContent = `+${sessionData.totalEarned || 0}`;
        document.getElementById('totalWood').textContent = sessionData.totalWood;
        document.getElementById('totalStone').textContent = sessionData.totalStone;
        document.getElementById('totalIron').textContent = sessionData.totalIron;
        document.getElementById('soldWood').textContent = sessionData.soldWood || 0;
        document.getElementById('soldStone').textContent = sessionData.soldStone || 0;
        document.getElementById('soldIron').textContent = sessionData.soldIron || 0;
        document.getElementById('merchantsHome').textContent = merchantsHome;

        // Update current prices
        document.getElementById('woodPrice').textContent = currentPrices.wood > 0 ? `${Math.round(1 / currentPrices.wood)} res/PP` : '-';
        document.getElementById('stonePrice').textContent = currentPrices.stone > 0 ? `${Math.round(1 / currentPrices.stone)} res/PP` : '-';
        document.getElementById('ironPrice').textContent = currentPrices.iron > 0 ? `${Math.round(1 / currentPrices.iron)} res/PP` : '-';

        // Update current PP if available
        if (window.game_data && window.game_data.player && window.game_data.player.pp !== undefined) {
            document.getElementById('currentPP').textContent = window.game_data.player.pp;
        }

        // Calculate net PP for each resource
        const resources = ['wood', 'stone', 'iron'];
        const resourceNetIds = { wood: 'woodNet', stone: 'clayNet', iron: 'ironNet' }; // Map stone to clayNet
        let totalBoughtRes = 0;
        let totalSoldRes = 0;
        let totalNetPP = 0;

        resources.forEach(resource => {
            const buyTransactions = sessionData.transactions.filter(t => t.resource === resource && t.cost > 0);
            const sellTransactions = sessionData.transactions.filter(t => t.resource === resource && t.cost < 0);
            const totalCost = buyTransactions.reduce((sum, t) => sum + t.cost, 0);
            const totalEarned = Math.abs(sellTransactions.reduce((sum, t) => sum + t.cost, 0));
            const netPP = totalEarned - totalCost;

            const netElement = document.getElementById(resourceNetIds[resource]);
            netElement.textContent = netPP > 0 ? `+${netPP}` : netPP.toString();
            netElement.style.color = netPP > 0 ? '#4CAF50' : netPP < 0 ? '#f44336' : '#666';

            // Add to totals (note: stone is still stored as totalStone internally)
            const resourceKey = resource === 'stone' ? 'Stone' : resource.charAt(0).toUpperCase() + resource.slice(1);
            totalBoughtRes += sessionData[`total${resourceKey}`] || 0;
            totalSoldRes += sessionData[`sold${resourceKey}`] || 0;
            totalNetPP += netPP;
        });

        // Update summary row
        document.getElementById('totalBought').textContent = totalBoughtRes;
        document.getElementById('totalSold').textContent = totalSoldRes;
        const totalNetElement = document.getElementById('totalNetPP');
        totalNetElement.textContent = totalNetPP > 0 ? `+${totalNetPP}` : totalNetPP.toString();
        totalNetElement.style.color = totalNetPP > 0 ? '#4CAF50' : totalNetPP < 0 ? '#f44336' : '#666';

        // Calculate and update average prices
        const avgBuyPriceElement = document.getElementById('avgBuyPrice');
        const avgSellPriceElement = document.getElementById('avgSellPrice');

        if (totalBoughtRes > 0 && sessionData.totalSpent > 0) {
            const avgBuyPrice = Math.round(totalBoughtRes / sessionData.totalSpent);
            avgBuyPriceElement.textContent = `${avgBuyPrice} res/PP`;
        } else {
            avgBuyPriceElement.textContent = '-';
        }

        if (totalSoldRes > 0 && sessionData.totalEarned > 0) {
            const avgSellPrice = Math.round(totalSoldRes / sessionData.totalEarned);
            avgSellPriceElement.textContent = `${avgSellPrice} res/PP`;
        } else {
            avgSellPriceElement.textContent = '-';
        }

        // Calculate and update net summary
        const netResources = totalBoughtRes - totalSoldRes;
        const netPP = totalNetPP;

        let summaryText = `Net ${netResources} resources, Net ${netPP > 0 ? '+' : ''}${netPP} PP`;

        // Calculate res/PP ratio only if there's a meaningful net PP value
        if (Math.abs(netPP) > 0) {
            const resPerPP = netResources / (-netPP); // Divide by negative of net PP as requested
            summaryText += ` → ${Math.round(resPerPP)} res/PP`;
        }

        document.getElementById('netSummaryText').textContent = summaryText;

        // Update last event display
        updateLastEventDisplay();

        // Update price chart
        updatePriceChart();
    }

    function updateLastEventDisplay() {
        if (!statusUI || !sessionData.transactions || sessionData.transactions.length === 0) {
            return;
        }

        // Get the most recent transaction
        const lastTransaction = sessionData.transactions[sessionData.transactions.length - 1];

        // Calculate time ago
        const now = Date.now();
        const timeDiff = now - lastTransaction.timestamp;
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        let timeAgoText;
        if (hours > 0) {
            timeAgoText = `${hours}h ${minutes}m ago`;
        } else if (minutes > 0) {
            timeAgoText = `${minutes}m ago`;
        } else {
            timeAgoText = 'Just now';
        }

        // Format the transaction
        const action = lastTransaction.cost > 0 ? 'Bought' : 'Sold';
        const resource = lastTransaction.resource.charAt(0).toUpperCase() + lastTransaction.resource.slice(1);
        const amount = Math.abs(lastTransaction.amount);
        const pp = Math.abs(lastTransaction.cost);
        const time = new Date(lastTransaction.timestamp).toLocaleTimeString();

        const eventText = `(${timeAgoText}): ${action} ${amount} ${resource.toLowerCase()} for ${pp}pp at ${time}`;

        document.getElementById('lastEventText').textContent = eventText;
    }

    function updatePriceChart() {
        if (!statusUI) return;

        const chartContent = document.getElementById('chartContent');
        if (!chartContent) return;

        const resources = [
            { name: 'Wood', icon: '🪵', key: 'wood', position: 20 },
            { name: 'Clay', icon: '🧱', key: 'stone', position: 50 },
            { name: 'Iron', icon: '⚙️', key: 'iron', position: 80 }
        ];

        const buyThreshold = settings.MIN_RESOURCE_PER_PP;
        const sellThreshold = settings.MAX_SELL_RESOURCE_PER_PP;

        // Get all current resource per PP values
        const currentResourcePerPPValues = resources.map(r => currentPrices[r.key] > 0 ? (1 / currentPrices[r.key]) : 0).filter(v => v > 0);

        // Find dynamic min and max values for scaling
        const allValues = [buyThreshold, sellThreshold, ...currentResourcePerPPValues].filter(v => v > 0);
        const minValue = Math.min(...allValues) * 0.9; // Add 10% padding below
        const maxValue = Math.max(...allValues) * 1.1; // Add 10% padding above
        const valueRange = maxValue - minValue;

        // Calculate line positions
        const buyLineHeight = ((buyThreshold - minValue) / valueRange) * 100;
        const sellLineHeight = ((sellThreshold - minValue) / valueRange) * 100;

        let chartHTML = `
            <div style="position: relative; width: calc(100% - 45px); height: 120px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px; margin: 12px auto;">
                <!-- Y-axis scale labels -->
                <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 40px; display: flex; flex-direction: column; justify-content: space-between; font-size: 9px; color: #666;">
                    <div style="text-align: right; padding-right: 5px;">${maxValue.toFixed(1)}</div>
                    <div style="text-align: right; padding-right: 5px;">${((maxValue + minValue) / 2).toFixed(1)}</div>
                    <div style="text-align: right; padding-right: 5px;">${minValue.toFixed(1)}</div>
                </div>
                
                <!-- Chart area -->
                <div style="position: absolute; left: 45px; right: 40px; top: 10px; bottom: 10px;">
                    <!-- Current sell threshold line (only if selling enabled) -->
                    ${settings.ENABLE_SELLING ? `
                        <div style="position: absolute; bottom: ${sellLineHeight}%; left: 0; right: 0; height: 2px; background: #4CAF50; z-index: 2;"></div>
                        <div style="position: absolute; bottom: ${sellLineHeight}%; right: -35px; font-size: 9px; color: #4CAF50; font-weight: bold; white-space: nowrap;">Sell (${sellThreshold.toFixed(1)})</div>
                    ` : ''}
                    
                    <!-- Current buy threshold line -->
                    <div style="position: absolute; bottom: ${buyLineHeight}%; left: 0; right: 0; height: 2px; background: #f44336; z-index: 2;"></div>
                    <div style="position: absolute; bottom: ${buyLineHeight}%; right: -35px; font-size: 9px; color: #f44336; font-weight: bold; white-space: nowrap;">Buy (${buyThreshold.toFixed(1)})</div>
        `;

        // Add resource markers
        resources.forEach(resource => {
            const currentPrice = currentPrices[resource.key];
            const currentResourcePerPP = currentPrice > 0 ? (1 / currentPrice) : 0;

            if (currentResourcePerPP > 0) {
                const markerHeight = ((currentResourcePerPP - minValue) / valueRange) * 100;

                // Determine marker color based on position relative to thresholds
                let markerColor = '#999';
                if (currentResourcePerPP >= buyThreshold) {
                    markerColor = '#f44336'; // Red - good for buying
                } else if (settings.ENABLE_SELLING && currentResourcePerPP <= sellThreshold) {
                    markerColor = '#4CAF50'; // Green - good for selling
                } else {
                    markerColor = '#f44336'; // Red - no action
                }

                // Get price change arrow
                let changeArrow = '';
                if (priceChanges[resource.key] === 'up') {
                    changeArrow = '↗️';
                } else if (priceChanges[resource.key] === 'down') {
                    changeArrow = '↘️';
                }

                chartHTML += `
                    <!-- ${resource.name} marker -->
                    <div style="position: absolute; left: ${resource.position}%; bottom: ${markerHeight}%; transform: translate(-50%, 50%);">
                        <div style="width: 12px; height: 12px; background: ${markerColor}; border: 2px solid white; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.3); z-index: 3;"></div>
                        <div style="position: absolute; top: -30px; left: 50%; transform: translateX(-50%); text-align: center; font-size: 9px; white-space: nowrap;">
                            <div style="font-weight: bold; color: ${markerColor};">${currentResourcePerPP.toFixed(1)}</div>
                            <div style="font-size: 8px;">${changeArrow}</div>
                        </div>
                    </div>
                `;
            }
        });

        chartHTML += `
                </div>
                
                <!-- Resource labels at bottom -->
                <div style="position: absolute; left: 45px; right: 40px; bottom: -25px; display: flex; justify-content: space-between;">
        `;

        resources.forEach(resource => {
            const currentPrice = currentPrices[resource.key];
            const currentResourcePerPP = currentPrice > 0 ? (1 / currentPrice) : 0;

            // Determine status
            let statusText = 'No data';
            let statusColor = '#999';
            if (currentResourcePerPP > 0) {
                if (currentResourcePerPP >= buyThreshold) {
                    statusText = 'BUY';
                    statusColor = '#f44336';
                } else if (settings.ENABLE_SELLING && currentResourcePerPP <= sellThreshold) {
                    statusText = 'SELL';
                    statusColor = '#4CAF50';
                } else {
                    statusText = 'WAIT';
                    statusColor = '#f44336';
                }
            }

            chartHTML += `
                <div style="text-align: center; flex: 1;">
                    <div style="font-size: 14px;">${resource.icon}</div>
                    <div style="font-size: 10px; font-weight: bold; color: ${statusColor};">${statusText}</div>
                </div>
            `;
        });

        chartHTML += `
                </div>
            </div>
            
            <!-- Legend -->
            <div style="display: flex; justify-content: center; align-items: center; font-size: 10px; color: #666; margin-top: 30px; flex-wrap: wrap; gap: 15px;">
                ${settings.ENABLE_SELLING ? `<span style="color: #4CAF50; font-weight: bold;">— Sell: ${sellThreshold.toFixed(1)}</span>` : ''}
                <span style="color: #f44336; font-weight: bold;">— Buy: ${buyThreshold.toFixed(1)}</span>
                <span style="color: #666;">● Current Price</span>
                <span style="color: #999; font-size: 9px;">Range: ${minValue.toFixed(1)} - ${maxValue.toFixed(1)} res/PP</span>
            </div>
        `;

        chartContent.innerHTML = chartHTML;
    }

    function setActiveTab(activeTabId) {
        // Reset all tab buttons to default style
        const tabButtons = ['bgmSettings', 'bgmGraphs', 'bgmTransactions'];
        tabButtons.forEach(tabId => {
            const button = document.getElementById(tabId);
            if (button) {
                button.style.background = '';
                button.style.color = '';
            }
        });

        // Set active tab style
        if (activeTabId) {
            const activeButton = document.getElementById(activeTabId);
            if (activeButton) {
                activeButton.style.background = '#8B4513';
                activeButton.style.color = 'white';
            }
        }
    }

    function toggleSettings() {
        const settingsPanel = document.getElementById('bgmSettingsPanel');
        const graphsPanel = document.getElementById('bgmGraphsPanel');
        const transactionsPanel = document.getElementById('bgmTransactionsPanel');

        if (settingsPanel.style.display === 'none') {
            // Close other panels
            graphsPanel.style.display = 'none';
            transactionsPanel.style.display = 'none';

            settingsPanel.style.display = 'block';
            setActiveTab('bgmSettings');
        } else {
            settingsPanel.style.display = 'none';
            setActiveTab(null);
        }
    }

    function toggleGraphs() {
        const settingsPanel = document.getElementById('bgmSettingsPanel');
        const graphsPanel = document.getElementById('bgmGraphsPanel');
        const transactionsPanel = document.getElementById('bgmTransactionsPanel');

        if (graphsPanel.style.display === 'none') {
            // Close other panels
            settingsPanel.style.display = 'none';
            transactionsPanel.style.display = 'none';

            graphsPanel.style.display = 'block';
            setActiveTab('bgmGraphs');
            initializeGraphs();
        } else {
            graphsPanel.style.display = 'none';
            setActiveTab(null);
        }
    }

    function toggleTransactions() {
        const settingsPanel = document.getElementById('bgmSettingsPanel');
        const graphsPanel = document.getElementById('bgmGraphsPanel');
        const transactionsPanel = document.getElementById('bgmTransactionsPanel');

        if (transactionsPanel.style.display === 'none') {
            // Close other panels
            settingsPanel.style.display = 'none';
            graphsPanel.style.display = 'none';

            transactionsPanel.style.display = 'block';
            setActiveTab('bgmTransactions');
            initializeTransactions();
        } else {
            transactionsPanel.style.display = 'none';
            setActiveTab(null);
        }
    }

    function initializeTransactions() {
        updateTransactionTable();

        // Add event listeners for transaction buttons
        document.getElementById('clearTransactions').onclick = () => {
            if (confirm('Are you sure you want to clear all transaction history?')) {
                sessionData.transactions = [];
                setLocalStorage(getVillageStorageKey('backgroundMonitorSession'), sessionData);
                updateTransactionTable();
                updateStatsDisplay();
            }
        };

        document.getElementById('exportTransactions').onclick = exportTransactionsCSV;
    }

    function updateTransactionTable() {
        const tbody = document.getElementById('transactionTableBody');
        tbody.innerHTML = '';

        // Sort transactions by timestamp (newest first)
        const sortedTransactions = [...sessionData.transactions].sort((a, b) => b.timestamp - a.timestamp);

        sortedTransactions.forEach(transaction => {
            const row = document.createElement('tr');

            const time = new Date(transaction.timestamp).toLocaleString();
            const type = transaction.amount > 0 ? 'Buy' : 'Sell';
            const typeColor = transaction.amount > 0 ? '#f44336' : '#4CAF50';
            const amount = Math.abs(transaction.amount);
            const cost = Math.abs(transaction.cost);
            const rate = transaction.rate;
            const resPerPP = (1 / rate).toFixed(1);

            row.innerHTML = `
                <td style="border: 1px solid #ccc; padding: 4px;">${time}</td>
                <td style="border: 1px solid #ccc; padding: 4px; color: ${typeColor}; font-weight: bold;">${type}</td>
                <td style="border: 1px solid #ccc; padding: 4px;">${transaction.resource}</td>
                <td style="border: 1px solid #ccc; padding: 4px; text-align: right;">${amount.toLocaleString()}</td>
                <td style="border: 1px solid #ccc; padding: 4px; text-align: right;">${cost}</td>
                <td style="border: 1px solid #ccc; padding: 4px; text-align: right;">${rate.toFixed(6)}</td>
                <td style="border: 1px solid #ccc; padding: 4px; text-align: right;">${resPerPP}</td>
            `;

            tbody.appendChild(row);
        });

        if (sortedTransactions.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="7" style="border: 1px solid #ccc; padding: 8px; text-align: center; color: #666;">No transactions recorded</td>';
            tbody.appendChild(row);
        }
    }

    function exportTransactionsCSV() {
        if (sessionData.transactions.length === 0) {
            alert('No transactions to export');
            return;
        }

        const headers = ['Timestamp', 'DateTime', 'Type', 'Resource', 'Amount', 'PP_Cost', 'Rate', 'Resources_per_PP'];
        const rows = sessionData.transactions.map(t => [
            t.timestamp,
            new Date(t.timestamp).toISOString(),
            t.amount > 0 ? 'Buy' : 'Sell',
            t.resource,
            Math.abs(t.amount),
            Math.abs(t.cost),
            t.rate,
            (1 / t.rate).toFixed(1)
        ]);

        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pp_transactions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function initializeGraphs() {
        const { world, continent } = getCurrentWorldInfo();
        const key = `${world}_${continent}`;
        const data = priceHistory[key];

        if (!data || !data.prices.wood.length) {
            document.getElementById('graphInfo').textContent = `No price history available for ${world} continent ${continent}. Data is logged every hour.`;
            return;
        }

        document.getElementById('graphInfo').textContent = `Price history for ${world} continent ${continent} (${data.prices.wood.length} data points)`;

        // Load AnyChart library if not already loaded
        if (!window.anychart) {
            loadAnyChart(() => {
                setupGraphButtons();
                drawGraph('all'); // Draw all resources graph by default
            });
        } else {
            setupGraphButtons();
            drawGraph('all');
        }
    }

    function loadAnyChart(callback) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://cdn.anychart.com/releases/8.13.0/js/anychart-base.min.js';
        script.onload = callback;
        document.head.appendChild(script);
    }

    function updateTimeFilterButtons() {
        // Update time filter button styles
        const timeButtons = ['timeAll', 'timeWeek', 'time24h'];
        timeButtons.forEach(id => {
            const button = document.getElementById(id);
            const isActive = (id === 'timeAll' && currentTimeRange === 'all') ||
                (id === 'timeWeek' && currentTimeRange === 'week') ||
                (id === 'time24h' && currentTimeRange === '24h');

            if (isActive) {
                button.style.background = '#666';
                button.style.color = 'white';
            } else {
                button.style.background = '#ccc';
                button.style.color = '#333';
            }
        });
    }

    function setupGraphButtons() {
        // Add graph button event listeners
        document.getElementById('graphWood').onclick = () => {
            currentGraphResource = 'wood';
            drawGraph('wood');
            updateGraphThresholds();
        };
        document.getElementById('graphStone').onclick = () => {
            currentGraphResource = 'stone';
            drawGraph('stone');
            updateGraphThresholds();
        };
        document.getElementById('graphIron').onclick = () => {
            currentGraphResource = 'iron';
            drawGraph('iron');
            updateGraphThresholds();
        };
        document.getElementById('graphAll').onclick = () => {
            currentGraphResource = 'all';
            drawGraph('all');
            updateGraphThresholds();
        };

        // Add time filter button event listeners
        document.getElementById('timeAll').onclick = () => {
            currentTimeRange = 'all';
            updateTimeFilterButtons();
            drawGraph(currentGraphResource);
            updateGraphThresholds();
        };
        document.getElementById('timeWeek').onclick = () => {
            currentTimeRange = 'week';
            updateTimeFilterButtons();
            drawGraph(currentGraphResource);
            updateGraphThresholds();
        };
        document.getElementById('time24h').onclick = () => {
            currentTimeRange = '24h';
            updateTimeFilterButtons();
            drawGraph(currentGraphResource);
            updateGraphThresholds();
        };

        // Add net trend time filter button event listeners
        document.getElementById('netTimeAll').onclick = () => {
            currentNetTimeRange = 'all';
            updateNetTimeFilterButtons();
            drawNetTrendGraph();
        };
        document.getElementById('netTimeWeek').onclick = () => {
            currentNetTimeRange = 'week';
            updateNetTimeFilterButtons();
            drawNetTrendGraph();
        };
        document.getElementById('netTime24h').onclick = () => {
            currentNetTimeRange = '24h';
            updateNetTimeFilterButtons();
            drawNetTrendGraph();
        };

        // Add average price time filter button event listeners
        document.getElementById('avgPriceTimeAll').onclick = () => {
            currentAvgPriceTimeRange = 'all';
            updateAvgPriceTimeFilterButtons();
            drawAvgPriceGraph();
        };
        document.getElementById('avgPriceTimeWeek').onclick = () => {
            currentAvgPriceTimeRange = 'week';
            updateAvgPriceTimeFilterButtons();
            drawAvgPriceGraph();
        };
        document.getElementById('avgPriceTime24h').onclick = () => {
            currentAvgPriceTimeRange = '24h';
            updateAvgPriceTimeFilterButtons();
            drawAvgPriceGraph();
        };

        // Initialize button states
        updateTimeFilterButtons();
        updateNetTimeFilterButtons();
        updateAvgPriceTimeFilterButtons();

        // Draw initial graphs
        drawNetTrendGraph();
        drawAvgPriceGraph();
    }

    function updateNetTimeFilterButtons() {
        // Update net trend time filter button styles
        const netTimeButtons = ['netTimeAll', 'netTimeWeek', 'netTime24h'];
        netTimeButtons.forEach(id => {
            const button = document.getElementById(id);
            const isActive = (id === 'netTimeAll' && currentNetTimeRange === 'all') ||
                (id === 'netTimeWeek' && currentNetTimeRange === 'week') ||
                (id === 'netTime24h' && currentNetTimeRange === '24h');

            if (isActive) {
                button.style.background = '#666';
                button.style.color = 'white';
            } else {
                button.style.background = '#ccc';
                button.style.color = '#333';
            }
        });
    }

    function updateAvgPriceTimeFilterButtons() {
        // Update average price time filter button styles
        const avgPriceTimeButtons = ['avgPriceTimeAll', 'avgPriceTimeWeek', 'avgPriceTime24h'];
        avgPriceTimeButtons.forEach(id => {
            const button = document.getElementById(id);
            const isActive = (id === 'avgPriceTimeAll' && currentAvgPriceTimeRange === 'all') ||
                (id === 'avgPriceTimeWeek' && currentAvgPriceTimeRange === 'week') ||
                (id === 'avgPriceTime24h' && currentAvgPriceTimeRange === '24h');

            if (isActive) {
                button.style.background = '#666';
                button.style.color = 'white';
            } else {
                button.style.background = '#ccc';
                button.style.color = '#333';
            }
        });
    }

    function drawGraph(resource) {
        const { world, continent } = getCurrentWorldInfo();
        const key = `${world}_${continent}`;
        const data = priceHistory[key];

        if (!data) return;

        // Clear previous chart if it exists
        const container = document.getElementById('priceChartContainer');
        container.innerHTML = '';

        anychart.onDocumentReady(() => {
            // Create scatter chart (similar to PPHistoryGraph.js)
            const chart = anychart.scatter();

            // Prepare data based on resource selection
            const resources = resource === 'all' ? ['wood', 'stone', 'iron'] : [resource];
            const colors = { wood: '#A0522D', stone: '#FF8C00', iron: '#888' };

            // Calculate time filter cutoff
            const now = Date.now();
            let cutoffTime = 0;
            if (currentTimeRange === 'week') {
                cutoffTime = now - (7 * 24 * 60 * 60 * 1000); // 7 days ago
            } else if (currentTimeRange === '24h') {
                cutoffTime = now - (24 * 60 * 60 * 1000); // 24 hours ago
            }

            // Store all filtered data for average calculation
            const allFilteredData = {};

            resources.forEach(res => {
                const prices = data.prices[res];
                if (!prices.length) return;

                // Filter data based on time range
                const filteredPrices = currentTimeRange === 'all'
                    ? prices
                    : prices.filter(point => point.timestamp >= cutoffTime);

                if (!filteredPrices.length) return;

                // Store filtered data for average calculation
                allFilteredData[res] = filteredPrices;

                // Format data for AnyChart: [{x: timestamp, value: resPerPP}, ...]
                const chartData = filteredPrices.map(point => ({
                    x: point.timestamp,
                    value: point.resPerPP
                }));

                // Add line for this resource
                const line = chart.line(chartData).markers(true).name(res.charAt(0).toUpperCase() + res.slice(1));
                line.stroke({ color: colors[res], thickness: 2 });
                line.markers()
                    .type('circle')
                    .size(4)
                    .fill(colors[res])
                    .stroke(colors[res]);
            });

            // Add average price line when showing all resources
            if (resource === 'all' && Object.keys(allFilteredData).length === 3) {
                // Calculate average prices for each timestamp where all three resources have data
                const averageData = [];
                const allTimestamps = new Set();

                // Collect all unique timestamps
                Object.values(allFilteredData).forEach(priceArray => {
                    priceArray.forEach(point => allTimestamps.add(point.timestamp));
                });

                // For each timestamp, calculate average if all three resources have data
                Array.from(allTimestamps).sort().forEach(timestamp => {
                    const resourceValues = [];

                    ['wood', 'stone', 'iron'].forEach(res => {
                        const dataPoint = allFilteredData[res].find(p => p.timestamp === timestamp);
                        if (dataPoint) {
                            resourceValues.push(dataPoint.resPerPP);
                        }
                    });

                    // Only add average if all three resources have data for this timestamp
                    if (resourceValues.length === 3) {
                        const average = resourceValues.reduce((sum, val) => sum + val, 0) / 3;
                        averageData.push({
                            x: timestamp,
                            value: Math.round(average * 10) / 10 // Round to 1 decimal place
                        });
                    }
                });

                // Add average line if we have data
                if (averageData.length > 0) {
                    const avgLine = chart.line(averageData).markers(true).name('Average (3 Resources)');
                    avgLine.stroke({ color: '#2196F3', thickness: 3, dash: '5 5' }); // Blue dashed line
                    avgLine.markers()
                        .type('diamond')
                        .size(6)
                        .fill('#2196F3')
                        .stroke('#2196F3');
                }
            }

            // Add threshold lines
            const buyThreshold = settings.MIN_RESOURCE_PER_PP;
            const sellThreshold = settings.MAX_SELL_RESOURCE_PER_PP;

            // Calculate recommendations for threshold lines
            const recommendations = calculateAutoThresholds();
            const recBuyThreshold = recommendations.buyThreshold;
            const recSellThreshold = recommendations.sellThreshold;

            // Get time range for threshold lines
            const currentTime = Date.now();
            let startTime, endTime;
            if (currentTimeRange === 'week') {
                startTime = currentTime - (7 * 24 * 60 * 60 * 1000);
                endTime = currentTime;
            } else if (currentTimeRange === '24h') {
                startTime = currentTime - (24 * 60 * 60 * 1000);
                endTime = currentTime;
            } else {
                // For 'all', use the data range
                const allTimestamps = [];
                resources.forEach(res => {
                    if (data.prices[res].length > 0) {
                        data.prices[res].forEach(point => allTimestamps.push(point.timestamp));
                    }
                });
                if (allTimestamps.length > 0) {
                    startTime = Math.min(...allTimestamps);
                    endTime = Math.max(...allTimestamps);
                } else {
                    startTime = currentTime - (7 * 24 * 60 * 60 * 1000); // Fallback to week
                    endTime = currentTime;
                }
            }

            // Current Buy Threshold Line
            const buyThresholdData = [
                { x: startTime, value: buyThreshold },
                { x: endTime, value: buyThreshold }
            ];
            const buyThresholdLine = chart.line(buyThresholdData).name('Current Buy Threshold');
            buyThresholdLine.stroke({ color: '#f44336', thickness: 2 });
            buyThresholdLine.markers().enabled(false);

            // Current Sell Threshold Line (if selling enabled)
            if (settings.ENABLE_SELLING) {
                const sellThresholdData = [
                    { x: startTime, value: sellThreshold },
                    { x: endTime, value: sellThreshold }
                ];
                const sellThresholdLine = chart.line(sellThresholdData).name('Current Sell Threshold');
                sellThresholdLine.stroke({ color: '#4CAF50', thickness: 2 });
                sellThresholdLine.markers().enabled(false);
            }

            // Recommended Buy Threshold Line (if different from current)
            if (recBuyThreshold !== null && recBuyThreshold !== buyThreshold) {
                const recBuyThresholdData = [
                    { x: startTime, value: recBuyThreshold },
                    { x: endTime, value: recBuyThreshold }
                ];
                const recBuyThresholdLine = chart.line(recBuyThresholdData).name('Recommended Buy Threshold');
                recBuyThresholdLine.stroke({ color: '#FF5722', thickness: 2, dash: '5 5' });
                recBuyThresholdLine.markers().enabled(false);
            }

            // Recommended Sell Threshold Line (if different from current and selling enabled)
            if (recSellThreshold !== null && recSellThreshold !== sellThreshold && settings.ENABLE_SELLING) {
                const recSellThresholdData = [
                    { x: startTime, value: recSellThreshold },
                    { x: endTime, value: recSellThreshold }
                ];
                const recSellThresholdLine = chart.line(recSellThresholdData).name('Recommended Sell Threshold');
                recSellThresholdLine.stroke({ color: '#8BC34A', thickness: 2, dash: '5 5' });
                recSellThresholdLine.markers().enabled(false);
            }

            // Configure X-axis (DateTime)
            chart.xScale('date-time');
            chart.xAxis().title('Date/Time').labels().format(function () {
                return anychart.format.dateTime(this.value, 'MM/dd HH:mm');
            });

            // Configure Y-axis
            chart.yAxis().title('Resources per PP');

            // Enable and customize legend
            chart.legend().enabled(true).position('bottom').itemsLayout('horizontal');

            // Add grid lines
            chart.xGrid().enabled(true);
            chart.yGrid().enabled(true);

            // Configure tooltip to show formatted datetime
            chart.tooltip().format(function () {
                const formattedDate = anychart.format.dateTime(this.x, 'MMM dd, yyyy HH:mm');
                const valueText = this.seriesName.includes('Average') ?
                    `Average: ${this.value} res/PP` :
                    `Price: ${this.value} res/PP`;
                return `${this.seriesName}\nTime: ${formattedDate}\n${valueText}`;
            });

            // Set chart title
            const resourceTitle = resource === 'all' ? 'All Resources' : resource.charAt(0).toUpperCase() + resource.slice(1);
            const timeRangeTitle = currentTimeRange === 'all' ? 'All Time' :
                currentTimeRange === 'week' ? 'Last 7 Days' : 'Last 24 Hours';
            chart.title(`${resourceTitle} Price History - ${world} Continent ${continent} (${timeRangeTitle})`);

            // Set container and draw
            chart.container('priceChartContainer');
            chart.draw();
        });
    }

    function drawNetTrendGraph() {
        // Clear previous chart if it exists
        const container = document.getElementById('netTrendChartContainer');
        if (!container) return; // Container not found
        container.innerHTML = '';

        // Calculate time filter cutoff
        const now = Date.now();
        let cutoffTime = 0;
        if (currentNetTimeRange === 'week') {
            cutoffTime = now - (7 * 24 * 60 * 60 * 1000); // 7 days ago
        } else if (currentNetTimeRange === '24h') {
            cutoffTime = now - (24 * 60 * 60 * 1000); // 24 hours ago
        }

        // Filter transactions based on time range
        const filteredTransactions = currentNetTimeRange === 'all'
            ? sessionData.transactions
            : sessionData.transactions.filter(t => t.timestamp >= cutoffTime);

        if (!filteredTransactions.length) {
            container.innerHTML = '<div style="text-align: center; padding: 50px; color: #666;">No transaction data available for selected time range</div>';
            return;
        }

        anychart.onDocumentReady(() => {
            // Create line chart with dual Y axes
            const chart = anychart.line();

            // Sort transactions by timestamp
            const sortedTransactions = [...filteredTransactions].sort((a, b) => a.timestamp - b.timestamp);

            // Calculate cumulative values
            let cumulativeNetPP = 0;
            let cumulativeNetResources = 0;
            const netPPData = [];
            const netResourceData = [];

            sortedTransactions.forEach(transaction => {
                // Update cumulative values
                cumulativeNetPP -= transaction.cost || 0; // cost is negative for sales, positive for purchases

                // Calculate resource change (positive for purchases, negative for sales)
                cumulativeNetResources += transaction.amount;

                netPPData.push({
                    x: transaction.timestamp,
                    value: cumulativeNetPP
                });

                netResourceData.push({
                    x: transaction.timestamp,
                    value: cumulativeNetResources
                });
            });

            // Add Net Resources line (left Y-axis)
            const netResourceLine = chart.line(netResourceData).markers(true).name('Net Resources');
            netResourceLine.stroke({ color: '#4CAF50', thickness: 2 });
            netResourceLine.markers()
                .type('circle')
                .size(4)
                .fill('#4CAF50')
                .stroke('#4CAF50');

            // Add Net PP line (right Y-axis)
            const netPPLine = chart.line(netPPData).markers(true).name('Net PP');
            netPPLine.stroke({ color: '#f44336', thickness: 2 });
            netPPLine.markers()
                .type('circle')
                .size(4)
                .fill('#f44336')
                .stroke('#f44336');
            netPPLine.yScale(1); // Use second Y-axis

            // Configure X-axis (DateTime)
            chart.xScale('date-time');
            chart.xAxis().title('Date/Time').labels().format(function () {
                return anychart.format.dateTime(this.value, 'MM/dd HH:mm');
            });

            // Configure left Y-axis (Resources)
            chart.yAxis(0).title('Net Resources').labels().format('{%value}');
            chart.yAxis(0).orientation('left');

            // Configure right Y-axis (PP) with data-based limits
            const ppValues = netPPData.map(d => d.value);
            if (ppValues.length > 0) {
                const minPP = Math.min(...ppValues);
                const maxPP = Math.max(...ppValues);
                const ppRange = maxPP - minPP;
                const tolerance = Math.max(ppRange * 0.1, 5); // 10% tolerance or minimum 5 PP

                var extraYScale = anychart.scales.linear();
                extraYScale.minimum(Math.ceil((minPP - tolerance) / 10) * 10);
                extraYScale.maximum(Math.floor((maxPP + tolerance) / 10) * 10);

                chart.yAxis(1).title('Net PP').labels().format('{%value}');
                chart.yAxis(1).orientation('right');
                chart.yAxis(1).scale(extraYScale);
            } else {
                chart.yAxis(1).title('Net PP').labels().format('{%value}');
                chart.yAxis(1).orientation('right');
            }
            netPPLine.yScale(extraYScale);

            // Enable and customize legend
            chart.legend().enabled(true).position('bottom').itemsLayout('horizontal');

            // Add grid lines
            chart.xGrid().enabled(true);
            chart.yGrid().enabled(true);

            // Allow selection for zooming
            chart.interactivity().selectionMode('marquee');

            // Configure tooltip
            chart.tooltip().format(function () {
                const formattedDate = anychart.format.dateTime(this.x, 'MMM dd, yyyy HH:mm');
                return `${this.seriesName}\nTime: ${formattedDate}\nValue: ${this.value}`;
            });

            // Set chart title
            const { world, continent } = getCurrentWorldInfo();
            const timeRangeTitle = currentNetTimeRange === 'all' ? 'All Time' :
                currentNetTimeRange === 'week' ? 'Last 7 Days' : 'Last 24 Hours';
            chart.title(`Net Trading Trends - ${world} Continent ${continent} (${timeRangeTitle})`);

            // Set container and draw
            chart.container('netTrendChartContainer');
            chart.draw();
        });
    }

    function drawAvgPriceGraph() {
        const container = document.getElementById('avgPriceChartContainer');
        if (!container) return;

        container.innerHTML = '';

        if (!sessionData.transactions || sessionData.transactions.length === 0) {
            container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">No transaction data available</div>';
            return;
        }

        // Filter transactions by time range
        const now = Date.now();
        let filteredTransactions = sessionData.transactions;

        if (currentAvgPriceTimeRange === 'week') {
            const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
            filteredTransactions = sessionData.transactions.filter(t => t.timestamp >= weekAgo);
        } else if (currentAvgPriceTimeRange === '24h') {
            const dayAgo = now - (24 * 60 * 60 * 1000);
            filteredTransactions = sessionData.transactions.filter(t => t.timestamp >= dayAgo);
        }

        if (filteredTransactions.length === 0) {
            container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">No transaction data available for selected time range</div>';
            return;
        }

        anychart.onDocumentReady(() => {
            // Create area chart for ranges with line series for averages
            const chart = anychart.area();

            // Data structures for min/max/average
            const buyData = [];
            const sellData = [];

            // Group transactions by day for daily statistics
            const dayGroups = {};
            filteredTransactions.forEach(transaction => {
                const date = new Date(transaction.timestamp);
                const dayKey = date.toDateString();

                if (!dayGroups[dayKey]) {
                    dayGroups[dayKey] = {
                        buyTransactions: [],
                        sellTransactions: [],
                        timestamp: date.getTime(),
                        date: date
                    };
                }

                if (transaction.cost > 0) {
                    // Buy transaction
                    dayGroups[dayKey].buyTransactions.push(transaction);
                } else {
                    // Sell transaction
                    dayGroups[dayKey].sellTransactions.push(transaction);
                }
            });

            // Calculate min/max/average for each day
            Object.keys(dayGroups).sort((a, b) => dayGroups[a].timestamp - dayGroups[b].timestamp).forEach(dayKey => {
                const group = dayGroups[dayKey];

                // Calculate buy statistics
                if (group.buyTransactions.length > 0) {
                    const buyPrices = group.buyTransactions.map(t => {
                        const resources = Math.abs(t.amount);
                        const pp = Math.abs(t.cost);
                        return resources / pp;
                    });

                    const minBuy = Math.min(...buyPrices);
                    const maxBuy = Math.max(...buyPrices);
                    const avgBuy = buyPrices.reduce((sum, price) => sum + price, 0) / buyPrices.length;

                    buyData.push({ date: group.date, min: minBuy, avg: avgBuy, max: maxBuy, timestamp: group.timestamp });
                }

                // Calculate sell statistics
                if (group.sellTransactions.length > 0) {
                    const sellPrices = group.sellTransactions.map(t => {
                        const resources = Math.abs(t.amount);
                        const pp = Math.abs(t.cost);
                        return resources / pp;
                    });

                    const minSell = Math.min(...sellPrices);
                    const maxSell = Math.max(...sellPrices);
                    const avgSell = sellPrices.reduce((sum, price) => sum + price, 0) / sellPrices.length;

                    sellData.push({ date: group.date, min: minSell, avg: avgSell, max: maxSell, timestamp: group.timestamp });
                }
            });

            // Create range areas (Option 5 style: light areas for min-max ranges)
            if (buyData.length > 0) {
                const buyMaxData = buyData.map(d => [d.timestamp, d.max]);
                const buyMinData = buyData.map(d => [d.timestamp, d.min]);
                const buyAvgData = buyData.map(d => [d.timestamp, d.avg]);

                // Create max area
                const buyMaxArea = chart.area(buyMaxData);
                buyMaxArea.name('Buy Range').fill('#f44336', 0.15).stroke('none');

                // Create min area (white fill to create the "cut-out" effect)
                const buyMinArea = chart.area(buyMinData);
                buyMinArea.name('').fill('#FFFFFF', 1).stroke('none').legendItem().enabled(false);

                // Bold average line
                const buyAvgLine = chart.line(buyAvgData);
                buyAvgLine.name('Buy Average').stroke('#f44336', 4).markers().enabled(true).type('circle').size(6);
            }

            if (sellData.length > 0) {
                const sellMaxData = sellData.map(d => [d.timestamp, d.max]);
                const sellMinData = sellData.map(d => [d.timestamp, d.min]);
                const sellAvgData = sellData.map(d => [d.timestamp, d.avg]);

                // Create max area
                const sellMaxArea = chart.area(sellMaxData);
                sellMaxArea.name('Sell Range').fill('#4CAF50', 0.15).stroke('none');

                // Create min area (white fill to create the "cut-out" effect)
                const sellMinArea = chart.area(sellMinData);
                sellMinArea.name('').fill('#FFFFFF', 1).stroke('none').legendItem().enabled(false);

                // Bold average line
                const sellAvgLine = chart.line(sellAvgData);
                sellAvgLine.name('Sell Average').stroke('#4CAF50', 4).markers().enabled(true).type('circle').size(6);
            }

            // Chart configuration
            chart.xGrid().enabled(true);
            chart.yGrid().enabled(true);
            chart.yAxis().title('Resources per PP');
            chart.xAxis().title('Date').labels().format('{%Value}{dateTimeFormat:MMM dd}');
            chart.legend().enabled(true);

            // Custom tooltip to show all min/avg/max values
            chart.tooltip().displayMode('single');
            chart.tooltip().titleFormat('');
            chart.tooltip().format(function () {
                const date = new Date(this.x);
                const buyDataPoint = buyData.find(d => d.date.toDateString() === date.toDateString());
                const sellDataPoint = sellData.find(d => d.date.toDateString() === date.toDateString());

                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                let result = dateStr;

                if (buyDataPoint) {
                    result += `\nBuy: Min ${Math.round(buyDataPoint.min)}, Avg ${Math.round(buyDataPoint.avg)}, Max ${Math.round(buyDataPoint.max)}`;
                }
                if (sellDataPoint) {
                    result += `\nSell: Min ${Math.round(sellDataPoint.min)}, Avg ${Math.round(sellDataPoint.avg)}, Max ${Math.round(sellDataPoint.max)}`;
                }

                return result;
            });

            // Set chart title
            const { world, continent } = getCurrentWorldInfo();
            const timeRangeTitle = currentAvgPriceTimeRange === 'all' ? 'All Time' :
                currentAvgPriceTimeRange === 'week' ? 'Last 7 Days' : 'Last 24 Hours';
            chart.title(`Average Buy/Sell Prices with Min/Max Ranges - ${world} Continent ${continent} (${timeRangeTitle})`);

            // Set container and draw
            chart.container('avgPriceChartContainer');
            chart.draw();
        });
    }

    // Validation function for min/max pairs
    function validateMinMaxPair(minFieldId, maxFieldId) {
        const minField = document.getElementById(minFieldId);
        const maxField = document.getElementById(maxFieldId);
        const minError = document.getElementById(minFieldId + '-error');
        const maxError = document.getElementById(maxFieldId + '-error');

        const minValue = parseFloat(minField.value) || 0;
        const maxValue = parseFloat(maxField.value) || 0;

        let isValid = true;

        if (minValue > maxValue) {
            // Show errors and highlight fields
            minField.style.borderColor = '#f44336';
            maxField.style.borderColor = '#f44336';
            if (minError) minError.style.display = 'block';
            if (maxError) maxError.style.display = 'block';
            isValid = false;
        } else {
            // Clear errors and reset styling
            minField.style.borderColor = '#ccc';
            maxField.style.borderColor = '#ccc';
            if (minError) minError.style.display = 'none';
            if (maxError) maxError.style.display = 'none';
        }

        return isValid;
    }

    function initializeSettingsPanel() {
        const { world, continent } = getCurrentWorldInfo();

        // Set initial values
        document.getElementById('minResourcePerPP').value = settings.MIN_RESOURCE_PER_PP;
        document.getElementById('maxSellResourcePerPP').value = settings.MAX_SELL_RESOURCE_PER_PP;
        document.getElementById('enableDynamicThresholds').checked = settings.ENABLE_DYNAMIC_THRESHOLDS;

        // Initialize band width sliders
        document.getElementById('autoBuyBandWidth').value = settings.AUTO_BUY_BAND_WIDTH;
        document.getElementById('autoSellBandWidth').value = settings.AUTO_SELL_BAND_WIDTH;
        document.getElementById('autoBuyBandWidthValue').textContent = Math.round(settings.AUTO_BUY_BAND_WIDTH * 100) + '%';
        document.getElementById('autoSellBandWidthValue').textContent = Math.round(settings.AUTO_SELL_BAND_WIDTH * 100) + '%';
        document.getElementById('warehouseTolerance').value = settings.WAREHOUSE_TOLERANCE;
        document.getElementById('minResourceKeep').value = settings.MIN_RESOURCE_KEEP;
        document.getElementById('maxPurchaseAmount').value = settings.MAX_PURCHASE_AMOUNT;
        document.getElementById('minSellAmount').value = settings.MIN_SELL_AMOUNT;
        document.getElementById('maxSellAmount').value = settings.MAX_SELL_AMOUNT;
        document.getElementById('maxConsecutiveSells').value = settings.MAX_CONSECUTIVE_SELLS;
        document.getElementById('maxSessionPPInput').value = settings.MAX_SESSION_PP_SPEND;
        document.getElementById('minDelay').value = settings.MIN_DELAY_BETWEEN_REQUESTS;
        document.getElementById('maxDelay').value = settings.MAX_DELAY_BETWEEN_REQUESTS;
        document.getElementById('minPriceCheckInterval').value = settings.MIN_PRICE_CHECK_INTERVAL;
        document.getElementById('maxPriceCheckInterval').value = settings.MAX_PRICE_CHECK_INTERVAL;
        document.getElementById('minPreTransactionDelay').value = settings.MIN_PRE_TRANSACTION_DELAY;
        document.getElementById('maxPreTransactionDelay').value = settings.MAX_PRE_TRANSACTION_DELAY;
        document.getElementById('enableSelling').checked = settings.ENABLE_SELLING;
        document.getElementById('dryRun').checked = settings.DRY_RUN;
        document.getElementById('minimalMode').checked = settings.MINIMAL_PURCHASE_MODE;
        document.getElementById('sessionRecoveryMinInterval').value = settings.SESSION_RECOVERY_MIN_INTERVAL;
        document.getElementById('sessionRecoveryMaxInterval').value = settings.SESSION_RECOVERY_MAX_INTERVAL;
        document.getElementById('botProtectionRecoveryMinInterval').value = settings.BOT_PROTECTION_RECOVERY_MIN_INTERVAL;
        document.getElementById('botProtectionRecoveryMaxInterval').value = settings.BOT_PROTECTION_RECOVERY_MAX_INTERVAL;

        // Auto-save function for settings
        function saveSettings() {
            setCookie(`bgmMinResourcePerPP_${world}_${continent}`, settings.MIN_RESOURCE_PER_PP);
            setCookie(`bgmMaxSellResourcePerPP_${world}_${continent}`, settings.MAX_SELL_RESOURCE_PER_PP);
            setCookie(`bgmWarehouseTolerance_${world}_${continent}`, settings.WAREHOUSE_TOLERANCE);
            setCookie(`bgmMinResourceKeep_${world}_${continent}`, settings.MIN_RESOURCE_KEEP);
            setCookie(`bgmMaxPurchaseAmount_${world}_${continent}`, settings.MAX_PURCHASE_AMOUNT);
            setCookie(`bgmMinSellAmount_${world}_${continent}`, settings.MIN_SELL_AMOUNT);
            setCookie(`bgmMaxSellAmount_${world}_${continent}`, settings.MAX_SELL_AMOUNT);
            setCookie(`bgmMaxConsecutiveSells_${world}_${continent}`, settings.MAX_CONSECUTIVE_SELLS);
            setCookie(`bgmMaxSessionPP_${world}_${continent}`, settings.MAX_SESSION_PP_SPEND);
            setCookie(`bgmMinDelay_${world}_${continent}`, settings.MIN_DELAY_BETWEEN_REQUESTS);
            setCookie(`bgmMaxDelay_${world}_${continent}`, settings.MAX_DELAY_BETWEEN_REQUESTS);
            setCookie(`bgmMinPriceCheckInterval_${world}_${continent}`, settings.MIN_PRICE_CHECK_INTERVAL);
            setCookie(`bgmMaxPriceCheckInterval_${world}_${continent}`, settings.MAX_PRICE_CHECK_INTERVAL);
            setCookie(`bgmMinPreTransactionDelay_${world}_${continent}`, settings.MIN_PRE_TRANSACTION_DELAY);
            setCookie(`bgmMaxPreTransactionDelay_${world}_${continent}`, settings.MAX_PRE_TRANSACTION_DELAY);
            setCookie(`bgmEnableSelling_${world}_${continent}`, settings.ENABLE_SELLING);
            setCookie(`bgmDryRun_${world}_${continent}`, settings.DRY_RUN);
            setCookie(`bgmMinimalPurchaseMode_${world}_${continent}`, settings.MINIMAL_PURCHASE_MODE);
            setCookie(`bgmSessionRecoveryMinInterval_${world}_${continent}`, settings.SESSION_RECOVERY_MIN_INTERVAL);
            setCookie(`bgmSessionRecoveryMaxInterval_${world}_${continent}`, settings.SESSION_RECOVERY_MAX_INTERVAL);
            setCookie(`bgmBotProtectionRecoveryMinInterval_${world}_${continent}`, settings.BOT_PROTECTION_RECOVERY_MIN_INTERVAL);
            setCookie(`bgmBotProtectionRecoveryMaxInterval_${world}_${continent}`, settings.BOT_PROTECTION_RECOVERY_MAX_INTERVAL);
            setCookie(`bgmEnableDynamicThresholds_${world}_${continent}`, settings.ENABLE_DYNAMIC_THRESHOLDS);
            setCookie(`bgmAutoBuyBandWidth_${world}_${continent}`, settings.AUTO_BUY_BAND_WIDTH);
            setCookie(`bgmAutoSellBandWidth_${world}_${continent}`, settings.AUTO_SELL_BAND_WIDTH);

            // Update UI display
            document.getElementById('maxSessionPP').textContent = settings.MAX_SESSION_PP_SPEND;

            // Update price chart to reflect new thresholds
            updatePriceChart();
        }

        // Add auto-save event listeners
        document.getElementById('minResourcePerPP').oninput = () => {
            settings.MIN_RESOURCE_PER_PP = parseInt(document.getElementById('minResourcePerPP').value) || 80;
            saveSettings();
            updateGraphThresholds();
        };

        document.getElementById('maxSellResourcePerPP').oninput = () => {
            settings.MAX_SELL_RESOURCE_PER_PP = parseInt(document.getElementById('maxSellResourcePerPP').value) || 60;
            saveSettings();
            updateGraphThresholds();
        };

        document.getElementById('enableDynamicThresholds').onchange = () => {
            settings.ENABLE_DYNAMIC_THRESHOLDS = document.getElementById('enableDynamicThresholds').checked;
            saveSettings();
            updateThresholdInputsState();
            updateGraphThresholds();

            // If dynamic mode is turned ON, immediately apply recommended thresholds if available
            if (settings.ENABLE_DYNAMIC_THRESHOLDS) {
                const applied = applyDynamicThresholdsIfEnabled();
                if (!applied) {
                    // If no thresholds were applied (no recommendations available), still update the price chart
                    updatePriceChart();
                }
            } else {
                // If dynamic mode is turned OFF, update the price chart to reflect current manual thresholds
                updatePriceChart();
            }
        };

        document.getElementById('warehouseTolerance').oninput = () => {
            settings.WAREHOUSE_TOLERANCE = parseInt(document.getElementById('warehouseTolerance').value) || 1000;
            saveSettings();
        };

        document.getElementById('minResourceKeep').oninput = () => {
            const value = document.getElementById('minResourceKeep').value;
            settings.MIN_RESOURCE_KEEP = value !== '' ? parseInt(value) : 0;
            saveSettings();
        };

        document.getElementById('maxPurchaseAmount').oninput = () => {
            settings.MAX_PURCHASE_AMOUNT = parseInt(document.getElementById('maxPurchaseAmount').value) || 1000;
            saveSettings();
        };

        document.getElementById('minSellAmount').oninput = () => {
            settings.MIN_SELL_AMOUNT = parseInt(document.getElementById('minSellAmount').value) || 500;
            saveSettings();
        };

        document.getElementById('maxSellAmount').oninput = () => {
            settings.MAX_SELL_AMOUNT = parseInt(document.getElementById('maxSellAmount').value) || 3000;
            saveSettings();
        };

        document.getElementById('maxConsecutiveSells').oninput = () => {
            settings.MAX_CONSECUTIVE_SELLS = parseInt(document.getElementById('maxConsecutiveSells').value) || 5;
            saveSettings();
        };

        document.getElementById('maxSessionPPInput').oninput = () => {
            const value = document.getElementById('maxSessionPPInput').value;
            settings.MAX_SESSION_PP_SPEND = value !== '' ? parseInt(value) : 10000;
            saveSettings();
        };

        document.getElementById('minDelay').oninput = () => {
            const newValue = parseFloat(document.getElementById('minDelay').value) || 0.2;
            if (validateMinMaxPair('minDelay', 'maxDelay')) {
                settings.MIN_DELAY_BETWEEN_REQUESTS = newValue;
                saveSettings();
            }
        };

        document.getElementById('maxDelay').oninput = () => {
            const newValue = parseFloat(document.getElementById('maxDelay').value) || 0.8;
            if (validateMinMaxPair('minDelay', 'maxDelay')) {
                settings.MAX_DELAY_BETWEEN_REQUESTS = newValue;
                saveSettings();
            }
        };

        // Recovery interval handlers
        document.getElementById('sessionRecoveryMinInterval').oninput = () => {
            const newValue = parseInt(document.getElementById('sessionRecoveryMinInterval').value) || 1;
            if (validateMinMaxPair('sessionRecoveryMinInterval', 'sessionRecoveryMaxInterval')) {
                settings.SESSION_RECOVERY_MIN_INTERVAL = newValue;
                saveSettings();
            }
        };

        document.getElementById('sessionRecoveryMaxInterval').oninput = () => {
            const newValue = parseInt(document.getElementById('sessionRecoveryMaxInterval').value) || 10;
            if (validateMinMaxPair('sessionRecoveryMinInterval', 'sessionRecoveryMaxInterval')) {
                settings.SESSION_RECOVERY_MAX_INTERVAL = newValue;
                saveSettings();
            }
        };

        document.getElementById('botProtectionRecoveryMinInterval').oninput = () => {
            const newValue = parseInt(document.getElementById('botProtectionRecoveryMinInterval').value) || 10;
            if (validateMinMaxPair('botProtectionRecoveryMinInterval', 'botProtectionRecoveryMaxInterval')) {
                settings.BOT_PROTECTION_RECOVERY_MIN_INTERVAL = newValue;
                saveSettings();
            }
        };

        document.getElementById('botProtectionRecoveryMaxInterval').oninput = () => {
            const newValue = parseInt(document.getElementById('botProtectionRecoveryMaxInterval').value) || 60;
            if (validateMinMaxPair('botProtectionRecoveryMinInterval', 'botProtectionRecoveryMaxInterval')) {
                settings.BOT_PROTECTION_RECOVERY_MAX_INTERVAL = newValue;
                saveSettings();
            }
        };

        document.getElementById('enableSelling').onchange = () => {
            settings.ENABLE_SELLING = document.getElementById('enableSelling').checked;
            saveSettings();
        };

        document.getElementById('dryRun').onchange = () => {
            settings.DRY_RUN = document.getElementById('dryRun').checked;
            saveSettings();
        };

        document.getElementById('minimalMode').onchange = () => {
            settings.MINIMAL_PURCHASE_MODE = document.getElementById('minimalMode').checked;
            saveSettings();
        };

        document.getElementById('minPriceCheckInterval').oninput = () => {
            const newValue = parseFloat(document.getElementById('minPriceCheckInterval').value) || 1.0;
            if (validateMinMaxPair('minPriceCheckInterval', 'maxPriceCheckInterval')) {
                settings.MIN_PRICE_CHECK_INTERVAL = newValue;
                saveSettings();
                updateWorkerInterval();
            }
        };

        document.getElementById('maxPriceCheckInterval').oninput = () => {
            const newValue = parseFloat(document.getElementById('maxPriceCheckInterval').value) || 2.5;
            if (validateMinMaxPair('minPriceCheckInterval', 'maxPriceCheckInterval')) {
                settings.MAX_PRICE_CHECK_INTERVAL = newValue;
                saveSettings();
                updateWorkerInterval();
            }
        };

        document.getElementById('minPreTransactionDelay').oninput = () => {
            const newValue = parseFloat(document.getElementById('minPreTransactionDelay').value) || 0.5;
            if (validateMinMaxPair('minPreTransactionDelay', 'maxPreTransactionDelay')) {
                settings.MIN_PRE_TRANSACTION_DELAY = newValue;
                saveSettings();
            }
        };

        document.getElementById('maxPreTransactionDelay').oninput = () => {
            const newValue = parseFloat(document.getElementById('maxPreTransactionDelay').value) || 1.5;
            if (validateMinMaxPair('minPreTransactionDelay', 'maxPreTransactionDelay')) {
                settings.MAX_PRE_TRANSACTION_DELAY = newValue;
                saveSettings();
            }
        };

        document.getElementById('resetSession').onclick = () => {
            sessionData = {
                transactions: [],
                totalSpent: 0,
                totalEarned: 0,
                totalWood: 0,
                totalStone: 0,
                totalIron: 0,
                soldWood: 0,
                soldStone: 0,
                soldIron: 0,
                sessionStart: Date.now()
            };
            setLocalStorage(getVillageStorageKey('backgroundMonitorSession'), sessionData);
            updateStatsDisplay();
            document.getElementById('sessionStart').textContent = new Date().toLocaleTimeString();
        };

        // Settings import/export functionality
        document.getElementById('exportSettings').onclick = exportSettings;
        document.getElementById('importSettings').onclick = importSettings;

        // Make textarea editable when user clicks import
        document.getElementById('importSettings').onclick = () => {
            const textarea = document.getElementById('settingsTextArea');
            textarea.readOnly = false;
            textarea.placeholder = 'Paste your settings JSON here, then click Import Settings again to apply...';
            textarea.focus();

            // Change button text and function for import
            const importBtn = document.getElementById('importSettings');
            importBtn.textContent = '✅ Apply Import';
            importBtn.onclick = applyImportSettings;
        };
    }

    function exportSettings() {
        const settingsToExport = {
            ...settings,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const jsonString = JSON.stringify(settingsToExport, null, 2);
        const textarea = document.getElementById('settingsTextArea');
        textarea.value = jsonString;
        textarea.readOnly = true;
        textarea.select();

        // Try to copy to clipboard
        try {
            document.execCommand('copy');
            alert('Settings exported and copied to clipboard!');
        } catch (err) {
            alert('Settings exported! You can manually copy the text from the box.');
        }
    }

    function applyImportSettings() {
        const { world, continent } = getCurrentWorldInfo();
        const textarea = document.getElementById('settingsTextArea');
        const jsonText = textarea.value.trim();

        if (!jsonText) {
            alert('Please paste settings JSON first.');
            return;
        }

        try {
            const importedSettings = JSON.parse(jsonText);

            // Validate imported settings have required fields
            const requiredFields = [
                'MIN_RESOURCE_PER_PP', 'MIN_DELAY_BETWEEN_REQUESTS', 'MAX_DELAY_BETWEEN_REQUESTS',
                'MIN_PRICE_CHECK_INTERVAL', 'MAX_PRICE_CHECK_INTERVAL', 'MIN_PRE_TRANSACTION_DELAY',
                'MAX_PRE_TRANSACTION_DELAY', 'DRY_RUN', 'MINIMAL_PURCHASE_MODE', 'WAREHOUSE_TOLERANCE',
                'MAX_SESSION_PP_SPEND', 'ENABLE_SELLING', 'MAX_SELL_RESOURCE_PER_PP', 'MIN_RESOURCE_KEEP',
                'MAX_PURCHASE_AMOUNT', 'MIN_SELL_AMOUNT', 'MAX_SELL_AMOUNT', 'MAX_CONSECUTIVE_SELLS', 'SESSION_RECOVERY_MIN_INTERVAL',
                'SESSION_RECOVERY_MAX_INTERVAL', 'BOT_PROTECTION_RECOVERY_MIN_INTERVAL',
                'BOT_PROTECTION_RECOVERY_MAX_INTERVAL', 'ENABLE_DYNAMIC_THRESHOLDS', 'AUTO_BUY_BAND_WIDTH',
                'AUTO_SELL_BAND_WIDTH'
            ];

            for (const field of requiredFields) {
                if (!(field in importedSettings)) {
                    throw new Error(`Missing required field: ${field}`);
                }
            }

            // Apply settings
            Object.assign(settings, importedSettings);

            // Update all cookie values
            setCookie(`bgmMinResourcePerPP_${world}_${continent}`, settings.MIN_RESOURCE_PER_PP);
            setCookie(`bgmMaxSellResourcePerPP_${world}_${continent}`, settings.MAX_SELL_RESOURCE_PER_PP);
            setCookie(`bgmWarehouseTolerance_${world}_${continent}`, settings.WAREHOUSE_TOLERANCE);
            setCookie(`bgmMinResourceKeep_${world}_${continent}`, settings.MIN_RESOURCE_KEEP);
            setCookie(`bgmMaxPurchaseAmount_${world}_${continent}`, settings.MAX_PURCHASE_AMOUNT);
            setCookie(`bgmMinSellAmount_${world}_${continent}`, settings.MIN_SELL_AMOUNT);
            setCookie(`bgmMaxSellAmount_${world}_${continent}`, settings.MAX_SELL_AMOUNT);
            setCookie(`bgmMaxConsecutiveSells_${world}_${continent}`, settings.MAX_CONSECUTIVE_SELLS);
            setCookie(`bgmMaxSessionPP_${world}_${continent}`, settings.MAX_SESSION_PP_SPEND);
            setCookie(`bgmMinDelay_${world}_${continent}`, settings.MIN_DELAY_BETWEEN_REQUESTS);
            setCookie(`bgmMaxDelay_${world}_${continent}`, settings.MAX_DELAY_BETWEEN_REQUESTS);
            setCookie(`bgmMinPriceCheckInterval_${world}_${continent}`, settings.MIN_PRICE_CHECK_INTERVAL);
            setCookie(`bgmMaxPriceCheckInterval_${world}_${continent}`, settings.MAX_PRICE_CHECK_INTERVAL);
            setCookie(`bgmMinPreTransactionDelay_${world}_${continent}`, settings.MIN_PRE_TRANSACTION_DELAY);
            setCookie(`bgmMaxPreTransactionDelay_${world}_${continent}`, settings.MAX_PRE_TRANSACTION_DELAY);
            setCookie(`bgmEnableSelling_${world}_${continent}`, settings.ENABLE_SELLING);
            setCookie(`bgmDryRun_${world}_${continent}`, settings.DRY_RUN);
            setCookie(`bgmMinimalPurchaseMode_${world}_${continent}`, settings.MINIMAL_PURCHASE_MODE);
            setCookie(`bgmSessionRecoveryMinInterval_${world}_${continent}`, settings.SESSION_RECOVERY_MIN_INTERVAL);
            setCookie(`bgmSessionRecoveryMaxInterval_${world}_${continent}`, settings.SESSION_RECOVERY_MAX_INTERVAL);
            setCookie(`bgmBotProtectionRecoveryMinInterval_${world}_${continent}`, settings.BOT_PROTECTION_RECOVERY_MIN_INTERVAL);
            setCookie(`bgmBotProtectionRecoveryMaxInterval_${world}_${continent}`, settings.BOT_PROTECTION_RECOVERY_MAX_INTERVAL);
            setCookie(`bgmEnableDynamicThresholds_${world}_${continent}`, settings.ENABLE_DYNAMIC_THRESHOLDS);
            setCookie(`bgmAutoBuyBandWidth_${world}_${continent}`, settings.AUTO_BUY_BAND_WIDTH);
            setCookie(`bgmAutoSellBandWidth_${world}_${continent}`, settings.AUTO_SELL_BAND_WIDTH);

            // Refresh UI with new values
            initializeSettingsPanel();
            updateWorkerInterval();

            // Reset textarea
            textarea.value = '';
            textarea.readOnly = true;
            textarea.placeholder = 'Settings JSON will appear here for export, or paste settings JSON here for import...';

            // Reset button
            const importBtn = document.getElementById('importSettings');
            importBtn.textContent = '📥 Import Settings';
            importBtn.onclick = () => {
                const textarea = document.getElementById('settingsTextArea');
                textarea.readOnly = false;
                textarea.placeholder = 'Paste your settings JSON here, then click Import Settings again to apply...';
                textarea.focus();

                // Change button text and function for import
                const importBtn = document.getElementById('importSettings');
                importBtn.textContent = '✅ Apply Import';
                importBtn.onclick = applyImportSettings;
            };

            alert('Settings imported successfully!');

        } catch (error) {
            alert(`Error importing settings: ${error.message}`);
        }
    }

    // Merchant tracking function
    // DEPRECATED: fetchMerchantsHome function
    // Merchant count is now obtained directly from price query response (market_merchant_available_count)
    // This function is no longer used but kept for reference
    /*
    async function fetchMerchantsHome() {
        const url = `${window.location.origin}${window.location.pathname}?village=${game_data.village.id}&screen=overview_villages&mode=prod`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9/*;q=0.8',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include'
            });

            const html = await response.text();

            // Parse the HTML to find merchants home for current village
            const currentCoord = `${game_data.village.x}|${game_data.village.y}`;

            // Create a temporary DOM element to parse HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            // Look for the table row containing our village coordinates
            const rows = tempDiv.querySelectorAll('#production_table tbody tr');

            for (const row of rows) {
                const villageNameCell = row.querySelector('td:nth-child(2)');
                if (villageNameCell && villageNameCell.textContent.includes(currentCoord)) {
                    const merchantCell = row.querySelector('td:nth-child(6)'); // Merchants column
                    if (merchantCell) {
                        const merchantText = merchantCell.textContent.trim();
                        const match = merchantText.match(/(\d+)\/\d+/);
                        if (match) {
                            merchantsHome = parseInt(match[1]);
                            updateStatsDisplay();
                            return merchantsHome;
                        }
                    }
                    break;
                }
            }

            console.warn('Could not find merchant info for current village');
            return 0;
        } catch (error) {
            console.error('Error fetching merchant info:', error);
            return 0;
        }
    }
    */

    // Function to update worker intervals
    function updateWorkerInterval() {
        if (worker) {
            worker.postMessage({
                type: 'updateIntervals',
                minInterval: settings.MIN_PRICE_CHECK_INTERVAL * 1000, // Convert seconds to milliseconds
                maxInterval: settings.MAX_PRICE_CHECK_INTERVAL * 1000
            });
        }
    }

    // Worker variable - will be created when monitor starts
    let worker = null;

    // Rate limiting check
    function checkRateLimit() {
        if (rateLimitTime > 0) {
            const timeSinceRateLimit = Date.now() - rateLimitTime;
            if (timeSinceRateLimit < 10000) { // 10 seconds
                const remainingTime = Math.ceil((10000 - timeSinceRateLimit) / 1000);
                return { isLimited: true, remainingTime };
            } else {
                // Rate limit period has passed
                rateLimitTime = 0;
            }
        }
        return { isLimited: false, remainingTime: 0 };
    }

    // Function to handle rate limit errors
    function handleRateLimitError(errorMessage) {
        if (errorMessage && errorMessage.toLowerCase().includes('premium exchange too heavily')) {
            rateLimitTime = Date.now();
            console.log('[BGM] Rate limit detected - setting 10 second delay');
            updateStatus('Rate limited - waiting 10 seconds...', '#FF9800');
            updateCurrentTask('Rate limited (10s delay)');
            return true;
        }
        return false;
    }

    // Price checking and buying logic
    async function fetchPrices() {
        const url = `${window.location.origin}${window.location.pathname}?village=${game_data.village.id}&screen=market&ajax=exchange_data`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'X-Requested-With': 'XMLHttpRequest',
                    'TribalWars-Ajax': '1'
                },
                credentials: 'include'
            });

            const data = await response.json();

            // Check for session expiration (multilingual support)
            if (data.error && (data.error.includes('session has expired') || data.error.includes('Twoja sesja wygas'))) {
                console.log('[BGM] Session expired detected, starting recovery mode');
                sessionExpired = true;
                startRecovery('sessionExpired');
                return null;
            }

            // Check for rate limiting
            if (data.error && handleRateLimitError(data.error)) {
                worker.postMessage({ type: 'rateLimited' });
                return null;
            }

            // Check for bot protection
            if (data.bot_protect) {
                console.log('[BGM] Bot protection detected, starting recovery mode');
                botProtectionActive = true;
                startRecovery('botProtection');
                return null;
            }

            // Update merchant count from price query response
            if (data.response && data.response.merchants !== undefined) {
                merchantsHome = data.response.merchants;
                // Note: updateStatsDisplay() will be called later when this data is processed
            }

            return data;
        } catch (error) {
            console.error('Error fetching prices:', error);
            return null;
        }
    }

    function getNextResourceForMinimalMode() {
        const resources = ['wood', 'stone', 'iron'];
        const lastResource = getCookie('bgmLastMinimalResource') || 'iron';
        const lastIndex = resources.indexOf(lastResource);
        const nextIndex = (lastIndex + 1) % resources.length;
        return resources[nextIndex];
    }

    function setLastMinimalResource(resource) {
        setCookie('bgmLastMinimalResource', resource);
    }

    async function startRecovery(type) {
        if (recoveryActive) {
            console.log(`[BGM] Recovery already active, skipping ${type}`);
            return;
        }

        recoveryActive = true;
        const isSessionExpired = type === 'sessionExpired';
        const statusMessage = isSessionExpired ?
            'Session expired - attempting recovery...' :
            'Bot protection detected - attempting recovery...';
        const taskMessage = isSessionExpired ? 'Session recovery mode' : 'Bot protection recovery mode';

        updateStatus(statusMessage, '#FF9800');
        updateCurrentTask(taskMessage);

        console.log(`[BGM] Starting ${type} recovery loop`);

        async function attemptRecovery() {
            // Check if recovery is complete
            const recoveryComplete = !sessionExpired && !botProtectionActive;
            if (recoveryComplete) {
                const recoveryType = isSessionExpired ? 'Session' : 'Bot protection';
                console.log(`[BGM] ${recoveryType} recovered, exiting recovery mode`);
                recoveryActive = false;
                updateStatus(`${recoveryType} recovered - resuming normal operation`, '#4CAF50');
                updateCurrentTask(`${recoveryType} recovered`);

                // Resume normal operation after a short delay
                setTimeout(() => {
                    worker.postMessage({ type: 'scheduleNext' });
                }, 2000);
                return;
            }

            // Random delay based on recovery type
            const minInterval = isSessionExpired ?
                settings.SESSION_RECOVERY_MIN_INTERVAL :
                settings.BOT_PROTECTION_RECOVERY_MIN_INTERVAL;
            const maxInterval = isSessionExpired ?
                settings.SESSION_RECOVERY_MAX_INTERVAL :
                settings.BOT_PROTECTION_RECOVERY_MAX_INTERVAL;

            const minMs = minInterval * 60000;
            const maxMs = maxInterval * 60000;
            const recoveryDelay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
            const recoveryMinutes = Math.round(recoveryDelay / 60000);

            const recoveryTypeName = isSessionExpired ? 'Session' : 'Bot protection';
            console.log(`[BGM] ${recoveryTypeName} recovery: waiting ${recoveryMinutes} minutes before next check`);

            // Start countdown timer that updates tab title every second
            let remainingTime = recoveryDelay;
            recoveryCountdownInterval = setInterval(() => {
                remainingTime -= 1000;
                if (remainingTime <= 0) {
                    clearInterval(recoveryCountdownInterval);
                    recoveryCountdownInterval = null;
                    return;
                }

                const minutes = Math.floor(remainingTime / 60000);
                const seconds = Math.floor((remainingTime % 60000) / 1000);
                const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                updateCurrentTask(`${recoveryTypeName} recovery - retry in ${timeString}`);
            }, 1000);

            updateCurrentTask(`${recoveryTypeName} recovery - retry in ${recoveryMinutes}:00`);

            recoveryTimeout = setTimeout(async () => {
                if (recoveryCountdownInterval) {
                    clearInterval(recoveryCountdownInterval);
                    recoveryCountdownInterval = null;
                }
                console.log(`[BGM] Attempting to check if ${recoveryTypeName.toLowerCase()} is recovered...`);
                updateCurrentTask(`Checking ${recoveryTypeName.toLowerCase()} status...`);

                try {
                    // Make a simple price request to test recovery
                    const testData = await fetchPrices();

                    if (testData) {
                        console.log(`[BGM] ${recoveryTypeName} recovery successful!`);
                        sessionExpired = false;
                        botProtectionActive = false;
                        recoveryActive = false;
                        recoveryTimeout = null;
                        updateStatus(`${recoveryTypeName} recovered - resuming operation`, '#4CAF50');
                        updateCurrentTask(`${recoveryTypeName} recovered`);

                        // Resume normal operation
                        setTimeout(() => {
                            worker.postMessage({ type: 'scheduleNext' });
                        }, 2000);
                    } else {
                        console.log(`[BGM] ${recoveryTypeName} still active, continuing recovery attempts`);
                        updateCurrentTask(`${recoveryTypeName} still active`);
                        attemptRecovery(); // Continue recovery loop
                    }
                } catch (error) {
                    console.log(`[BGM] Error during ${recoveryTypeName.toLowerCase()} recovery test:`, error);
                    updateCurrentTask(`${recoveryTypeName} recovery error`);
                    attemptRecovery(); // Continue recovery loop
                }
            }, recoveryDelay);
        }

        // Start the recovery loop
        attemptRecovery();
    }

    async function checkPricesAndBuy() {
        console.log(`[BGM] checkPricesAndBuy() called at ${new Date().toISOString()}`);

        // Skip if session is expired or bot protection is active
        if (sessionExpired || botProtectionActive) {
            const reason = sessionExpired ? 'Session expired' : 'Bot protection active';
            console.log(`[BGM] ${reason}, skipping price check`);
            return;
        }

        // Prevent concurrent price checks
        if (priceCheckInProgress) {
            console.log('[BGM] Price check already in progress, skipping');
            return;
        }

        priceCheckInProgress = true;
        console.log('[BGM] Price check started');

        let transactionOccurred = false;
        let transactionStartTime = 0;

        try {
            updateStatus('Checking prices...', '#2196F3');

            // Check if we're rate limited before making any requests
            const rateLimitCheck = checkRateLimit();
            if (rateLimitCheck.isLimited) {
                updateStatus(`Rate limited - waiting ${rateLimitCheck.remainingTime}s more...`, '#FF9800');
                updateCurrentTask(`Rate limited (${rateLimitCheck.remainingTime}s remaining)`);
                console.log(`[BGM] Skipping price check - rate limited for ${rateLimitCheck.remainingTime}s more`);
                return;
            }

            let allData = await fetchPrices();
            const priceData = allData.response;
            if (!priceData) {
                return; // Error already handled by worker
            }

            // Update current prices for display with change tracking
            updatePricesWithChangeTracking(priceData.rates);

            // Log price history if enough time has passed
            logPriceHistory(priceData);

            updateStatsDisplay();

            // Check if a transaction is already in progress
            if (transactionInProgress) {
                updateStatus('Transaction already in progress (prices updated)', '#FF9800');
                updateCurrentTask('Transaction in progress');
                console.log(`[BGM] Prices updated, but skipping transactions - transaction already in progress`);
                return;
            }

            // Check transaction cooldown AFTER price check but BEFORE attempting transactions
            const timeSinceLastTransaction = Date.now() - lastTransactionTime;
            if (lastTransactionTime > 0 && timeSinceLastTransaction < 5000) {
                const remainingCooldown = Math.ceil((5000 - timeSinceLastTransaction) / 1000);
                updateStatus(`Transaction cooldown: ${remainingCooldown}s remaining (prices updated)`, '#FF9800');
                updateCurrentTask(`Transaction cooldown (${remainingCooldown}s)`);
                console.log(`[BGM] Prices updated, but skipping transactions - cooldown active: ${remainingCooldown}s remaining`);
                return;
            }

            // Check for selling opportunities first (if enabled)
            console.log(`[BGM] [SELL DEBUG] Main check: ENABLE_SELLING = ${settings.ENABLE_SELLING}`);
            if (settings.ENABLE_SELLING) {
                updateCurrentTask('Checking sell opportunities...');
                const sellOpportunity = await checkSellingOpportunity(priceData, allData.game_data);
                if (sellOpportunity) {
                    console.log(`[BGM] [SELL DEBUG] Found sell opportunity, proceeding with sale...`);
                    
                    // Check consecutive failed sell limit
                    if (sessionData.consecutiveFailedSells >= settings.MAX_CONSECUTIVE_SELLS) {
                        console.log(`[BGM] [SELL DEBUG] Max consecutive failed sells limit reached (${settings.MAX_CONSECUTIVE_SELLS}), stopping monitoring`);
                        updateStatus(`Max consecutive failed sells limit reached (${settings.MAX_CONSECUTIVE_SELLS}) - stopping monitoring`, '#f44336');
                        updateCurrentTask('Consecutive failed sell limit reached - monitoring stopped');
                        stopMonitor();
                        return;
                    }
                    
                    if (settings.DRY_RUN) {
                        updateStatus(`DRY RUN: Would sell ${sellOpportunity.amount} ${sellOpportunity.resource}`, '#9E9E9E');
                        updateCurrentTask('DRY RUN: Sell opportunity found');
                    } else {
                        updateCurrentTask(`Executing sell: ${sellOpportunity.amount} ${sellOpportunity.resource} (failed: ${sessionData.consecutiveFailedSells}/${settings.MAX_CONSECUTIVE_SELLS})`);
                        transactionOccurred = true;
                        transactionStartTime = Date.now();
                        await executeSell(sellOpportunity.resource, sellOpportunity.amount, allData.game_data.csrf);
                    }
                    worker.postMessage({ type: 'scheduleNext' });
                    return;
                }
            }

            // Check session PP limit for buying only
            if (sessionData.totalSpent >= settings.MAX_SESSION_PP_SPEND) {
                updateStatus(`Session PP limit reached (${settings.MAX_SESSION_PP_SPEND}) - checking sell opportunities only`, '#f44336');
                updateCurrentTask('Session limit reached - sell only mode');
                return;
            }

            // If no selling opportunity, check for buying
            updateCurrentTask('Checking buy opportunities...');
            let targetResource = null;
            let targetRate = 0;

            // Convert min resources per PP to max PP per resource for comparison
            const maxPriceThreshold = 1 / settings.MIN_RESOURCE_PER_PP;

            if (settings.MINIMAL_PURCHASE_MODE) {
                targetResource = getNextResourceForMinimalMode();
                targetRate = priceData.rates[targetResource];
                const resourcesPerPP = 1 / targetRate;
                updateStatus(`Minimal mode: checking ${targetResource} (${resourcesPerPP.toFixed(1)} res/PP)`, '#9C27B0');

                // Check if rate meets threshold in minimal mode
                if (targetRate > maxPriceThreshold) {
                    updateStatus(`${targetResource}: ${resourcesPerPP.toFixed(1)} < ${settings.MIN_RESOURCE_PER_PP} res/PP`, '#f44336');
                    updateCurrentTask('Price threshold not met');
                    worker.postMessage({ type: 'scheduleNext' });
                    return;
                }
            } else {
                // Find resource with highest rate (best value - more resources per PP) below threshold
                let bestResourcesPerPP = 0;
                Object.entries(priceData.rates).forEach(([resource, rate]) => {
                    if (rate <= maxPriceThreshold) {
                        const resourcesPerPP = 1 / rate;
                        if (resourcesPerPP > bestResourcesPerPP) {
                            targetResource = resource;
                            targetRate = rate;
                            bestResourcesPerPP = resourcesPerPP;
                        }
                    }
                });

                if (!targetResource) {
                    updateStatus(`No good prices (min: ${settings.MIN_RESOURCE_PER_PP} res/PP)`, '#f44336');
                    updateCurrentTask('No profitable opportunities found');
                    worker.postMessage({ type: 'scheduleNext' });
                    return;
                }
            }

            const resourcesPerPP = 1 / targetRate;

            // Get current PP balance and check if we have any PP available
            const currentPP = game_data.player.pp;
            console.log(`[BGM] [BUY DEBUG] Current PP balance: ${currentPP}`);

            if (currentPP <= 0) {
                console.log(`[BGM] [BUY DEBUG] No PP available for purchases (${currentPP})`);
                updateStatus('No PP available for purchases', '#f44336');
                updateCurrentTask('Waiting for PP...');
                worker.postMessage({ type: 'scheduleNext' });
                return;
            }

            updateStatus(`Good price found: ${targetResource} @ ${resourcesPerPP.toFixed(1)} res/PP`, '#f44336');

            // Calculate purchase amount
            let purchaseAmount;
            if (settings.MINIMAL_PURCHASE_MODE) {
                purchaseAmount = 1;
            } else {
                const stock = priceData.stock[targetResource];
                const capacity = priceData.capacity[targetResource];
                const currentResources = allData.game_data.village[targetResource];

                // Calculate max possible purchase
                const warehouseSpace = capacity - currentResources - settings.WAREHOUSE_TOLERANCE;
                const resourceCost = Math.ceil(targetRate * 1000); // Rough PP cost estimate
                const maxByWarehouse = Math.floor(warehouseSpace / (2 * resourceCost));

                // Apply max purchase amount setting
                purchaseAmount = Math.min(stock, maxByWarehouse, settings.MAX_PURCHASE_AMOUNT);

                if (purchaseAmount <= 0) {
                    updateStatus(`Not enough warehouse space for ${targetResource}`, '#FF5722');
                    updateCurrentTask('Warehouse full');
                    worker.postMessage({ type: 'scheduleNext' });
                    return;
                }
            }

            // Check if we have enough PP for this purchase
            const estimatedPPCost = Math.ceil(purchaseAmount * targetRate);
            console.log(`[BGM] [BUY DEBUG] Purchase check: ${purchaseAmount} ${targetResource}, estimated cost: ${estimatedPPCost} PP, available: ${currentPP} PP`);

            if (estimatedPPCost > currentPP) {
                console.log(`[BGM] [BUY DEBUG] Purchase would cost ${estimatedPPCost} PP but only have ${currentPP} PP - reducing purchase amount`);

                // Reduce purchase amount to what we can afford
                const affordablePurchaseAmount = Math.floor(currentPP / targetRate);

                if (affordablePurchaseAmount <= 0) {
                    console.log(`[BGM] [BUY DEBUG] Cannot afford any amount of ${targetResource} (need ${Math.ceil(targetRate)} PP minimum)`);
                    updateStatus(`Cannot afford ${targetResource} (need ${Math.ceil(targetRate)} PP)`, '#f44336');
                    updateCurrentTask('Insufficient PP for purchase');
                    worker.postMessage({ type: 'scheduleNext' });
                    return;
                }

                console.log(`[BGM] [BUY DEBUG] Reducing purchase from ${purchaseAmount} to ${affordablePurchaseAmount} to fit PP budget`);
                purchaseAmount = affordablePurchaseAmount;

                const finalEstimatedCost = Math.ceil(purchaseAmount * targetRate);
                updateStatus(`PP-limited purchase: ${purchaseAmount} ${targetResource} @ ${resourcesPerPP.toFixed(1)} res/PP (${finalEstimatedCost} PP)`, '#f44336');
            } else {
                console.log(`[BGM] [BUY DEBUG] Purchase is affordable: ${estimatedPPCost} PP <= ${currentPP} PP`);
            }

            if (settings.DRY_RUN) {
                updateStatus(`DRY RUN: Would buy ${purchaseAmount} ${targetResource}`, '#9E9E9E');
                updateCurrentTask('DRY RUN: Buy opportunity found');
                if (settings.MINIMAL_PURCHASE_MODE) {
                    setLastMinimalResource(targetResource);
                }
            } else {
                updateCurrentTask(`Executing buy: ${purchaseAmount} ${targetResource}`);
                transactionOccurred = true;
                transactionStartTime = Date.now();
                await executePurchase(targetResource, purchaseAmount, allData.game_data.csrf);
            }

        } finally {
            priceCheckInProgress = false;
            console.log('[BGM] Price check completed, flag cleared');

            // Calculate transaction delay if a transaction occurred
            let minDelayMs = null;
            if (transactionOccurred && transactionStartTime > 0) {
                const transactionDuration = Date.now() - transactionStartTime;

                // Convert settings from seconds to milliseconds and calculate total delay
                const preTransactionMin = settings.MIN_PRE_TRANSACTION_DELAY * 1000;
                const preTransactionMax = settings.MAX_PRE_TRANSACTION_DELAY * 1000;
                const betweenRequestsMin = settings.MIN_DELAY_BETWEEN_REQUESTS * 1000;
                const betweenRequestsMax = settings.MAX_DELAY_BETWEEN_REQUESTS * 1000;

                // Estimate average transaction delay times
                const avgPreTransactionDelay = (preTransactionMin + preTransactionMax) / 2;
                const avgBetweenRequestsDelay = (betweenRequestsMin + betweenRequestsMax) / 2;
                const estimatedTotalTransactionDelay = avgPreTransactionDelay + avgBetweenRequestsDelay;

                minDelayMs = Math.max(estimatedTotalTransactionDelay, transactionDuration);
                console.log(`[BGM] Transaction completed in ${transactionDuration}ms, using min delay of ${minDelayMs}ms for next check`);
            }

            worker.postMessage({
                type: 'scheduleNext',
                minDelayMs: minDelayMs
            });
        }
    }

    async function checkSellingOpportunity(priceData, game_data_updated) {
        console.log(`[BGM] [SELL DEBUG] checkSellingOpportunity called with merchants: ${merchantsHome}, ENABLE_SELLING: ${settings.ENABLE_SELLING}`);

        // Merchant count is updated automatically via price queries
        if (merchantsHome <= 0) {
            console.log(`[BGM] [SELL DEBUG] No merchants available: ${merchantsHome}`);
            return null; // No merchants available
        }

        // Convert max resources per PP to min PP per resource for comparison  
        const minSellThreshold = 1 / settings.MAX_SELL_RESOURCE_PER_PP;
        console.log(`[BGM] [SELL DEBUG] Sell threshold: ${minSellThreshold.toFixed(6)} PP per resource (${settings.MAX_SELL_RESOURCE_PER_PP} res/PP max)`);

        let bestSellResource = null;
        let bestSellRate = 0;
        let bestSellAmount = 0;

        // Check each resource for selling opportunity - prioritize lowest res/PP (highest price)
        const resources = ['wood', 'stone', 'iron'];
        const sellableResources = [];

        for (const resource of resources) {
            const currentAmount = game_data_updated.village[resource];
            const sellableAmount = currentAmount - settings.MIN_RESOURCE_KEEP;
            const rate = priceData.rates[resource];
            const resourcesPerPP = 1 / rate;

            console.log(`[BGM] [SELL DEBUG] ${resource}: current=${currentAmount}, keep=${settings.MIN_RESOURCE_KEEP}, sellable=${sellableAmount}, rate=${rate.toFixed(6)}, ${resourcesPerPP.toFixed(1)} res/PP`);

            if (sellableAmount <= 0) {
                console.log(`[BGM] [SELL DEBUG] ${resource}: Not enough to sell (sellable=${sellableAmount})`);
                continue; // Not enough to sell
            }

            // Check if rate is above sell threshold (fewer resources per PP = higher price)
            if (rate >= minSellThreshold) {
                console.log(`[BGM] [SELL DEBUG] ${resource}: GOOD FOR SELLING (rate ${rate.toFixed(6)} >= threshold ${minSellThreshold.toFixed(6)})`);
                sellableResources.push({
                    resource: resource,
                    rate: rate,
                    resourcesPerPP: resourcesPerPP,
                    sellableAmount: sellableAmount
                });
            } else {
                console.log(`[BGM] [SELL DEBUG] ${resource}: Not good for selling (rate ${rate.toFixed(6)} < threshold ${minSellThreshold.toFixed(6)})`);
            }
        }

        if (sellableResources.length > 0) {
            console.log(`[BGM] [SELL DEBUG] Found ${sellableResources.length} sellable resources`);
            // Sort by lowest res/PP (highest price) - ascending order
            sellableResources.sort((a, b) => a.resourcesPerPP - b.resourcesPerPP);

            const best = sellableResources[0];
            console.log(`[BGM] [SELL DEBUG] Best sell opportunity: ${best.resource} at ${best.resourcesPerPP.toFixed(1)} res/PP`);

            // Calculate optimal sell amount to maximize merchant efficiency
            const resPricePerPP = best.resourcesPerPP;

            // Step 1: Apply basic limits first
            let baseAmount = Math.min(best.sellableAmount, settings.MAX_SELL_AMOUNT);

            // Step 2: Apply transport capacity limit
            const maxTransport = Math.floor(merchantsHome * 1000);
            baseAmount = Math.min(baseAmount, maxTransport);

            // Step 3: Merchant overspill prevention
            // When selling exactly X000 resources, PP rounding might cause overspill to X+1 merchants
            const fullMerchants = Math.floor(baseAmount / 1000);
            const lastMerchantLoad = (baseAmount - 1) % 1000 + 1;

            // Assume that the average sale price won't be worse than 50% higher than the starting res per pp
            // Reduce by this amount to prevent overspill into using an extra merchant
            sellAmount = baseAmount - resPricePerPP * 1.5;

            // Ensure is a whole number
            sellAmount = Math.floor(sellAmount);

            console.log(`[BGM] [SELL DEBUG] Sell calculation: baseAfterLimits=${baseAmount}, fullMerchants=${fullMerchants}, lastMerchantLoad=${lastMerchantLoad}, final=${sellAmount}`);

            // Check if sellAmount meets minimum requirement and is positive
            if (sellAmount >= settings.MIN_SELL_AMOUNT && sellAmount > 0) {
                console.log(`[BGM] [SELL DEBUG] Final sellAmount ${sellAmount} >= ${settings.MIN_SELL_AMOUNT}, setting as best sell opportunity`);
                bestSellResource = best.resource;
                bestSellRate = best.rate;
                bestSellAmount = sellAmount;
            } else {
                const reason = sellAmount < settings.MIN_SELL_AMOUNT ? 
                    `below minimum ${settings.MIN_SELL_AMOUNT}` : 
                    `<= 0`;
                console.log(`[BGM] [SELL DEBUG] Final sellAmount ${sellAmount} ${reason} for ${best.resource}, trying next best resource...`);

                // Try the next best resource if the current one doesn't meet requirements
                for (let i = 1; i < sellableResources.length; i++) {
                    const nextBest = sellableResources[i];
                    console.log(`[BGM] [SELL DEBUG] Trying next best: ${nextBest.resource} at ${nextBest.resourcesPerPP.toFixed(1)} res/PP`);

                    // Recalculate for this resource
                    let nextBaseAmount = Math.min(nextBest.sellableAmount, settings.MAX_SELL_AMOUNT);
                    const nextMaxTransport = Math.floor(merchantsHome * 1000);
                    nextBaseAmount = Math.min(nextBaseAmount, nextMaxTransport);

                    let nextSellAmount = nextBaseAmount - nextBest.resourcesPerPP * 1.5;
                    nextSellAmount = Math.floor(nextSellAmount);

                    console.log(`[BGM] [SELL DEBUG] Next resource calculation: baseAmount=${nextBaseAmount}, final=${nextSellAmount}`);

                    if (nextSellAmount >= settings.MIN_SELL_AMOUNT) {
                        console.log(`[BGM] [SELL DEBUG] Next resource ${nextBest.resource} has sellAmount ${nextSellAmount} >= ${settings.MIN_SELL_AMOUNT}, using it`);
                        bestSellResource = nextBest.resource;
                        bestSellRate = nextBest.rate;
                        bestSellAmount = nextSellAmount;
                        break;
                    } else {
                        console.log(`[BGM] [SELL DEBUG] Next resource ${nextBest.resource} also has sellAmount ${nextSellAmount} < ${settings.MIN_SELL_AMOUNT}, continuing...`);
                    }
                }

                if (!bestSellResource) {
                    console.log(`[BGM] [SELL DEBUG] No sellable resources found meeting minimum sell amount (${settings.MIN_SELL_AMOUNT}) after trying all options`);
                }
            }
        } else {
            console.log(`[BGM] [SELL DEBUG] No sellable resources found`);
        }

        if (bestSellResource) {
            const resourcesPerPP = 1 / bestSellRate;
            console.log(`[BGM] [SELL DEBUG] Returning sell opportunity: ${bestSellResource}, amount=${bestSellAmount}, rate=${bestSellRate.toFixed(6)}`);
            updateStatus(`Sell opportunity: ${bestSellResource} @ ${resourcesPerPP.toFixed(1)} res/PP`, '#4CAF50');
            return {
                resource: bestSellResource,
                amount: bestSellAmount,
                rate: bestSellRate
            };
        }

        console.log(`[BGM] [SELL DEBUG] No sell opportunity found - returning null`);
        return null;
    }

    async function executeSell(resource, amount, csrfToken) {
        // Set transaction in progress flag
        transactionInProgress = true;
        console.log(`[BGM] Sell transaction flag set to IN PROGRESS`);

        updateStatus(`Selling ${amount} ${resource}...`, '#2196F3');

        try {
            // Pre-transaction delay (randomized) - convert seconds to milliseconds
            const preTransactionDelay = Math.floor(Math.random() * (settings.MAX_PRE_TRANSACTION_DELAY - settings.MIN_PRE_TRANSACTION_DELAY) * 1000) + (settings.MIN_PRE_TRANSACTION_DELAY * 1000);
            await new Promise(resolve => setTimeout(resolve, preTransactionDelay));

            // Final cooldown check right before exchange_begin call
            const timeSinceLastTransaction = Date.now() - lastTransactionTime;
            if (lastTransactionTime > 0 && timeSinceLastTransaction < 5000) {
                const remainingCooldown = Math.ceil((5000 - timeSinceLastTransaction) / 1000);
                updateStatus(`Cooldown still active: ${remainingCooldown}s remaining`, '#FF9800');
                console.log(`[BGM] Aborting sell - cooldown still active: ${remainingCooldown}s`);
                transactionInProgress = false; // Clear flag on abort
                return;
            }

            // Begin sell transaction
            const beginUrl = `${window.location.origin}${window.location.pathname}?village=${game_data.village.id}&screen=market&ajaxaction=exchange_begin`;
            const beginBody = `sell_${resource}=${amount}&h=${csrfToken}`;

            const beginResponse = await fetch(beginUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                    'TribalWars-Ajax': '1'
                },
                body: beginBody,
                credentials: 'include'
            });

            const beginData = await beginResponse.json();

            // Check for rate limiting in sell response
            if (beginData.error && handleRateLimitError(beginData.error)) {
                transactionInProgress = false; // Clear flag on rate limit
                return;
            }

            if (!beginData.response || beginData.response.length === 0) {
                updateStatus('Sell initiation failed', '#f44336');
                transactionInProgress = false; // Clear flag on failure
                return;
            }

            const transaction = beginData.response[0];

            // Check if we have enough merchants for the transaction
            if (transaction.merchants_required > merchantsHome) {
                updateStatus(`Not enough merchants: need ${transaction.merchants_required}, have ${merchantsHome}`, '#f44336');
                transactionInProgress = false; // Clear flag on failure
                return;
            }

            // Random delay between begin and confirm - convert seconds to milliseconds
            const randomDelay = Math.floor(Math.random() * (settings.MAX_DELAY_BETWEEN_REQUESTS - settings.MIN_DELAY_BETWEEN_REQUESTS) * 1000) + (settings.MIN_DELAY_BETWEEN_REQUESTS * 1000);
            await new Promise(resolve => setTimeout(resolve, randomDelay));

            // Confirm sell transaction
            const confirmUrl = `${window.location.origin}${window.location.pathname}?village=${game_data.village.id}&screen=market&ajaxaction=exchange_confirm`;
            const confirmBody = `rate_${resource}=${transaction.rate_hash}&sell_${resource}=${Math.abs(transaction.amount)}&mb=1&h=${csrfToken}`;

            const confirmResponse = await fetch(confirmUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                    'TribalWars-Ajax': '1'
                },
                body: confirmBody,
                credentials: 'include'
            });

            const confirmData = await confirmResponse.json();

            // Check for rate limiting in sell confirm response
            if (confirmData.error && handleRateLimitError(confirmData.error)) {
                transactionInProgress = false; // Clear flag on rate limit
                return;
            }

            if (confirmData.response && confirmData.response.success) {
                const completedTransaction = confirmData.response.transactions[0];
                const cost = completedTransaction.cost; // This will be negative for selling
                const actualAmount = Math.abs(completedTransaction.amount);
                const earned = Math.abs(cost);

                // Record transaction
                sessionData.transactions.push({
                    resource: resource,
                    amount: -actualAmount, // Negative for selling
                    cost: cost, // Negative PP earned
                    rate: completedTransaction.base_rate,
                    timestamp: Date.now()
                });

                sessionData.totalEarned += earned;
                sessionData[`sold${resource.charAt(0).toUpperCase() + resource.slice(1)}`] += actualAmount;

                // Update merchants home after selling (subtract merchants used)
                const merchantsUsed = completedTransaction.merchants_required || Math.ceil(actualAmount / 1000);
                merchantsHome = Math.max(0, merchantsHome - merchantsUsed);

                // Reset consecutive failed sell counter on successful sell
                if (sessionData.consecutiveFailedSells > 0) {
                    console.log(`[BGM] [SELL DEBUG] Successful sell - resetting consecutive failed sells from ${sessionData.consecutiveFailedSells} to 0`);
                    sessionData.consecutiveFailedSells = 0;
                }

                setLocalStorage(getVillageStorageKey('backgroundMonitorSession'), sessionData);
                updateStatsDisplay();
                lastTransactionTime = Date.now();

                const randomTransactionDelay = Math.floor(Math.random() * 2001) + 5000;
                updateStatus(`✅ Sold ${actualAmount} ${resource} for ${earned} PP (cooldown: ${randomTransactionDelay / 1000}s)`, '#4CAF50');
                transactionInProgress = false; // Clear flag on success
                console.log(`[BGM] Sell transaction flag CLEARED - success`);

            } else {
                let errorMsg = 'Sell failed';
                if (confirmData.response && confirmData.response.transactions) {
                    confirmData.response.transactions.forEach((t, index) => {
                        if (t.error) {
                            errorMsg += ': ' + t.error;
                            console.log(`[BGM] [SELL ERROR] Transaction ${index} error: ${t.error}`);
                        }
                    });
                } else if (confirmData.response && confirmData.response.transactions && confirmData.response.transactions[0] && confirmData.response.transactions[0].error) {
                    // Additional check for the specific case mentioned
                    const transactionError = confirmData.response.transactions[0].error;
                    errorMsg += ': ' + transactionError;
                    console.log(`[BGM] [SELL ERROR] Transaction error: ${transactionError}`);
                }
                
                // Print full response for debugging
                console.log(`[BGM] [SELL ERROR] Full confirmData response:`, JSON.stringify(confirmData, null, 2));
                
                // Increment consecutive failed sell counter
                sessionData.consecutiveFailedSells += 1;
                console.log(`[BGM] [SELL DEBUG] Failed sell - consecutive failed sells: ${sessionData.consecutiveFailedSells}/${settings.MAX_CONSECUTIVE_SELLS}`);
                setLocalStorage(getVillageStorageKey('backgroundMonitorSession'), sessionData);
                
                updateStatus(errorMsg, '#f44336');
                transactionInProgress = false; // Clear flag on failure
                console.log(`[BGM] Sell transaction flag CLEARED - failure`);
            }

        } catch (error) {
            // Increment consecutive failed sell counter on exception
            sessionData.consecutiveFailedSells += 1;
            console.log(`[BGM] [SELL DEBUG] Exception during sell - consecutive failed sells: ${sessionData.consecutiveFailedSells}/${settings.MAX_CONSECUTIVE_SELLS}`);
            setLocalStorage(getVillageStorageKey('backgroundMonitorSession'), sessionData);
            
            updateStatus('Sell error: ' + error.message, '#f44336');
            transactionInProgress = false; // Clear flag on exception
            console.log(`[BGM] Sell transaction flag CLEARED - exception`);
        }
    }

    async function executePurchase(resource, amount, csrfToken) {
        console.log(`[BGM] executePurchase called: ${amount} ${resource} ${csrfToken}`);
        updateCurrentTask(`Starting purchase: ${amount} ${resource}`);

        // Set transaction in progress flag
        transactionInProgress = true;
        console.log(`[BGM] Transaction flag set to IN PROGRESS`);

        updateStatus(`Buying ${amount} ${resource}...`, '#2196F3');
        console.log(`[BGM] Starting purchase with CSRF: ${csrfToken.substring(0, 8)}...`);

        try {
            // Pre-transaction delay (randomized) - convert seconds to milliseconds
            const preTransactionDelay = Math.floor(Math.random() * (settings.MAX_PRE_TRANSACTION_DELAY - settings.MIN_PRE_TRANSACTION_DELAY) * 1000) + (settings.MIN_PRE_TRANSACTION_DELAY * 1000);
            console.log(`[BGM] Pre-transaction delay: ${preTransactionDelay}ms`);
            updateCurrentTask(`Waiting ${(preTransactionDelay / 1000).toFixed(1)}s before purchase`);
            await new Promise(resolve => setTimeout(resolve, preTransactionDelay));

            // Final cooldown check right before exchange_begin call
            const timeSinceLastTransaction = Date.now() - lastTransactionTime;
            if (lastTransactionTime > 0 && timeSinceLastTransaction < 5000) {
                const remainingCooldown = Math.ceil((5000 - timeSinceLastTransaction) / 1000);
                updateStatus(`Cooldown still active: ${remainingCooldown}s remaining`, '#FF9800');
                console.log(`[BGM] Aborting purchase - cooldown still active: ${remainingCooldown}s`);
                transactionInProgress = false; // Clear flag on abort
                return;
            }

            // Step 1: Begin exchange
            const beginUrl = `${window.location.origin}${window.location.pathname}?village=${game_data.village.id}&screen=market&ajaxaction=exchange_begin`;
            const beginBody = `buy_${resource}=${amount}&h=${csrfToken}`;

            console.log(`[BGM] Making begin request to: ${beginUrl}`);
            console.log(`[BGM] Begin body: ${beginBody}`);
            updateCurrentTask(`Initiating purchase request`);

            const beginResponse = await fetch(beginUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                    'TribalWars-Ajax': '1'
                },
                body: beginBody,
                credentials: 'include'
            });

            console.log(`[BGM] Begin response status: ${beginResponse.status}`);
            const beginData = await beginResponse.json();
            console.log(`[BGM] Begin response data:`, beginData);

            // Check for rate limiting in purchase response
            if (beginData.error && handleRateLimitError(beginData.error)) {
                transactionInProgress = false; // Clear flag on rate limit
                console.log(`[BGM] Purchase transaction flag CLEARED - rate limited`);
                return;
            }

            if (!beginData.response || beginData.response.length === 0) {
                updateStatus('Purchase initiation failed', '#f44336');
                transactionInProgress = false; // Clear flag on failure
                console.log(`[BGM] Purchase transaction flag CLEARED - begin failed`);
                return;
            }

            // Random delay between begin and confirm - convert seconds to milliseconds
            const randomDelay = Math.floor(Math.random() * (settings.MAX_DELAY_BETWEEN_REQUESTS - settings.MIN_DELAY_BETWEEN_REQUESTS) * 1000) + (settings.MIN_DELAY_BETWEEN_REQUESTS * 1000);
            await new Promise(resolve => setTimeout(resolve, randomDelay));

            // Step 2: Confirm exchange
            const transaction = beginData.response[0];
            const confirmUrl = `${window.location.origin}${window.location.pathname}?village=${game_data.village.id}&screen=market&ajaxaction=exchange_confirm`;
            const confirmBody = `rate_${resource}=${transaction.rate_hash}&buy_${resource}=${transaction.amount}&mb=1&h=${csrfToken}`;

            const confirmResponse = await fetch(confirmUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                    'TribalWars-Ajax': '1'
                },
                body: confirmBody,
                credentials: 'include'
            });

            const confirmData = await confirmResponse.json();

            // Check for rate limiting in purchase confirm response
            if (confirmData.error && handleRateLimitError(confirmData.error)) {
                transactionInProgress = false; // Clear flag on rate limit
                console.log(`[BGM] Purchase transaction flag CLEARED - rate limited`);
                return;
            }

            if (confirmData.response && confirmData.response.success) {
                const completedTransaction = confirmData.response.transactions[0];
                const cost = completedTransaction.cost;
                const actualAmount = completedTransaction.amount;

                // Record transaction
                sessionData.transactions.push({
                    resource: resource,
                    amount: actualAmount,
                    cost: cost,
                    rate: completedTransaction.base_rate,
                    timestamp: Date.now()
                });

                sessionData.totalSpent += cost;
                sessionData[`total${resource.charAt(0).toUpperCase() + resource.slice(1)}`] += actualAmount;

                // Note: Buy transactions don't affect consecutive failed sell counter

                setLocalStorage(getVillageStorageKey('backgroundMonitorSession'), sessionData);
                updateStatsDisplay();

                // Set last transaction time for cooldown
                lastTransactionTime = Date.now();

                // Add random delay between 5-7 seconds before next transaction is allowed
                const randomTransactionDelay = Math.floor(Math.random() * 2001) + 5000; // 5000-7000ms
                updateStatus(`✅ Bought ${actualAmount} ${resource} for ${cost} PP (cooldown: ${randomTransactionDelay / 1000}s)`, '#f44336');
                transactionInProgress = false; // Clear flag on success
                console.log(`[BGM] Purchase transaction flag CLEARED - success`);

                if (settings.MINIMAL_PURCHASE_MODE) {
                    setLastMinimalResource(resource);
                }
            } else {
                let errorMsg = 'Purchase failed';
                if (confirmData.response && confirmData.response.transactions) {
                    confirmData.response.transactions.forEach(t => {
                        if (t.error) errorMsg += ': ' + t.error;
                    });
                }
                updateStatus(errorMsg, '#f44336');
                transactionInProgress = false; // Clear flag on failure
                console.log(`[BGM] Purchase transaction flag CLEARED - failure`);
            }

        } catch (error) {
            updateStatus('Purchase error: ' + error.message, '#f44336');
            transactionInProgress = false; // Clear flag on exception
            console.log(`[BGM] Purchase transaction flag CLEARED - exception`);
        }
    }

    function stopMonitor() {
        console.log('[BGM] Stopping monitor...');

        if (worker) {
            worker.postMessage({ type: 'stop' });
        }
        isRunning = false;
        transactionInProgress = false; // Clear any pending transaction flags
        priceCheckInProgress = false; // Clear any pending price check flags
        
        // Reset consecutive failed sells counter when manually stopping monitoring
        if (sessionData.consecutiveFailedSells > 0) {
            console.log(`[BGM] Resetting consecutive failed sells counter from ${sessionData.consecutiveFailedSells} to 0 (manual stop)`);
            sessionData.consecutiveFailedSells = 0;
            setLocalStorage(getVillageStorageKey('backgroundMonitorSession'), sessionData);
        }
        
        updateStatus('Stopped', '#f44336');
        updatePageTitle(false); // Reset page title
        updateCurrentTask('Stopped');

        // Clear any active countdown
        if (currentTaskCountdown) {
            clearInterval(currentTaskCountdown);
            currentTaskCountdown = null;
        }

        // Show start button, hide stop button
        document.getElementById('bgmStart').style.display = 'inline';
        document.getElementById('bgmStop').style.display = 'none';
    }

    function startMonitor() {
        // Prevent starting if already running
        if (isRunning) {
            console.log('[BGM] Monitor already running, ignoring start request');
            return;
        }

        console.log('[BGM] Starting monitor...');

        // Reset consecutive failed sells counter when manually starting monitoring
        if (sessionData.consecutiveFailedSells > 0) {
            console.log(`[BGM] Resetting consecutive failed sells counter from ${sessionData.consecutiveFailedSells} to 0 (manual start)`);
            sessionData.consecutiveFailedSells = 0;
            setLocalStorage(getVillageStorageKey('backgroundMonitorSession'), sessionData);
        }

        // Check if we're in recovery mode and attempt immediate recovery
        if (sessionExpired || botProtectionActive) {
            const recoveryType = sessionExpired ? 'sessionExpired' : 'botProtection';
            const recoveryTypeName = sessionExpired ? 'Session' : 'Bot protection';
            console.log(`[BGM] Start button pressed during ${recoveryTypeName.toLowerCase()} recovery - attempting immediate recovery`);

            // Clear recovery flags to allow fresh attempt
            sessionExpired = false;
            botProtectionActive = false;
            recoveryActive = false;

            // Clear any existing recovery intervals/timeouts
            if (recoveryTimeout) {
                clearTimeout(recoveryTimeout);
                recoveryTimeout = null;
            }
            if (recoveryCountdownInterval) {
                clearInterval(recoveryCountdownInterval);
                recoveryCountdownInterval = null;
            }

            updateStatus(`Manual restart - testing ${recoveryTypeName.toLowerCase()} recovery...`, '#2196F3');
            updateCurrentTask(`Testing ${recoveryTypeName.toLowerCase()} recovery...`);
        }

        // Stop and terminate any existing worker first
        if (worker) {
            console.log('[BGM] Stopping existing worker before starting new one');
            worker.postMessage({ type: 'stop' });
            worker.terminate();
            worker = null;
        }

        // Create a new worker instance
        console.log("Spawning worker")
        worker = new Worker(
            `data:text/javascript,
            let nextCheckTime = null;
            let isStoppedFromError = false;
            let minInterval = 1000;
            let maxInterval = 2500;
            let scheduledTimeout = null;
            
            function getRandomInterval(minDelayMs = null) {
                if (minDelayMs !== null) {
                    // Transaction-aware scheduling
                    const normalRange = maxInterval - minInterval;
                    
                    if (minDelayMs > maxInterval) {
                        // If transaction delay exceeds max price check delay, use extended range
                        const result = Math.floor(Math.random() * normalRange) + minDelayMs;
                        console.log('[Worker] Extended delay: ' + minDelayMs + 'ms > ' + maxInterval + 'ms, using range ' + minDelayMs + '-' + (minDelayMs + normalRange) + 'ms, result: ' + result + 'ms');
                        return result;
                    } else {
                        // Use normal range but ensure minimum is met
                        const actualMin = Math.max(minInterval, minDelayMs);
                        const result = Math.floor(Math.random() * (maxInterval - actualMin)) + actualMin;
                        console.log('[Worker] Transaction delay: ' + minDelayMs + 'ms <= ' + maxInterval + 'ms, using range ' + actualMin + '-' + maxInterval + 'ms, result: ' + result + 'ms');
                        return result;
                    }
                }
                const result = Math.floor(Math.random() * (maxInterval - minInterval)) + minInterval;
                console.log('[Worker] Normal scheduling: range ' + minInterval + '-' + maxInterval + 'ms, result: ' + result + 'ms');
                return result;
            }
            
            function scheduleNext(minDelayMs = null) {
                if (isStoppedFromError) return;
                
                // Clear any existing scheduled timeout to prevent overlaps
                if (scheduledTimeout) {
                    clearTimeout(scheduledTimeout);
                    scheduledTimeout = null;
                }
                
                const interval = getRandomInterval(minDelayMs);
                const seconds = Math.ceil(interval / 1000);
                nextCheckTime = Date.now() + interval;
                
                // Send countdown message with transaction-aware information
                const taskDescription = minDelayMs ? 
                    'Waiting to check prices (post-transaction)' : 
                    'Waiting to check prices';
                postMessage({type: 'startCountdown', task: taskDescription, seconds: seconds});
                
                scheduledTimeout = setTimeout(() => {
                    if (!isStoppedFromError) {
                        scheduledTimeout = null;
                        postMessage({type: 'checkPrices'});
                    }
                }, interval);
            }
            
            onmessage = function(event) {
                const data = event.data;
                
                if (data.type === 'start') {
                    isStoppedFromError = false;
                    postMessage({type: 'started'});
                    // Immediately trigger first price check
                    postMessage({type: 'checkPrices'});
                    // Note: scheduleNext() will be called from continueScheduling after first check completes
                }
                else if (data.type === 'stop') {
                    isStoppedFromError = true;
                    // Clear any pending scheduled timeout
                    if (scheduledTimeout) {
                        clearTimeout(scheduledTimeout);
                        scheduledTimeout = null;
                    }
                    postMessage({type: 'stopped'});
                }
                else if (data.type === 'sessionExpired' || data.type === 'botProtection') {
                    isStoppedFromError = true;
                    postMessage({type: 'error', error: data.type});
                }
                else if (data.type === 'rateLimited') {
                    // Don't stop monitoring for rate limits, just continue scheduling
                    postMessage({type: 'rateLimited'});
                }
                else if (data.type === 'scheduleNext') {
                    scheduleNext(data.minDelayMs || null);
                }
                else if (data.type === 'updateIntervals') {
                    minInterval = data.minInterval;
                    maxInterval = data.maxInterval;
                }
            };
        `);

        worker.onmessage = function (event) {
            const data = event.data;

            if (data.type === 'started') {
                updateStatus('Monitoring prices...', '#4CAF50');
                updateCurrentTask('Started');
            }
            else if (data.type === 'stopped') {
                updateStatus('Stopped', '#f44336');
                updateCurrentTask('Stopped');
                if (currentTaskCountdown) {
                    clearInterval(currentTaskCountdown);
                    currentTaskCountdown = null;
                }
            }
            else if (data.type === 'startCountdown') {
                startCountdown(data.task, data.seconds);
            }
            else if (data.type === 'checkPrices') {
                updateCurrentTask('Checking prices...');
                checkPricesAndBuy();
            }
            else if (data.type === 'rateLimited') {
                // Rate limit detected, continue monitoring after delay
                updateStatus('Rate limited - continuing after delay...', '#FF9800');
                updateCurrentTask('Rate limited');
            }
            else if (data.type === 'error') {
                // Legacy error handling - recovery is now handled automatically by startRecovery()
                console.log(`[BGM] Legacy error message received: ${data.error}`);
            }
        };

        // Initialize worker with current settings and start monitoring
        updateWorkerInterval();
        worker.postMessage({ type: 'start' });
        isRunning = true;
        updateStatus('Starting...', '#2196F3');
        updatePageTitle(true); // Update page title to show monitoring

        // Show stop button, hide start button
        document.getElementById('bgmStart').style.display = 'none';
        document.getElementById('bgmStop').style.display = 'inline';
    }

    function closeMonitor() {
        if (worker) {
            worker.postMessage({ type: 'stop' });
            worker.terminate();
            worker = null;
        }
        isRunning = false;
        updatePageTitle(false); // Reset page title

        if (statusUI) {
            statusUI.remove();
            statusUI = null;
        }

        window.backgroundPPMonitorRunning = false;
        UI.SuccessMessage('Background monitor closed');
    }

    // Initialize prices on load
    async function initializePrices() {
        updateStatus('Loading initial prices...', '#2196F3');
        updateCurrentTask('Loading current prices...');

        let priceData = await fetchPrices();
        priceData = priceData.response;
        if (priceData) {
            updatePricesWithChangeTracking(priceData.rates);

            // Log price history if enough time has passed
            logPriceHistory(priceData);

            updateStatsDisplay();
            updateStatus('Ready to start', '#FF9800');
            updateCurrentTask('Initialization complete');
        } else {
            updateStatus('Ready to start (prices unavailable)', '#FF9800');
            updateCurrentTask('Price loading failed - ready to start');
        }

        // Merchant count is now obtained from price queries automatically
        updateCurrentTask('Initialization complete');
    }

    // Start the monitor
    createUI();

    // Update last event display every minute to keep "time ago" current
    setInterval(() => {
        updateLastEventDisplay();
    }, 60000); // Update every minute

    // Load initial prices
    initializePrices();

    // Handle settings screen
    if (isSettingsScreen) {
        // On settings screen, show settings by default
        toggleSettings();
    }

    UI.SuccessMessage('Background PP monitor loaded!');
})();