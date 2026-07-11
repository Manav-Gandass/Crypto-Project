// ============================================
// APPLICATION ENTRY POINT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeDOM();

    setupEventListeners();

    loadCryptocurrencies();

    startAutoRefresh();
});