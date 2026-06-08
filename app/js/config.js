// ============================================
// ADKINTOR CONFIGURATION
// ============================================

(function() {
    window.ADKINTOR_CONFIG = {
        // Proxy URL (Cloudflare Worker)
        PROXY_URL: 'https://adkintor-proxy.empty-bonus-1852.workers.dev/',
        
        // Master API URL (directorio de clientes)
        MASTER_API_URL: 'https://script.google.com/macros/s/AKfycbxuJeudi7nsxHPDcV3J8qJhpsbYESLtcQ_40RrFAVcg5icF4-axgSju3tm77QNWhBaefg/exec',
        
        // Session duration in milliseconds (7 days)
        SESSION_DURATION: 7 * 24 * 60 * 60 * 1000,
        
        // App version
        VERSION: '1.0.0'
    };
    
    console.log('ADKINTOR_CONFIG loaded');
})();
