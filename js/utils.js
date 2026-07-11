// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatPrice(price) {
    if (!price && price !== 0) {
        return '0.00';
    }

    if (price >= 1) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(price);
    }

    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 8
    }).format(price);
}

function formatLargeNumber(num) {
    if (!num && num !== 0) {
        return '0';
    }

    if (num >= 1e12) {
        return (num / 1e12).toFixed(2) + 'T';
    }

    if (num >= 1e9) {
        return (num / 1e9).toFixed(2) + 'B';
    }

    if (num >= 1e6) {
        return (num / 1e6).toFixed(2) + 'M';
    }

    if (num >= 1e3) {
        return (num / 1e3).toFixed(2) + 'K';
    }

    return formatPrice(num);
}

function updateCountdown(seconds) {
    if (!DOM.countdown) {
        return;
    }

    DOM.countdown.textContent = `${Math.max(seconds, 0)}s`;
}

function generateMockChartData(days = CONFIG.MOCK_CHART_DAYS) {
    const data = [];
    let price = 50000;
    const now = new Date();

    for (let i = days; i > 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        price = price * (1 + (Math.random() * 0.1 - 0.05));

        data.push({
            time: date.toLocaleDateString(),
            value: price
        });
    }

    return data;
}