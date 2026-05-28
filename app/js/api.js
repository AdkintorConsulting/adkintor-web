// ============================================
// ADKINTOR - Capa de Comunicación API
// ============================================

const API = {
    /**
     * Llama a cualquier API a través del proxy
     * @param {string} targetUrl - URL de la API destino (Google Apps Script)
     * @param {string} action - Acción a ejecutar
     * @param {object} data - Datos adicionales
     * @returns {Promise} - Respuesta de la API
     */
    async call(targetUrl, action, data = {}) {
        const payload = {
            action: action,
            ...data
        };
        
        try {
            const response = await fetch(ADKINTOR_CONFIG.proxyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    targetUrl: targetUrl,
                    payload: payload
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.status === 'error') {
                throw new Error(result.message || 'Error en la API');
            }
            
            return result;
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    },
    
    /**
     * Login de usuario
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña
     * @param {string} apiUrl - URL de la API de INTELLIGENCE
     * @returns {Promise} - Datos del usuario
     */
    async login(email, password, apiUrl) {
        return await this.call(apiUrl, 'web_login', {
            email: email,
            password: password
        });
    }
};
