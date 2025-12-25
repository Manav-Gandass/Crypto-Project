// ============================================
// CRYPTO DASHBOARD - MAIN JAVASCRIPT FILE
// ============================================

// Configuration object
const CONFIG = {
    API_BASE: 'https://api.coingecko.com/api/v3',
    REFRESH_INTERVAL: 30000, // 30 seconds
    CHART_DAYS: 7, // 7 days of price history
    DEFAULT_COINS: ['bitcoin', 'ethereum', 'cardano', 'polkadot', 'chainlink', 'litecoin'],
    CURRENCY_SYMBOLS: {
        usd: '$',
        inr: '₹',
        eur: '€'
    },
    SEARCH_DEBOUNCE: 500 // milliseconds
};

// Global state management
const AppState = {
    currentCurrency: 'usd',
    currentCoins: [...CONFIG.DEFAULT_COINS],
    refreshTimer: null,
    countdownTimer: null,
    searchTimeout: null,
    charts: {},
    isLoading: false
};

// DOM element references
const DOM = {
    cryptoGrid: null,
    searchInput: null,
    currencySelector: null,
    refreshStatus: null,
    countdown: null
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeDOM();
    setupEventListeners();
    loadCryptocurrencies();
    startAutoRefresh();
});

function initializeDOM() {
    DOM.cryptoGrid = document.getElementById('cryptoGrid');
    DOM.searchInput = document.getElementById('searchInput');
    DOM.currencySelector = document.getElementById('currencySelector');
    DOM.refreshStatus = document.getElementById('refreshStatus');
    DOM.countdown = document.getElementById('countdown');
}

