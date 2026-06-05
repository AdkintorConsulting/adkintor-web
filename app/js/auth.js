// ============================================
// ADKINTOR AUTH MODULE - Single execution guard
// ============================================

(function() {
    // Prevent double execution
    if (window.__ADKINTOR_AUTH_LOADED__) {
        console.log('Auth already loaded, skipping');
        return;
    }
    window.__ADKINTOR_AUTH_LOADED__ = true;
    
    // ============================================
    // AUTH CONFIGURATION
    // ============================================
    
    const Auth = {
        // Store session data
        session: null,
        
        // Initialize auth module
        init: function() {
            this.loadSession();
            return this;
        },
        
        // Load session from localStorage
        loadSession: function() {
            const sessionData = localStorage.getItem('adkintor_session');
            if (sessionData) {
                try {
                    this.session = JSON.parse(sessionData);
                } catch(e) {
                    console.error('Error parsing session:', e);
                    this.session = null;
                }
            }
            return this.session;
        },
        
        // Check if user is logged in
        isLoggedIn: function() {
            this.loadSession();
            return this.session !== null;
        },
        
        // Get session data
        getSession: function() {
            return this.session || this.loadSession();
        },
        
        // Logout user
        logout: function() {
            localStorage.removeItem('adkintor_session');
            this.session = null;
            window.location.href = '/app/index.html';
        }
    };
    
    // Make Auth globally available
    window.Auth = Auth;
    
    // Auto-initialize
    Auth.init();
})();
