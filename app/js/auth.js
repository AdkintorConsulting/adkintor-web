// ============================================
// ADKINTOR AUTH MODULE - CORREGIDO (versión 2)
// ============================================

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
                console.log('1. Calling Master API...');
                const masterResponse = await this.callMasterAPI(email, password);
                console.log('Master response:', masterResponse);
                
                // Validar respuesta del Master API
                if (!masterResponse || masterResponse.status !== 'success') {
                    const errorMsg = masterResponse?.message || 'Master authentication failed';
                    return { success: false, error: errorMsg };
                }
                
                const intelligenceApiUrl = masterResponse.data.api_url;
                const eamsApiUrl = masterResponse.data.eams_api_url;
                const clientName = masterResponse.data.client_name;
                
                if (!intelligenceApiUrl) {
                    return { success: false, error: 'No API URL found for this client' };
                }
                
                console.log('2. Calling Intelligence API...');
                const clientResponse = await this.callClientAPI(intelligenceApiUrl, email, password);
                console.log('Intelligence response:', clientResponse);
                
                // CORREGIDO: Intelligence API devuelve { success: true, data: {...} }
                // No usa 'status', usa 'success' directamente
                if (!clientResponse || !clientResponse.success) {
                    const errorMsg = clientResponse?.error || 'Client authentication failed';
                    return { success: false, error: errorMsg };
                }
                
                // Guardar sesión
                const sessionData = {
                    email: email,
                    role: clientResponse.data?.role || 'client',
                    clientId: clientResponse.data?.client_id || clientName.replace(/\s/g, '_').toUpperCase(),
                    clientName: clientName,
                    name: clientResponse.data?.name || email.split('@')[0],
                    language: clientResponse.data?.language || 'en',
                    intelligenceApiUrl: intelligenceApiUrl,
                    eamsApiUrl: eamsApiUrl || null,
                    timestamp: Date.now()
                };
                
                localStorage.setItem('adkintor_session', JSON.stringify(sessionData));
                this.session = sessionData;
                console.log('3. Login successful, session saved');
                return { success: true };
                
            } catch (error) {
                console.error('Login error:', error);
                return { success: false, error: error.message || 'Connection error' };
            }
        },
        
        callMasterAPI: async function(email, password) {
            const response = await fetch(window.ADKINTOR_CONFIG.PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUrl: window.ADKINTOR_CONFIG.MASTER_API_URL,
                    payload: { action: 'web_login_master', email: email, password: password }
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
