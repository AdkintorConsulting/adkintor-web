/**
 * ============================================
 * LOGGER MODULE - ADKINTOR WEB APP
 * ============================================
 * VERSIÓN: 1.0.0
 * FECHA: 2026-06-11
 * 
 * Centraliza todas las operaciones de logging hacia:
 * - EAMS: SYS_AUDIT_LOG y SYS_LOGS
 * - FORESIGHT: SYS_LOGS
 * ============================================
 */

const Logger = (function() {
    'use strict';
    
    // Configuración
    const CONFIG = {
        // Mapeo de acciones de la Web App a funciones de la API
        ACTION_TO_API_FUNCTION: {
            // Acciones de auditoría (EAMS SYS_AUDIT_LOG)
            'LOGIN': 'logCreate',
            'LOGOUT': 'logCreate',
            'CREATE_ASSET': 'logCreate',
            'MODIFY_ASSET': 'logModify',
            'DELETE_ASSET': 'logDelete',
            'CREATE_WO': 'logCreate',
            'MODIFY_WO': 'logModify',
            'CLOSE_WO': 'logClose',
            'APPROVE_WO': 'logApprove',
            'REJECT_WO': 'logReject',
            'LOCK_PLAN': 'logLock',
            'RELEASE_PLAN': 'logRelease',
            'RECEIVE_STOCK': 'logReceive',
            'CHANGE_STATUS': 'logChange'
        }
    };
    
    /**
     * Obtiene la sesión actual del localStorage
     */
    function getSession() {
        try {
            const sessionStr = localStorage.getItem('adkintor_session');
            if (!sessionStr) return null;
            return JSON.parse(sessionStr);
        } catch (e) {
            console.error('[Logger] Error getting session:', e);
            return null;
        }
    }
    
    /**
     * Obtiene la IP del cliente (aproximada mediante fetch)
     * Nota: Esto es opcional y no siempre funciona
     */
    async function getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (e) {
            return 'unknown';
        }
    }
    
    /**
     * Llama a la API de EAMS con la función de logging
     * @param {string} apiFunction - Nombre de la función (logCreate, logModify, etc.)
     * @param {Array} args - Argumentos para la función
     * @returns {Promise<boolean>} - true si éxito, false si falló
     */
    async function callEamsLogging(apiFunction, args) {
        const session = getSession();
        if (!session || !session.eamsApiUrl) {
            console.warn('[Logger] No session or EAMS API URL');
            return false;
        }
        
        try {
            const response = await fetch(window.PROXY_URL || 'https://adkintor-proxy.empty-bonus-1852.workers.dev/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUrl: session.eamsApiUrl,
                    payload: { action: apiFunction, args: args }
                })
            });
            
            const result = await response.json();
            
            if (result && result.success) {
                console.log(`[Logger] ${apiFunction} successful`);
                return true;
            } else {
                console.warn(`[Logger] ${apiFunction} failed:`, result?.error);
                return false;
            }
        } catch (error) {
            console.error(`[Logger] Error calling ${apiFunction}:`, error);
            return false;
        }
    }
    
    /**
     * Llama a la API de FORESIGHT para logging
     * @param {string} module - Módulo (KPI, WO, PVT, etc.)
     * @param {string} action - Acción realizada
     * @param {string} details - Detalles adicionales
     * @param {string} severity - Severidad (INFO, WARNING, ERROR)
     * @returns {Promise<boolean>}
     */
    async function callForesightLogging(module, action, details, severity = 'INFO') {
        const session = getSession();
        if (!session || !session.intelligenceApiUrl) {
            console.warn('[Logger] No session or Intelligence API URL');
            return false;
        }
        
        try {
            // FORESIGHT tiene una función logAction en sus helpers
            const response = await fetch(window.PROXY_URL || 'https://adkintor-proxy.empty-bonus-1852.workers.dev/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUrl: session.intelligenceApiUrl,
                    payload: { 
                        action: 'logAction', 
                        args: [module, action, details, severity, session.email] 
                    }
                })
            });
            
            const result = await response.json();
            return result && result.success;
        } catch (error) {
            console.error('[Logger] Foresight logging error:', error);
            return false;
        }
    }
    
    /**
     * Registra una acción de auditoría en EAMS (SYS_AUDIT_LOG)
     * @param {string} actionType - Tipo de acción (CREATE_ASSET, MODIFY_ASSET, etc.)
     * @param {string} module - Módulo (AST, WO, PVT, STK, CAL)
     * @param {string} entityId - ID de la entidad afectada
     * @param {string} field - Campo modificado (opcional)
     * @param {string} oldValue - Valor anterior (opcional)
     * @param {string} newValue - Valor nuevo (opcional)
     * @param {string} details - Detalles adicionales (opcional)
     * @returns {Promise<boolean>}
     */
    async function audit(actionType, module, entityId, field = '', oldValue = '', newValue = '', details = '') {
        const session = getSession();
        if (!session) return false;
        
        // Mapear actionType a función de API
        const apiFunction = CONFIG.ACTION_TO_API_FUNCTION[actionType] || 'logCreate';
        
        // Formato esperado por las funciones de logging de EAMS
        // Basado en la estructura: Timestamp | User Email | Action | Module | Entity ID | Field | Old Value | New Value | Details
        const args = [
            session.email,      // email del usuario
            actionType,         // acción (CREATE_ASSET, etc.)
            module,             // módulo (AST, WO, etc.)
            entityId,           // ID de la entidad
            field,              // campo modificado
            oldValue,           // valor anterior
            newValue,           // valor nuevo
            details             // detalles adicionales
        ];
        
        return await callEamsLogging(apiFunction, args);
    }
    
    /**
     * Registra un error en EAMS (SYS_LOGS)
     * @param {string} module - Módulo donde ocurrió el error
     * @param {string} action - Acción que falló
     * @param {string} errorMsg - Mensaje de error
     * @param {string} level - Nivel (ERROR, WARNING, INFO)
     * @returns {Promise<boolean>}
     */
    async function error(module, action, errorMsg, level = 'ERROR') {
        const session = getSession();
        const email = session ? session.email : 'unknown';
        
        // Usar logSystemError de EAMS
        return await callEamsLogging('logSystemError', [module, action, errorMsg, level, email]);
    }
    
    /**
     * Registra un evento en FORESIGHT (SYS_LOGS)
     * @param {string} module - Módulo (KPI, WO, PVT, STK, CAL)
     * @param {string} action - Acción realizada
     * @param {string} details - Detalles
     * @param {string} severity - Severidad (INFO, WARNING, ERROR)
     * @returns {Promise<boolean>}
     */
    async function foresight(module, action, details, severity = 'INFO') {
        return await callForesightLogging(module, action, details, severity);
    }
    
    /**
     * Registra el inicio de sesión de un usuario
     * @param {string} email - Email del usuario
     * @param {string} role - Rol del usuario
     * @returns {Promise<boolean>}
     */
    async function login(email, role) {
        const success = await audit('LOGIN', 'SYS', email, '', '', '', `Login exitoso - Rol: ${role}`);
        
        // También registrar en FORESIGHT
        await foresight('SECURITY', 'LOGIN', `Usuario ${email} inició sesión con rol ${role}`);
        
        return success;
    }
    
    /**
     * Registra el cierre de sesión
     * @param {string} email - Email del usuario
     * @returns {Promise<boolean>}
     */
    async function logout(email) {
        return await audit('LOGOUT', 'SYS', email, '', '', '', 'Cierre de sesión');
    }
    
    /**
     * Registra la creación de un activo
     * @param {string} assetId - ID del activo creado
     * @param {Object} assetData - Datos del activo
     * @returns {Promise<boolean>}
     */
    async function assetCreated(assetId, assetData) {
        const details = JSON.stringify({
            name: assetData.name || assetData.description,
            type: assetData.type,
            location: assetData.location,
            criticality: assetData.criticality
        });
        return await audit('CREATE_ASSET', 'AST', assetId, '', '', '', details);
    }
    
    /**
     * Registra la modificación de un activo
     * @param {string} assetId - ID del activo modificado
     * @param {Array} changes - Lista de cambios [{field, oldValue, newValue}]
     * @returns {Promise<boolean>}
     */
    async function assetModified(assetId, changes) {
        // Si hay múltiples cambios, registrar el más importante o todos
        if (changes.length === 1) {
            const change = changes[0];
            return await audit('MODIFY_ASSET', 'AST', assetId, change.field, change.oldValue, change.newValue, '');
        } else if (changes.length > 1) {
            // Registrar como cambio múltiple
            const details = JSON.stringify(changes);
            return await audit('MODIFY_ASSET', 'AST', assetId, 'Multiple', '', '', details);
        }
        return false;
    }
    
    /**
     * Registra la creación de una Orden de Trabajo
     * @param {string} woId - ID de la WO
     * @param {Object} woData - Datos de la WO
     * @returns {Promise<boolean>}
     */
    async function woCreated(woId, woData) {
        const details = JSON.stringify({
            assetId: woData.assetId,
            priority: woData.priority,
            type: woData.type
        });
        return await audit('CREATE_WO', 'WO', woId, '', '', '', details);
    }
    
    /**
     * Registra el cierre de una WO
     * @param {string} woId - ID de la WO
     * @param {string} resolution - Resolución
     * @returns {Promise<boolean>}
     */
    async function woClosed(woId, resolution) {
        return await audit('CLOSE_WO', 'WO', woId, 'Status', 'Open', 'Closed', resolution);
    }
    
    /**
     * Registra la aprobación de una WO
     * @param {string} woId - ID de la WO
     * @param {string} approvedBy - Quién aprobó
     * @returns {Promise<boolean>}
     */
    async function woApproved(woId, approvedBy) {
        return await audit('APPROVE_WO', 'WO', woId, 'Status', 'Pending', 'Approved', `Aprobada por ${approvedBy}`);
    }
    
    /**
     * Registra el rechazo de una WO
     * @param {string} woId - ID de la WO
     * @param {string} reason - Razón del rechazo
     * @returns {Promise<boolean>}
     */
    async function woRejected(woId, reason) {
        return await audit('REJECT_WO', 'WO', woId, 'Status', 'Pending', 'Rejected', reason);
    }
    
    // API pública
    return {
        // Genéricos
        audit,
        error,
        foresight,
        
        // Acciones específicas
        login,
        logout,
        assetCreated,
        assetModified,
        woCreated,
        woClosed,
        woApproved,
        woRejected,
        
        // Helper para try/catch automático
        async wrap(actionName, module, fn, context = {}) {
            try {
                const result = await fn();
                
                // Si es éxito y hay contexto de logging
                if (context.logSuccess) {
                    await this.audit(
                        context.actionType || 'EXECUTE',
                        module,
                        context.entityId || '',
                        '',
                        '',
                        '',
                        context.logSuccess
                    );
                }
                
                return result;
            } catch (error) {
                // Registrar el error automáticamente
                await this.error(module, actionName, error.message);
                throw error;
            }
        }
    };
})();

// Exponer globalmente
window.Logger = Logger;
