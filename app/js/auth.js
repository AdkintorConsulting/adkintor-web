// ============================================
// ADKINTOR - Autenticación y Sesión
// ============================================

const Auth = {
    /**
     * Inicia sesión
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña
     * @returns {Promise} - Resultado del login
     */
    async login(email, password) {
        try {
            // Usar la URL de INTELLIGENCE (DEMO por ahora)
            const apiUrl = ADKINTOR_CONFIG.intelligenceApiUrl;
            
            const response = await API.login(email, password, apiUrl);
            
            if (response.status === 'success') {
                const userData = response.data;
                
                // Guardar sesión
                const session = {
                    email: userData.email,
                    role: userData.role,
                    clientId: userData.client_id,
                    name: userData.name,
                    language: userData.language || 'en',
                    intelligenceApiUrl: apiUrl,
                    eamsApiUrl: userData.api_url || '',
                    timestamp: Date.now()
                };
                
                localStorage.setItem('adkintor_session', JSON.stringify(session));
                
                return { success: true, session: session };
            } else {
                return { success: false, error: response.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Verifica si hay una sesión activa
     * @returns {object|null} - Datos de sesión o null
     */
    getSession() {
        const sessionStr = localStorage.getItem('adkintor_session');
        if (!sessionStr) return null;
        
        try {
            const session = JSON.parse(sessionStr);
            const now = Date.now();
            const age = now - session.timestamp;
            
            // Verificar expiración (7 días)
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
