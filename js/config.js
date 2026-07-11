// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    // CoinGecko API
    API_BASE: 'https://api.coingecko.com/api/v3',

    // Auto Refresh
    REFRESH_INTERVAL: 30000, // 30 seconds

    // Charts
    CHART_DAYS: 30,

    // Default cryptocurrencies shown on page load
    DEFAULT_COINS: [
        'bitcoin',
        'ethereum',
        'cardano',
        'polkadot',
        'chainlink',
        'litecoin'
    ],

    // Currency symbols
    CURRENCY_SYMBOLS: {
        usd: '$',
        inr: '₹',
        eur: '€'
    },

    // Search
    SEARCH_DEBOUNCE: 500, // milliseconds

    // API Cache Durations
    MARKET_CACHE_TIME: 60000,      // 1 minute
    CHART_CACHE_TIME: 600000,      // 10 minutes

    // Chart Rendering
    CHART_STAGGER_DELAY: 1200,
    CHART_ANIMATION_DURATION: 1500,

    // UI
    MAX_SEARCH_RESULTS: 6,
    MIN_SEARCH_LENGTH: 2,

    // Mock Data
    MOCK_CHART_DAYS: 7
};