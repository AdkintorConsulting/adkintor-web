// ============================================
// ADKINTOR - Capa de Comunicación API
// ============================================

const API = {
    /**
     * Llama a cualquier API a través del proxy
     * @param {string} targetUrl - URL de la API destino
     * @param {string} action - Acción a ejecutar
     * @param {object} data - Datos adicionales
     * @returns {Promise}
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
     * Login contra la MASTER API (para saber qué cliente es)
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña
     * @returns {Promise}
     */
    async masterLogin(email, password) {
        return await this.call(ADKINTOR_CONFIG.masterApiUrl, 'web_login_master', {
            email: email,
            password: password
        });
    },
    
    /**
     * Login contra la API específica del cliente (validación final)
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña
     * @param {string} apiUrl - URL de la API del cliente
     * @returns {Promise}
     */
    async clientLogin(email, password, apiUrl) {
        return await this.call(apiUrl, 'web_login', {
            email: email,
            password: password
        });
    }
};