function setupEventListeners() {
    // Search functionality with debouncing
    DOM.searchInput.addEventListener('input', handleSearchDebounced);
    
    // Currency change
    DOM.currencySelector.addEventListener('change', handleCurrencyChange);
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

function handleSearchDebounced() {
    if (AppState.searchTimeout) {
        clearTimeout(AppState.searchTimeout);
    }
    
    AppState.searchTimeout = setTimeout(handleSearch, CONFIG.SEARCH_DEBOUNCE);
}

async function handleSearch() {
    const query = DOM.searchInput.value.trim().toLowerCase();
    
    if (query === '') {
        AppState.currentCoins = [...CONFIG.DEFAULT_COINS];
        await loadCryptocurrencies();
        return;
    }

    if (query.length < 2) {
        return; // Wait for at least 2 characters
    }

    try {
        showSearchingState();
        
        const response = await fetch(`${CONFIG.API_BASE}/search?query=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            throw new Error(`Search failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.coins && data.coins.length > 0) {
            // Get top 6 matching coins
            AppState.currentCoins = data.coins.slice(0, 6).map(coin => coin.id);
            await loadCryptocurrencies();
        } else {
            showError('No cryptocurrencies found matching your search.');
        }
    } catch (error) {
        console.error('Search error:', error);
        showError('Error searching cryptocurrencies. Please try again.');
    }
}

function showSearchingState() {
    if (!AppState.isLoading) {
        showLoading('Searching...');
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
    if (AppState.isLoading) return;
    AppState.isLoading = true;

    try {
        if (includeCharts) {
            showLoading();
        }

        const marketData = await fetchMarketData();
        if (!marketData || marketData.length === 0) {
            showError('No cryptocurrency data available.');
            return;
        }

        let chartsData = {};

        if (includeCharts) {
            // Fetch charts in parallel but safely spaced
            const chartPromises = marketData.map((coin, index) =>
                new Promise(resolve => {
                    setTimeout(async () => {
                        try {
                            const data = await fetchChartsData(coin.id);
                            resolve({ id: coin.id, data });
                        } catch (err) {
                            console.error(`Chart load failed for ${coin.id}`, err);
                            resolve({ id: coin.id, data: [] });
                        }
                    }, index * 1200); // staggered to avoid rate limit
                })
            );

            const results = await Promise.all(chartPromises);

            results.forEach(result => {
                chartsData[result.id] = result.data;
            });
        }

        renderCryptoCards(marketData, chartsData, includeCharts);

    } catch (error) {
        console.error('Error loading cryptocurrencies:', error);
        showError('Failed to load cryptocurrency data. Please try again.');
    } finally {
        AppState.isLoading = false;
    }
}




async function fetchMarketData() {
    const PROXY = "https://cors-anywhere.herokuapp.com/";
    const API_URL =
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,cardano,polkadot,chainlink,litecoin&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h";
  
    try {
      const response = await fetch(PROXY + API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data; // your loadCryptocurrencies() function will use this
    } catch (error) {
      console.error("Error loading cryptocurrencies:", error);
      return [];
    }
  }
  

  async function fetchChartsData(coinId) {
    const PROXY = "https://cors-anywhere.herokuapp.com/";
    const API_URL = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=7&interval=daily`;
  
    try {
      const response = await fetch(PROXY + API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      return data.prices.map(p => ({
        time: new Date(p[0]).toLocaleDateString(),
        value: p[1]
      }));
    } catch (error) {
      console.error(`Failed to load chart for ${coinId}:`, error);
      return [];
    }
  }
  

// ============================================
// RENDERING
// ============================================

function renderCryptoCards(marketData, chartsData, includeCharts = true) {
    const container = document.getElementById("crypto-container");
    container.innerHTML = ""; // clear old cards

    marketData.forEach(coin => {
        const card = document.createElement("div");
        card.className = "crypto-card";

        // coin details
        card.innerHTML = `
            <h2>${coin.name} (${coin.symbol.toUpperCase()})</h2>
            <p>Price: $${coin.current_price.toLocaleString()}</p>
            <p>Market Cap: $${coin.market_cap.toLocaleString()}</p>
            <p>24h Change: ${coin.price_change_percentage_24h.toFixed(2)}%</p>
            <canvas id="chart-${coin.id}" width="300" height="150"></canvas>
        `;

        container.appendChild(card);

        // render chart only if available
        if (includeCharts && chartsData[coin.id]) {
            const ctx = document.getElementById(`chart-${coin.id}`).getContext("2d");

            new Chart(ctx, {
                type: "line",
                data: {
                    labels: chartsData[coin.id].prices.map(p => {
                        const date = new Date(p[0]);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                    }),
                    datasets: [{
                        label: `${coin.name} Price`,
                        data: chartsData[coin.id].prices.map(p => p[1]),
                        borderColor: "blue",
                        fill: false,

                        tension: 0.2
                        //tension inc(0.2)=> 60
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { maxTicksLimit: 7 } },
                        y: { beginAtZero: false }
                    }
                }
            });
        }
    });
}



// ============================================
// CHART MANAGEMENT
// ============================================
function createChart(coinId, priceData) {
    const canvas = document.getElementById(`chart-${coinId}`);
    if (!canvas || !Array.isArray(priceData) || priceData.length === 0) return;

    const ctx = canvas.getContext('2d');

    // Process data in one pass
    const labels = [];
    const prices = [];

    for (let i = 0; i < priceData.length; i++) {
        const [timestamp, price] = priceData[i];
        labels.push(
            new Date(timestamp).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            })
        );
        prices.push(price);
    }

    // Determine trend color
    const trendColor =
        prices[prices.length - 1] >= prices[0] ? '#4ade80' : '#f87171';

    // If chart already exists → update instead of destroy/recreate
    if (AppState.charts[coinId]) {
        const chart = AppState.charts[coinId];

        chart.data.labels = labels;
        chart.data.datasets[0].data = prices;
        chart.data.datasets[0].borderColor = trendColor;
        chart.data.datasets[0].backgroundColor = `${trendColor}15`;

        chart.options.plugins.tooltip.borderColor = trendColor;
        chart.update('none'); // fast update, no animation
        return;
    }

    // Create chart only once
    AppState.charts[coinId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                data: prices,
                borderColor: trendColor,
                backgroundColor: `${trendColor}15`,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: trendColor,
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: trendColor,
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        label(context) {
                            return (
                                CONFIG.CURRENCY_SYMBOLS[AppState.currentCurrency] +
                                formatPrice(context.parsed.y)
                            );
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)', drawBorder: false },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        maxTicksLimit: 4,
                        font: { size: 11 }
                    }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)', drawBorder: false },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: { size: 11 },
                        callback(value) {
                            return (
                                CONFIG.CURRENCY_SYMBOLS[AppState.currentCurrency] +
                                formatPrice(value)
                            );
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 1500,
                easing: 'easeInOutQuart'
            }
        }
    });
}

function createEmptyChart(coinId) {
    const canvas = document.getElementById(`chart-${coinId}`);
    if (!canvas) return;
    
    destroyChart(coinId);
    
    const ctx = canvas.getContext('2d');
    
    AppState.charts[coinId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['No Data'],
            datasets: [{
                data: [0],
                borderColor: 'rgba(255, 255, 255, 0.3)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { display: false }
            }
        }
    });
}

function destroyChart(coinId) {
    if (AppState.charts[coinId]) {
        AppState.charts[coinId].destroy();
        delete AppState.charts[coinId];
    }
}

// ============================================
// AUTO-REFRESH FUNCTIONALITY
// ============================================

function startAutoRefresh() {
    let seconds = 30;
    
    // Update countdown display
    updateCountdown(seconds);
    
    // Countdown timer
    AppState.countdownTimer = setInterval(() => {
        seconds--;
        updateCountdown(seconds);
        
        if (seconds <= 0) {
            seconds = 30;
        }
    }, 1000);
    
    // Data refresh timer
    AppState.refreshTimer = setInterval(async () => {
        if (!AppState.isLoading) {
            await loadCryptocurrencies(false); // ⬅️ don't reload charts
        }
        seconds = 30;
        updateCountdown(seconds);
    }, CONFIG.REFRESH_INTERVAL);
    
}

function updateCountdown(seconds) {
    if (DOM.countdown) {
        DOM.countdown.textContent = `${seconds}s`;
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatPrice(price) {
    if (!price && price !== 0) return '0.00';
    
    if (price >= 1) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(price);
    } else {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 4,
            maximumFractionDigits: 8
        }).format(price);
    }
}

function formatLargeNumber(num) {
    if (!num && num !== 0) return '0';
    
    if (num >= 1e12) {
        return (num / 1e12).toFixed(2) + 'T';
    } else if (num >= 1e9) {
        return (num / 1e9).toFixed(2) + 'B';
    } else if (num >= 1e6) {
        return (num / 1e6).toFixed(2) + 'M';
    } else if (num >= 1e3) {
        return (num / 1e3).toFixed(2) + 'K';
    }
    return formatPrice(num);
}

// ============================================
// UI STATE MANAGEMENT
// ============================================

function showLoading(message = 'Loading cryptocurrency data...') {
    DOM.cryptoGrid.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>${message}</p>
        </div>
    `;
}

function showError(message) {
    DOM.cryptoGrid.innerHTML = `
        <div class="error">
            <h3>⚠️ Error</h3>
            <p>${message}</p>
            <button onclick="loadCryptocurrencies()" style="
                margin-top: 15px; 
                padding: 10px 20px; 
                background: rgba(15,155,142,0.2); 
                border: 1px solid #0f9b8e; 
                border-radius: 8px; 
                color: white; 
                cursor: pointer;
                transition: all 0.3s ease;
            " onmouseover="this.style.background='rgba(15,155,142,0.3)'" onmouseout="this.style.background='rgba(15,155,142,0.2)'">
                Try Again
            </button>
        </div>
    `;
}

// ============================================
// CLEANUP
// ============================================

function cleanup() {
    // Clear all timers
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
    
    // Destroy all charts
    Object.keys(AppState.charts).forEach(coinId => {
        destroyChart(coinId);
    });
    
    console.log('Crypto Dashboard cleaned up successfully');
}