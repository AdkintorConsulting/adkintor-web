/**
 * ============================================
 * AUTH MODULE - ADKINTOR WEB APP
 * ============================================
 * VERSIÓN: 1.0.0
 * FECHA: 2026-09-22
 * 
 * Gestión de autenticación y sesión:
 * - Login con dominio de email (Opción B)
 * - Session management (localStorage)
 * - Logout y limpieza de sesión
 * ============================================
 */

(function() {
    if (window.__ADKINTOR_AUTH_LOADED__) {
        return;
    }
    window.__ADKINTOR_AUTH_LOADED__ = true;
    
    // ============================================
    // DEBUG FLAG - Solo para diagnóstico
    // false = consola limpia (producción)
    // true  = logs en consola (cuando estemos diagnosticando)
    // ============================================
    window.ADKINTOR_AUTH_DEBUG = window.ADKINTOR_AUTH_DEBUG || false;
    const _dbg = (...args) => { if (window.ADKINTOR_AUTH_DEBUG) console.log(...args); };
    const _dbgErr = (...args) => { if (window.ADKINTOR_AUTH_DEBUG) console.error(...args); };
    // ============================================
    
    // ============================================
    // FETCH CON RETRY + TIMEOUT - Mitiga cold starts de Apps Script
    // ============================================
    /**
     * Hace un fetch POST al proxy y devuelve el JSON parseado.
     * - Timeout explícito por intento (AbortController)
     * - Reintenta si: timeout, HTTP >= 400, non-JSON, network error
     * 
     * @param {string} proxyUrl - URL del Cloudflare Worker
     * @param {object} body - Cuerpo del POST
     * @param {object} opts - { retries, baseDelayMs, label, timeoutMs }
     * @returns {Promise<{ok, data, httpStatus, ms, attempts, rawSnippet, error}>}
     */
    async function _fetchJsonWithRetry(proxyUrl, body, opts = {}) {
        const retries = (typeof opts.retries === 'number') ? opts.retries : 2;
        const baseDelayMs = (typeof opts.baseDelayMs === 'number') ? opts.baseDelayMs : 800;
        const timeoutMs = (typeof opts.timeoutMs === 'number') ? opts.timeoutMs : 12000;
        const label = opts.label || 'fetch';
        const t0 = Date.now();
        let lastRaw = '';
        let lastStatus = 0;
        let lastError = '';
        
        for (let attempt = 0; attempt <= retries; attempt++) {
            if (attempt > 0) {
                const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 300;
                _dbg(`[${label}] retry ${attempt}/${retries} in ${Math.round(delay)}ms`);
                await new Promise(r => setTimeout(r, delay));
            }
            
            // ✅ AbortController para timeout explícito
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            
            try {
                const res = await fetch(proxyUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                lastStatus = res.status;
                
                const raw = await res.text();
                lastRaw = raw;
                
                // Si HTTP >= 400, es un fallo recuperable (incluso si el JSON es válido)
                if (res.status >= 400) {
                    _dbgErr(`[${label}] attempt ${attempt + 1}: HTTP ${res.status} (recoverable)`);
                    lastError = 'http_' + res.status;
                    continue;
                }
                
                try {
                    const data = JSON.parse(raw);
                    return {
                        ok: true,
                        data: data,
                        httpStatus: res.status,
                        ms: Date.now() - t0,
                        attempts: attempt + 1,
                        rawSnippet: ''
                    };
                } catch (parseErr) {
                    _dbgErr(`[${label}] attempt ${attempt + 1}: non-JSON response (HTTP ${res.status})`);
                    lastError = 'non_json';
                    continue;
                }
            } catch (netErr) {
                clearTimeout(timeoutId);
                const isAbort = (netErr.name === 'AbortError');
                if (isAbort) {
                    _dbgErr(`[${label}] attempt ${attempt + 1}: timeout after ${timeoutMs}ms (recoverable)`);
                    lastError = 'timeout_' + timeoutMs + 'ms';
                } else {
                    _dbgErr(`[${label}] attempt ${attempt + 1}: network error: ${netErr.message}`);
                    lastError = 'network: ' + netErr.message;
                }
                continue;
            }
        }
        
        return {
            ok: false,
            data: null,
            httpStatus: lastStatus,
            ms: Date.now() - t0,
            attempts: retries + 1,
            error: lastError,
            rawSnippet: lastRaw.substring(0, 500)
        };
    }
    // ============================================
    
    const Auth = {
        session: null,
        
        init: function() {
            this.loadSession();
            return this;
        },
        
        loadSession: function() {
            const sessionData = localStorage.getItem('adkintor_session');
            if (sessionData) {
                try {
                    this.session = JSON.parse(sessionData);
                    // Check session expiration
                    if (this.session.timestamp && (Date.now() - this.session.timestamp) > window.ADKINTOR_CONFIG.SESSION_DURATION) {
                        this.logout();
                    }
                } catch(e) {
                    this.session = null;
                }
            }
            return this.session;
        },
        
        isLoggedIn: function() {
            this.loadSession();
            return this.session !== null;
        },
        
        getSession: function() {
            return this.session || this.loadSession();
        },
        
        logout: async function() {
            // ============================================
            // NUEVO: REGISTRAR LOG DE LOGOUT
            // ============================================
            const email = this.session ? this.session.email : null;
            
            if (email && window.Logger && typeof window.Logger.logout === 'function') {
                try {
                    await window.Logger.logout(email);
                } catch(err) {
                    //console.warn('[Auth] Logout log failed (non-critical):', err);
                }
            }
            // ============================================
            
            localStorage.removeItem('adkintor_session');
            this.session = null;
            window.location.replace('/app/index.html');
        },
        
        login: async function(email, password) {
            try {
                // Extract domain from email (Opción B)
                const emailDomain = email.split('@')[1];
                if (!emailDomain) {
                    return { success: false, error: 'Invalid email format' };
                }
                
                // Call Master API with domain as client_id
                const masterResponse = await this.callMasterAPI(emailDomain, email);
                
                // Validate Master API response
                if (!masterResponse || masterResponse.status !== 'success') {
                    const errorMsg = masterResponse?.message || 'Client not found. Please contact your administrator.';
                    return { success: false, error: errorMsg };
                }
                
                const intelligenceApiUrl = masterResponse.data.api_url;
                const eamsApiUrl = masterResponse.data.eams_api_url;
                const clientName = masterResponse.data.client_name;
                
                if (!intelligenceApiUrl) {
                    return { success: false, error: 'No API URL found for this client' };
                }
                
          
                // Call Intelligence API to validate credentials
                const clientResponse = await this.callClientAPI(intelligenceApiUrl, email, password);
                
                // Intelligence API returns { success: true, data: {...} }
                // Verificar si data tiene status 'error'
                if (!clientResponse || !clientResponse.success) {
                    const errorMsg = clientResponse?.error || 'Invalid email or password';
                    return { success: false, error: errorMsg };
                }
                
                // IMPORTANTE: Verificar si la API devolvió un error en data.status
                if (clientResponse.data && clientResponse.data.status === 'error') {
                    const errorMsg = clientResponse.data.message || 'Invalid email or password';
                    return { success: false, error: errorMsg };
                }
                
                // Intelligence API devuelve { success: true, data: { status: 'success', data: { ... } } }
                // Extraer los datos reales
                const responseData = clientResponse.data?.data || clientResponse.data;

                // Build session data
                const sessionData = {
                    email: email,
                    userEmail: email,  // ✅ AÑADIR ESTA LÍNEA (para consistencia)
                    role: responseData?.role || 'VIEWER',
                    clientId: responseData?.client_id || emailDomain.replace(/\./g, '_').toUpperCase(),
                    clientName: clientName,
                    userName: responseData?.name || email.split('@')[0],
                    language: responseData?.language || 'en',
                    intelligenceApiUrl: intelligenceApiUrl,
                    eamsApiUrl: eamsApiUrl || null,
                    timestamp: Date.now()
                };
                
                // Save to localStorage
                localStorage.setItem('adkintor_session', JSON.stringify(sessionData));
                this.session = sessionData;

                // ============================================
                // NUEVO: REGISTRAR LOG DE LOGIN (no bloqueante)
                // ============================================
                if (window.Logger && typeof window.Logger.login === 'function') {
                    window.Logger.login(email, sessionData.role).catch(err => {
                      //console.warn('[Auth] Login log failed (non-critical):', err);
                    });
                } else {
                    //console.warn('[Auth] Logger not available, skipping login log');
                }
                // ============================================
                
                return { success: true };
                
            } catch (error) {
                return { success: false, error: error.message || 'Connection error. Please try again.' };
            }
        },
        
        callMasterAPI: async function(clientId, email) {
            // Master API now receives client_id (domain) instead of email/password
            _dbg('[Auth] ▶ MASTER call', { clientId, email });
            
            const result = await _fetchJsonWithRetry(
                window.ADKINTOR_CONFIG.PROXY_URL,
                {
                    targetUrl: window.ADKINTOR_CONFIG.MASTER_API_URL,
                    payload: {
                        action: 'web_login_master',
                        client_id: clientId,
                        email: email || '',
                        userAgent: navigator.userAgent || ''
                    }
                },
                { retries: 2, baseDelayMs: 800, label: 'MASTER', timeoutMs: 12000 }
            );
            
            _dbg('[Auth] ◀ MASTER result', {
                ok: result.ok,
                ms: result.ms,
                attempts: result.attempts,
                httpStatus: result.httpStatus,
                data: result.data,
                error: result.error
            });
            
            if (!result.ok) {
                return {
                    status: 'error',
                    message: 'Connection error. Please try again.',
                    _stage: 'master',
                    _detail: result.error
                };
            }
            
            return result.data;
        },
        
        callClientAPI: async function(apiUrl, email, password) {
            _dbg('[Auth] ▶ CLIENT call', { apiUrl, email });
            
            const result = await _fetchJsonWithRetry(
                window.ADKINTOR_CONFIG.PROXY_URL,
                {
                    targetUrl: apiUrl,
                    payload: {
                        action: 'web_login',
                        email: email,
                        password: password,
                        userEmail: email,
                        userAgent: navigator.userAgent || ''
                    }
                },
                { retries: 2, baseDelayMs: 800, label: 'CLIENT', timeoutMs: 12000 }
            );
            
            _dbg('[Auth] ◀ CLIENT result', {
                ok: result.ok,
                ms: result.ms,
                attempts: result.attempts,
                httpStatus: result.httpStatus,
                data: result.data,
                error: result.error
            });
            
            if (!result.ok) {
                return {
                    success: false,
                    error: 'Connection error. Please try again.',
                    _stage: 'client',
                    _detail: result.error
                };
            }
            
            return result.data;
        }
    };
    
    window.Auth = Auth;
    Auth.init();
})();
