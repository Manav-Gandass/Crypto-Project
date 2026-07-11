// ============================================
// CHART MANAGEMENT
// ============================================

function createChart(coinId, priceData) {
    const canvas = document.getElementById(`chart-${coinId}`);

    if (!canvas || !Array.isArray(priceData) || priceData.length === 0) {
        return;
    }

    const ctx = canvas.getContext('2d');

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

    const trendColor =
        prices[prices.length - 1] >= prices[0]
            ? '#4ade80'
            : '#f87171';

    // Update existing chart
    if (AppState.charts[coinId]) {
        const chart = AppState.charts[coinId];

        chart.data.labels = labels;
        chart.data.datasets[0].data = prices;
        chart.data.datasets[0].borderColor = trendColor;
        chart.data.datasets[0].backgroundColor = `${trendColor}15`;

        chart.options.plugins.tooltip.borderColor = trendColor;

        chart.update('none');
        return;
    }

    // Create new chart
    AppState.charts[coinId] = new Chart(ctx, {
        type: 'line',

        data: {
            labels,

            datasets: [
                {
                    data: prices,
                    borderColor: trendColor,
                    backgroundColor: `${trendColor}15`,
                    borderWidth: 2,
                    fill: true,
                    tension: 0,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: trendColor,
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: trendColor,
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false,

                    callbacks: {
                        label(context) {
                            return (
                                CONFIG.CURRENCY_SYMBOLS[
                                    AppState.currentCurrency
                                ] +
                                formatPrice(context.parsed.y)
                            );
                        }
                    }
                }
            },

            scales: {
                x: {
                    grid: {
                        color: 'rgba(255,255,255,0.1)',
                        drawBorder: false
                    },

                    ticks: {
                        color: 'rgba(255,255,255,0.7)',
                        maxTicksLimit: 4,
                        font: {
                            size: 11
                        }
                    }
                },

                y: {
                    grid: {
                        color: 'rgba(255,255,255,0.1)',
                        drawBorder: false
                    },

                    ticks: {
                        color: 'rgba(255,255,255,0.7)',

                        font: {
                            size: 11
                        },

                        callback(value) {
                            return (
                                CONFIG.CURRENCY_SYMBOLS[
                                    AppState.currentCurrency
                                ] +
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
                duration: CONFIG.CHART_ANIMATION_DURATION,
                easing: 'easeInOutQuart'
            }
        }
    });
}

function createEmptyChart(coinId) {
    const canvas = document.getElementById(`chart-${coinId}`);

    if (!canvas) {
        return;
    }

    destroyChart(coinId);

    const ctx = canvas.getContext('2d');

    AppState.charts[coinId] = new Chart(ctx, {
        type: 'line',

        data: {
            labels: ['No Data'],

            datasets: [
                {
                    data: [0],
                    borderColor: 'rgba(255,255,255,0.3)',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                }
            },

            scales: {
                x: {
                    display: false
                },

                y: {
                    display: false
                }
            }
        }
    });
}

function destroyChart(coinId) {
    if (!AppState.charts[coinId]) {
        return;
    }

    AppState.charts[coinId].destroy();
    delete AppState.charts[coinId];
}