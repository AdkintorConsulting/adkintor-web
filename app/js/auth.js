/**
 * ============================================
 * AUTH MODULE - ADKINTOR WEB APP
 * ============================================
 * VERSIÓN: 1.0.0
 * FECHA: 2026-07-20
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
                const masterResponse = await this.callMasterAPI(emailDomain);
                
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
        
        callMasterAPI: async function(clientId) {
            // Master API now receives client_id (domain) instead of email/password
            const response = await fetch(window.ADKINTOR_CONFIG.PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUrl: window.ADKINTOR_CONFIG.MASTER_API_URL,
                    payload: { action: 'web_login_master', client_id: clientId }
                })
            });
            return await response.json();
        },
        
        callClientAPI: async function(apiUrl, email, password) {
            const response = await fetch(window.ADKINTOR_CONFIG.PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUrl: apiUrl,
                    payload: { 
                        action: 'web_login', 
                        email: email, 
                        password: password,
                        userEmail: email  // ✅ AÑADIR ESTA LÍNEA
                    }
                })
            });
            return await response.json();
        }
    };
    
    window.Auth = Auth;
    Auth.init();
})();
