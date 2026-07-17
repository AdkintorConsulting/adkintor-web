/**
 * ============================================
 * MODULE BASE - ADKINTOR WEB APP
 * ============================================
 * VERSIÓN: 1.0.0
 * FECHA: 2026-07-17
 * 
 * Archivo base para todos los módulos (EAMS y FORESIGHT):
 * - Usuario desde localStorage
 * - Logo desde postMessage
 * - Versión desde postMessage
 * - Toast notifications
 * - API calls
 * - Logging con usuario
 * - Impresión estandarizada
 * ============================================
 */

(function() {
    'use strict';
    
    // ============================================
    // CONFIGURACIÓN
    // ============================================
    
    const CONFIG = {
        PROXY_URL: window.ADKINTOR_CONFIG?.PROXY_URL || 'https://adkintor-proxy.empty-bonus-1852.workers.dev/',
        VERSION: window.ADKINTOR_CONFIG?.VERSION || 'v1.0.0'
    };
    
    // ============================================
    // SESIÓN
    // ============================================
    
    let session = null;
    let userEmail = 'unknown';
    let userName = 'User';
    let userRole = 'VIEWER';
    let eamsApiUrl = null;
    let intelligenceApiUrl = null;
    
    try {
        const sessionStr = localStorage.getItem('adkintor_session');
        if (sessionStr) {
            session = JSON.parse(sessionStr);
            userEmail = session.email || 'unknown';
            userName = session.userName || session.name || userEmail.split('@')[0] || 'User';
            userRole = session.role || 'VIEWER';
            eamsApiUrl = session.eamsApiUrl || null;
            intelligenceApiUrl = session.intelligenceApiUrl || null;
        }
    } catch(e) {
        //console.warn('[ModuleBase] Error loading session:', e);
    }
    
    // ============================================
    // TOAST NOTIFICATIONS
    // ============================================
    
    function showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer');
        if (!container) {
            // Fallback: usar el sistema de toast del padre
            if (window.parent && window.parent.showToast) {
                window.parent.showToast(message, type, duration);
                return;
            }
            //console.warn('[ModuleBase] Toast container not found');
            return;
        }
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (toast.parentNode) toast.remove();
            }, 350);
        }, duration);
    }
    
    // ============================================
    // API CALLS
    // ============================================
    
    async function callApi(action, args = [], apiUrl = null) {
        const url = apiUrl || eamsApiUrl || intelligenceApiUrl;
        if (!url) {
            showToast('API URL not available', 'error');
            throw new Error('API URL not available');
        }
        
        try {
            const response = await fetch(CONFIG.PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUrl: url,
                    payload: { action: action, args: args }
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result && result.status === 'error') {
                throw new Error(result.message || 'API error');
            }
            
            return result;
        } catch (error) {
            //console.error('[ModuleBase] API call failed:', error);
            showToast(error.message, 'error');
            throw error;
        }
    }
    
    // ============================================
    // LOGGING (con usuario automático)
    // ============================================
    
    async function logAction(action, module, entityId, details = '') {
        try {
            await callApi('logCreate', [userEmail, action, module, entityId, '', '', '', details]);
            return true;
        } catch(e) {
            //console.warn('[ModuleBase] Logging failed:', e);
            return false;
        }
    }
    
    async function logError(module, action, errorMsg) {
        try {
            await callApi('logSystemError', [module, action, errorMsg, 'ERROR', userEmail]);
            return true;
        } catch(e) {
            //console.warn('[ModuleBase] Error logging failed:', e);
            return false;
        }
    }
    
    // ============================================
    // POSTMESSAGE - RECIBIR DATOS DEL PADRE
    // ============================================
    
    window.addEventListener('message', function(event) {
        const data = event.data;
        if (!data || typeof data !== 'object') return;
        
        // Logo
        if (data.type === 'SET_COMPANY_LOGO' && data.logoUrl) {
            document.querySelectorAll('.company-logo').forEach(img => {
                img.src = data.logoUrl;
                img.style.display = 'inline-block';
            });
        }
        
        // Versión
        if (data.type === 'SET_VERSION' && data.version) {
            document.querySelectorAll('.footer-version, .version-badge').forEach(el => {
                el.textContent = data.version;
            });
        }
    });
    
    // ============================================
    // INICIALIZACIÓN DEL MÓDULO
    // ============================================
    
    function initModule(moduleTitle) {
        // Mostrar usuario
        document.querySelectorAll('.user-badge').forEach(el => {
            el.textContent = `👤 ${userName}`;
        });
        
        document.querySelectorAll('.user-email').forEach(el => {
            el.textContent = userEmail;
        });
        
        // Mostrar versión inicial (será actualizada por postMessage)
        document.querySelectorAll('.footer-version, .version-badge').forEach(el => {
            el.textContent = CONFIG.VERSION;
        });
        
        // Ocultar loading, mostrar contenido
        const overlay = document.getElementById('loadingOverlay');
        const content = document.getElementById('moduleContent');
        if (overlay) overlay.classList.add('hidden');
        if (content) content.style.display = 'block';
        
        // Toast de bienvenida
        setTimeout(() => {
            showToast(`${moduleTitle} loaded successfully ✅`, 'success', 2000);
        }, 300);
        
        // Enviar señal de que el módulo está listo
        if (window.parent && window.parent.postMessage) {
            window.parent.postMessage({
                type: 'MODULE_READY',
                module: moduleTitle,
                user: userName
            }, '*');
        }
        
        //console.log(`[ModuleBase] ${moduleTitle} initialized for user: ${userName}`);
    }
    
    // ============================================
    // IMPRESIÓN ESTANDARIZADA
    // ============================================
    
    function printModule(title, mode = 'eams') {
        // Añadir clase para el modo (eams o foresight)
        document.body.classList.add(`${mode}-print`);
        
        // Asegurar que el header de impresión existe
        ensurePrintHeader(title);
        
        // Añadir footer de impresión
        ensurePrintFooter();
        
        // Imprimir
        window.print();
        
        // Remover clases después de imprimir
        setTimeout(() => {
            document.body.classList.remove('eams-print', 'foresight-print');
        }, 1000);
    }
    
    function ensurePrintHeader(title) {
        // Verificar si ya existe
        let header = document.querySelector('.print-header');
        if (header) return;
        
        // Obtener logo
        const logoImg = document.querySelector('.company-logo');
        const logoSrc = logoImg ? logoImg.src : 'https://i.imgur.com/aQol7vU.png';
        
        // Obtener usuario y fecha
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        const timeStr = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Crear header
        header = document.createElement('div');
        header.className = 'print-header';
        header.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;">
                <img class="print-logo" src="${logoSrc}" alt="Logo" onerror="this.src='https://i.imgur.com/aQol7vU.png'">
                <span class="print-title">${title}</span>
            </div>
            <div class="print-meta">
                <span>${userName} (${userEmail})</span>
                <span>${dateStr} at ${timeStr}</span>
            </div>
        `;
        
        // Insertar al inicio del body
        document.body.insertBefore(header, document.body.firstChild);
    }
    
    function ensurePrintFooter() {
        // Verificar si ya existe
        let footer = document.querySelector('.print-footer');
        if (footer) return;
        
        const version = CONFIG.VERSION;
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        footer = document.createElement('div');
        footer.className = 'print-footer';
        footer.innerHTML = `
            <span>ADKINTOR EAMS + FORESIGHT</span>
            <span>
                <span class="footer-version">v${version}</span>
                <span class="footer-date"> | ${dateStr}</span>
            </span>
        `;
        
        document.body.appendChild(footer);
    }
    
    // ============================================
    // EXPOSICIÓN PÚBLICA
    // ============================================
    
    window.ModuleBase = {
        // Datos
        session: session,
        userEmail: userEmail,
        userName: userName,
        userRole: userRole,
        eamsApiUrl: eamsApiUrl,
        intelligenceApiUrl: intelligenceApiUrl,
        version: CONFIG.VERSION,
        
        // Funciones
        showToast: showToast,
        callApi: callApi,
        logAction: logAction,
        logError: logError,
        initModule: initModule,
        printModule: printModule
    };
    
    //console.log('[ModuleBase] Loaded successfully for user:', userName);
    
})();
