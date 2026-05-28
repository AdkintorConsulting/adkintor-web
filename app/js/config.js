// ============================================
// ADKINTOR - Configuración Central
// ============================================

const ADKINTOR_CONFIG = {
    // URL del proxy (único punto de entrada)
    proxyUrl: 'https://adkintor-proxy.empty-bonus-1852.workers.dev/',
    
    // URLs de las APIs por cliente (se completan después del login)
    // Por ahora, solo la URL del DEMO que acabamos de probar
    intelligenceApiUrl: 'https://script.google.com/macros/s/AKfycbxU3Ez1mXbMLp8mWQ4KVX-7huiWRiMn0EjVaQ8fBrk1lCBgLZ_D1L0qm8s0HRYeF-Jh/exec',
    
    // Duración de sesión (7 días en milisegundos)
    sessionDuration: 7 * 24 * 60 * 60 * 1000
};
