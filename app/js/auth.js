// ============================================
// ADKINTOR - Autenticación y Sesión
// ============================================

const Auth = {
    /**
     * Inicia sesión (flujo de dos pasos)
     * 1. Consulta a Master API para saber qué cliente
     * 2. Consulta a la API del cliente para validar credenciales
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña
     * @returns {Promise}
     */
    async login(email, password) {
        try {
            // PASO 1: Master API - ¿quién es este usuario?
            const masterResult = await API.masterLogin(email, password);
            
            if (masterResult.status !== 'success') {
                return { success: false, error: masterResult.message };
            }
            
            const clientApiUrl = masterResult.data.api_url;
            
            if (!clientApiUrl) {
                return { success: false, error: 'No se encontró API para este cliente' };
            }
            
            // PASO 2: API del cliente - validar credenciales
            const clientResult = await API.clientLogin(email, password, clientApiUrl);
            
            if (clientResult.status !== 'success') {
                return { success: false, error: clientResult.message };
            }
            
            const userData = clientResult.data;
            
            // Guardar sesión
            const session = {
                email: userData.email,
                role: userData.role,
                clientId: userData.client_id,
                clientName: masterResult.data.client_name,
                name: userData.name,
                language: userData.language || 'en',
                intelligenceApiUrl: clientApiUrl,
                timestamp: Date.now()
            };
            
            localStorage.setItem('adkintor_session', JSON.stringify(session));
            
            return { success: true, session: session };
            
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Verifica si hay una sesión activa
     * @returns {object|null}
     */
    getSession() {
        const sessionStr = localStorage.getItem('adkintor_session');
        if (!sessionStr) return null;
        
        try {
            const session = JSON.parse(sessionStr);
            const now = Date.now();
            const age = now - session.timestamp;
            
            if (age > ADKINTOR_CONFIG.sessionDuration) {
                this.logout();
                return null;
            }
            
            return session;
        } catch (error) {
            console.error('Session parsing error:', error);
            return null;
        }
    },
    
    /**
     * Obtiene la URL de la API del cliente activo
     * @returns {string|null}
     */
    getClientApiUrl() {
        const session = this.getSession();
        return session ? session.intelligenceApiUrl : null;
    },
    
    /**
     * Cierra sesión
     */
    logout() {
        localStorage.removeItem('adkintor_session');
        window.location.href = 'index.html';
    },
    
    /**
     * Verifica si el usuario está autenticado
     * @returns {boolean}
     */
    isAuthenticated() {
        return this.getSession() !== null;
    },
    
    /**
     * Redirige a login si no está autenticado
     * @returns {boolean}
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    },
    
    /**
     * Obtiene el nombre del usuario
     * @returns {string}
     */
    getUserName() {
        const session = this.getSession();
        return session ? session.name : '';
    },
    
    /**
     * Obtiene el email del usuario
     * @returns {string}
     */
    getUserEmail() {
        const session = this.getSession();
        return session ? session.email : '';
    }
};
