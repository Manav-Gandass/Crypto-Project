// ============================================
// UI RENDERING
// ============================================

function renderCryptoCards(
    marketData,
    chartsData = {},
    includeCharts = true
) {
    const container = DOM.cryptoGrid;

    if (!container) {
        return;
    }

    // Full render
    if (includeCharts) {
        container.textContent = '';
    }

    const fragment = document.createDocumentFragment();

    for (const coin of marketData) {
        const change = coin.price_change_percentage_24h;

        const changeClass =
            change >= 0
                ? 'change-positive'
                : 'change-negative';

        const changeSign =
            change >= 0
                ? '+'
                : '';

        const symbol =
            CONFIG.CURRENCY_SYMBOLS[
                AppState.currentCurrency
            ];

        const existingCard =
            document.getElementById(
                `card-${coin.id}`
            );

        // -------------------------------
        // Background refresh
        // -------------------------------
        if (!includeCharts && existingCard) {

            const priceElement =
                existingCard.querySelector(
                    '.current-price'
                );

            if (priceElement) {
                priceElement.textContent =
                    `${symbol}${formatPrice(
                        coin.current_price
                    )}`;
            }

            const changeElement =
                existingCard.querySelectorAll(
                    '.price-value'
                )[1];

            if (changeElement) {

                changeElement.className =
                    `price-value ${changeClass}`;

                changeElement.textContent =
                    `${changeSign}${change.toFixed(2)}%`;
            }

            continue;
        }

        // -------------------------------
        // Create Card
        // -------------------------------

        const card =
            document.createElement('div');

        card.className = 'crypto-card';
        card.id = `card-${coin.id}`;

        card.innerHTML = `
            <div class="card-header">

                <img
                    src="${coin.image}"
                    alt="${coin.name}"
                    class="coin-logo"
                >

                <div class="coin-info">

                    <h3>
                        ${coin.name}
                    </h3>

                    <span class="coin-symbol">
                        ${coin.symbol.toUpperCase()}
                    </span>

                </div>

            </div>

            <div class="price-section">

                <div class="price-item">

                    <div class="price-label">
                        Current Price
                    </div>

                    <div class="price-value current-price">
                        ${symbol}${formatPrice(
                            coin.current_price
                        )}
                    </div>

                </div>

                <div class="price-item">

                    <div class="price-label">
                        24h Change
                    </div>

                    <div class="price-value ${changeClass}">
                        ${changeSign}${change.toFixed(2)}%
                    </div>

                </div>

            </div>

            <div class="chart-container">
                <canvas id="chart-${coin.id}"></canvas>
            </div>
        `;

        fragment.appendChild(card);
    }

    container.appendChild(fragment);

    // -------------------------------
    // Draw Charts
    // -------------------------------

    if (includeCharts) {

        for (const coin of marketData) {

            if (
                chartsData[coin.id] &&
                chartsData[coin.id].length
            ) {

                const normalized =
                    chartsData[coin.id].map(
                        point => [
                            new Date(point.time).getTime(),
                            point.value
                        ]
                    );

                createChart(
                    coin.id,
                    normalized
                );
            }
        }
    }
}
// ============================================
// UI STATES
// ============================================

function showLoading(
    message = 'Loading cryptocurrency data...'
) {

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

            <h3>
                ⚠️ Error
            </h3>

            <p>
                ${message}
            </p>

            <button
                onclick="loadCryptocurrencies()"

                style="
                    margin-top:15px;
                    padding:10px 20px;
                    background:rgba(15,155,142,0.2);
                    border:1px solid #0f9b8e;
                    border-radius:8px;
                    color:white;
                    cursor:pointer;
                    transition:all .3s ease;
                "

                onmouseover="
                    this.style.background='rgba(15,155,142,.3)'
                "

                onmouseout="
                    this.style.background='rgba(15,155,142,.2)'
                "

            >
                Try Again
            </button>

        </div>
    `;
}