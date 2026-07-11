// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    DOM.searchInput.addEventListener(
        'input',
        handleSearchDebounced
    );

    DOM.currencySelector.addEventListener(
        'change',
        handleCurrencyChange
    );

    window.addEventListener(
        'beforeunload',
        cleanup
    );
}

// ============================================
// SEARCH
// ============================================

function handleSearchDebounced() {
    if (AppState.searchTimeout) {
        clearTimeout(AppState.searchTimeout);
    }

    AppState.searchTimeout = setTimeout(
        handleSearch,
        CONFIG.SEARCH_DEBOUNCE
    );
}

async function handleSearch() {
    const query = DOM.searchInput.value
        .trim()
        .toLowerCase();

    if (query === '') {
        AppState.currentCoins = [
            ...CONFIG.DEFAULT_COINS
        ];

        await loadCryptocurrencies();

        return;
    }

    if (
        query.length <
        CONFIG.MIN_SEARCH_LENGTH
    ) {
        return;
    }

    try {
        if (!AppState.isLoading) {
            showLoading('Searching...');
        }

        const response = await fetch(
            `${CONFIG.API_BASE}/search?query=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
            throw new Error(
                `Search failed: ${response.status}`
            );
        }

        const data = await response.json();

        if (
            data.coins &&
            data.coins.length > 0
        ) {
            AppState.currentCoins =
                data.coins
                    .slice(
                        0,
                        CONFIG.MAX_SEARCH_RESULTS
                    )
                    .map(
                        coin => coin.id
                    );

            await loadCryptocurrencies();
        } else {
            showError(
                'No cryptocurrencies found matching your search.'
            );
        }

    } catch (error) {

        console.error(
            'Search error:',
            error
        );

        showError(
            'Error searching cryptocurrencies. Please try again.'
        );
    }
}
// ============================================
// CURRENCY MANAGEMENT
// ============================================

async function handleCurrencyChange() {
    const newCurrency = DOM.currencySelector.value;

    if (newCurrency !== AppState.currentCurrency) {
        AppState.currentCurrency = newCurrency;

        await loadCryptocurrencies();
    }
}

// ============================================
// DATA LOADING
// ============================================

async function loadCryptocurrencies(includeCharts = true) {

    if (AppState.isLoading) {
        return;
    }

    AppState.isLoading = true;

    try {

        if (includeCharts) {
            showLoading();
        }

        const marketData = await fetchMarketData();

        if (!marketData || marketData.length === 0) {
            showError(
                'No cryptocurrency data available.'
            );
            return;
        }

        let chartsData = {};

        if (includeCharts) {

            const chartPromises = marketData.map(
                (coin, index) =>
                    new Promise(resolve => {

                        setTimeout(async () => {

                            try {

                                const data =
                                    await fetchChartsData(
                                        coin.id
                                    );

                                resolve({
                                    id: coin.id,
                                    data
                                });

                            } catch (error) {

                                console.error(
                                    `Chart load failed for ${coin.id}`,
                                    error
                                );

                                resolve({
                                    id: coin.id,
                                    data: []
                                });

                            }

                        }, index * CONFIG.CHART_STAGGER_DELAY);

                    })
            );

            const results =
                await Promise.all(chartPromises);

            results.forEach(result => {
                chartsData[result.id] =
                    result.data;
            });
        }

        renderCryptoCards(
            marketData,
            chartsData,
            includeCharts
        );

    } catch (error) {

        console.error(
            'Error loading cryptocurrencies:',
            error
        );

        showError(
            'Failed to load cryptocurrency data. Please try again.'
        );

    } finally {

        AppState.isLoading = false;

    }
}
// ============================================
// AUTO REFRESH
// ============================================

function startAutoRefresh() {

    if (AppState.refreshTimer) {
        clearInterval(AppState.refreshTimer);
    }

    if (AppState.countdownTimer) {
        clearInterval(AppState.countdownTimer);
    }

    let remaining =
        CONFIG.REFRESH_INTERVAL / 1000;

    updateCountdown(remaining);

    AppState.countdownTimer = setInterval(() => {

        remaining--;

        if (remaining >= 0) {
            updateCountdown(remaining);
        }

    }, 1000);

    AppState.refreshTimer = setInterval(async () => {

        if (!AppState.isLoading) {
            await loadCryptocurrencies(false);
        }

        remaining =
            CONFIG.REFRESH_INTERVAL / 1000;

        updateCountdown(remaining);

    }, CONFIG.REFRESH_INTERVAL);
}

// ============================================
// CLEANUP
// ============================================

function cleanup() {

    if (AppState.refreshTimer) {
        clearInterval(AppState.refreshTimer);
        AppState.refreshTimer = null;
    }

    if (AppState.countdownTimer) {
        clearInterval(AppState.countdownTimer);
        AppState.countdownTimer = null;
    }

    if (AppState.searchTimeout) {
        clearTimeout(AppState.searchTimeout);
        AppState.searchTimeout = null;
    }

    Object.keys(AppState.charts).forEach(
        coinId => {
            destroyChart(coinId);
        }
    );

    console.log(
        'Crypto Dashboard cleaned up successfully'
    );
}