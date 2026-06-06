// ============================================
// ADKINTOR AUTH MODULE
// ============================================

(function() {
    // Prevent double execution
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
                    // Check if session is expired
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
        
        // Login function - 2 steps
        login: async function(email, password) {
            try {
                // Step 1: Call Master API to get client info
                const masterResponse = await this.callMasterAPI(email, password);
                
                if (!masterResponse.success) {
                    return { success: false, error: masterResponse.error };
                }
                
                const { client_name, api_url: intelligenceApiUrl, eams_api_url: eamsApiUrl } = masterResponse.data;
                
                // Step 2: Call Client API to validate credentials
                const clientResponse = await this.callClientAPI(api_url, email, password);
                
                if (!clientResponse.success) {
                    return { success: false, error: clientResponse.error };
                }
                
                // Step 3: Save session
                const sessionData = {
                    email: email,
                    role: clientResponse.data.role || 'client',
                    clientId: clientResponse.data.client_id || client_name.replace(/\s/g, '_').toUpperCase(),
                    clientName: client_name,
                    name: clientResponse.data.name || email.split('@')[0],
                    language: clientResponse.data.language || 'en',
                    intelligenceApiUrl: api_url,
                    eamsApiUrl: eamsApiUrl || null,
                    timestamp: Date.now()
                };
                
                localStorage.setItem('adkintor_session', JSON.stringify(sessionData));
                this.session = sessionData;
                
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
                    payload: {
                        action: 'web_login_master',
                        args: [email, password]
                    }
                })
            });
            
            const result = await response.json();
            return result;
        },
        
        callClientAPI: async function(apiUrl, email, password) {
            const response = await fetch(window.ADKINTOR_CONFIG.PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUrl: apiUrl,
                    payload: {
                        action: 'web_login',
                        args: [email, password]
                    }
                })
            });
            
            const result = await response.json();
            return result;
        }
    };
    
    window.Auth = Auth;
    Auth.init();
})();
