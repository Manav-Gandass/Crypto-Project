// ============================================
// APPLICATION STATE
// ============================================

const AppState = {
    // Currently selected currency
    currentCurrency: 'usd',

    // Coins currently displayed
    currentCoins: [...CONFIG.DEFAULT_COINS],

    // Timers
    refreshTimer: null,
    countdownTimer: null,
    searchTimeout: null,

    // Chart.js instances
    charts: {},

    // Prevent duplicate requests
    isLoading: false,

    autoRefreshEnabled: true
};

// ============================================
// DOM REFERENCES
// ============================================

const DOM = {
    cryptoGrid: null,
    searchInput: null,
    currencySelector: null,
    refreshStatus: null,
    countdown: null,
    refreshToggle: null
};

// ============================================
// INITIALIZE DOM REFERENCES
// ============================================

function initializeDOM() {
    DOM.cryptoGrid = document.getElementById('crypto-container');

    DOM.searchInput = document.getElementById('searchInput');
    DOM.currencySelector = document.getElementById('currencySelector');

    DOM.refreshStatus = document.getElementById('refreshStatus');
    DOM.countdown = document.getElementById('countdown');

    DOM.refreshToggle = document.getElementById("refreshToggle");
}