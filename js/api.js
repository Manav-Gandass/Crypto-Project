// ============================================
// API FUNCTIONS
// ============================================

async function fetchMarketData() {
    const ids = AppState.currentCoins.join(',');

    const API_URL =
        `${CONFIG.API_BASE}/coins/markets` +
        `?vs_currency=${AppState.currentCurrency}` +
        `&ids=${ids}` +
        `&order=market_cap_desc` +
        `&per_page=100` +
        `&page=1` +
        `&sparkline=false` +
        `&price_change_percentage=24h`;

    try {
        return await fetchWithCache(
            API_URL,
            CONFIG.MARKET_CACHE_TIME
        );
    } catch (error) {
        console.error('Error fetching market data:', error);
        return [];
    }
}

async function fetchChartsData(coinId) {
    const API_URL =
        `${CONFIG.API_BASE}/coins/${coinId}/market_chart` +
        `?vs_currency=${AppState.currentCurrency}` +
        `&days=${CONFIG.CHART_DAYS}` +
        `&interval=daily`;

    try {
        const data = await fetchWithCache(
            API_URL,
            CONFIG.CHART_CACHE_TIME
        );

        if (!data || !data.prices || data.prices.length === 0) {
            throw new Error('Empty chart data');
        }

        return data.prices.map(([timestamp, price]) => ({
            time: new Date(timestamp).toLocaleDateString(),
            value: price
        }));

    } catch (error) {
        console.warn(
            `API limit or fetch failed for ${coinId}. Using mock chart data.`
        );

        return generateMockChartData(CONFIG.MOCK_CHART_DAYS);
    }
}

// ============================================
// CACHING
// ============================================

async function fetchWithCache(url, cacheTime = 300000) {
    const cacheKey = `crypto_cache_${url}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
        const parsed = JSON.parse(cached);

        if (Date.now() - parsed.timestamp < cacheTime) {
            console.log(`Using cached data: ${url}`);
            return parsed.data;
        }
    }

    console.log(`Fetching fresh data: ${url}`);

    try {

        const response = await fetch(url);

        if (!response.ok) {

            if (response.status === 429 && cached) {
                console.warn(
                    'Rate limit exceeded. Returning stale cache.'
                );

                return JSON.parse(cached).data;
            }

            throw new Error(`HTTP Error ${response.status}`);
        }

        const data = await response.json();

        localStorage.setItem(
            cacheKey,
            JSON.stringify({
                timestamp: Date.now(),
                data
            })
        );

        return data;

    } catch (error) {

        console.error('Fetch failed:', error);

        // If a network/CORS error occurs but we have stale cache,
        // use it instead of failing.
        if (cached) {
            console.warn(
                'Using stale cached data because the request failed.'
            );

            return JSON.parse(cached).data;
        }

        throw error;
    }
}