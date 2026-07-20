/**
 * ============================================
 * CONFIG MODULE - ADKINTOR WEB APP
 * ============================================
 * VERSIÓN: 1.0.0
 * FECHA: 2026-07-20
 * 
 * Configuración global de la aplicación:
 * - Proxy URL (Cloudflare Worker)
 * - Master API URL
 * - Session duration
 * - Versión dinámica desde API
 * ============================================
 */

(function() {
    // Versión por defecto (fallback)
    let version = '1.0.0';
    
    // Intentar obtener la versión desde la API
    try {
        const session = JSON.parse(localStorage.getItem('adkintor_session'));
        if (session && session.eamsApiUrl) {
            fetch(window.ADKINTOR_CONFIG?.PROXY_URL || 'https://adkintor-proxy.empty-bonus-1852.workers.dev/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUrl: session.eamsApiUrl,
                    payload: { action: 'getVersionInfo', args: [] }
                })
            })
            .then(r => r.json())
            .then(result => {
                if (result.success && result.data && result.data.fullVersion) {
                    const newVersion = 'v' + result.data.fullVersion;
                    window.ADKINTOR_CONFIG.VERSION = newVersion;
                    
                    // Actualizar todos los iframes abiertos
                    document.querySelectorAll('iframe').forEach(iframe => {
                        try {
                            iframe.contentWindow.postMessage({
                                type: 'SET_VERSION',
                                version: newVersion
                            }, '*');
                        } catch(e) {}
                    });
                }
            })
            //.catch(err => console.warn('Error obteniendo versión:', err));
        }
    } catch(e) {
        //console.warn('Error al obtener versión:', e);
    }
    
    window.ADKINTOR_CONFIG = {
        // Proxy URL (Cloudflare Worker)
        PROXY_URL: 'https://adkintor-proxy.empty-bonus-1852.workers.dev/',
        
        // Master API URL (directorio de clientes)
        MASTER_API_URL: 'https://script.google.com/macros/s/AKfycbxuJeudi7nsxHPDcV3J8qJhpsbYESLtcQ_40RrFAVcg5icF4-axgSju3tm77QNWhBaefg/exec',
        
        // Session duration in milliseconds (8 hours)
        SESSION_DURATION: 8 * 60 * 60 * 1000,
        
        // App version (actualizado dinámicamente)
        VERSION: version,
        
        // ✅ AÑADIR ESTA LÍNEA (usuario por defecto cuando no hay sesión)
        DEFAULT_USER_EMAIL: 'system'
    };
    
    //console.log('ADKINTOR_CONFIG loaded');
})();
