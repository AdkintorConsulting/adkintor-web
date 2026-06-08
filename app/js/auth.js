// ============================================
// ADKINTOR AUTH MODULE - VERSIÓN 2 (OPCIÓN B)
// ============================================
// Cambios: Usa dominio del email para buscar cliente en Master
// Fecha: 2026-06-08

(function() {
    if (window.__ADKINTOR_AUTH_LOADED__) {
        console.log('Auth already loaded, skipping');
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
                        console.log('Session expired');
                        this.logout();
                    }
                } catch(e) {
                    console.error('Error parsing session:', e);
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
        
        logout: function() {
            localStorage.removeItem('adkintor_session');
            this.session = null;
            window.location.href = '/app/index.html';
        },
        
        login: async function(email, password) {
            try {
                // Extract domain from email (Opción B)
                const emailDomain = email.split('@')[1];
                if (!emailDomain) {
                    return { success: false, error: 'Invalid email format' };
                }
                
                console.log('1. Looking for client with domain:', emailDomain);
                
                // Call Master API with domain as client_id
                const masterResponse = await this.callMasterAPI(emailDomain);
                console.log('Master response:', masterResponse);
                
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
                
                console.log('2. Calling Intelligence API for:', clientName);
                
                // Call Intelligence API to validate credentials
                const clientResponse = await this.callClientAPI(intelligenceApiUrl, email, password);
                console.log('Intelligence response:', clientResponse);
                
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
                
                // Build session data
                const sessionData = {
                    email: email,
                    role: clientResponse.data?.role || 'VIEWER',
                    clientId: clientResponse.data?.client_id || emailDomain.replace(/\./g, '_').toUpperCase(),
                    clientName: clientName,
                    userName: clientResponse.data?.user_name || clientResponse.data?.name || email.split('@')[0],
                    language: clientResponse.data?.language || 'en',
                    intelligenceApiUrl: intelligenceApiUrl,
                    eamsApiUrl: eamsApiUrl || null,
                    timestamp: Date.now()
                };
                
                // Save to localStorage
                localStorage.setItem('adkintor_session', JSON.stringify(sessionData));
                this.session = sessionData;
                console.log('3. Login successful, session saved for:', sessionData.userName);
                return { success: true };
                
            } catch (error) {
                console.error('Login error:', error);
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
                    payload: { action: 'web_login', email: email, password: password }
                })
            });
            return await response.json();
        }
    };
    
    window.Auth = Auth;
    Auth.init();
})();
