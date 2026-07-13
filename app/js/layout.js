// PDF Documents Configuration (for future implementation)
const pdfConfig = {
    'SOP Maintenance': { url: '', filename: 'SOP_Maintenance.pdf' },
    'Workflow WO': { url: '', filename: 'Workflow_WO.pdf' },
    'User Manual': { url: '', filename: 'User_Manual.pdf' },
    'Quick Start Guide': { url: '', filename: 'Quick_Start_Guide.pdf' },
    'Frequently Asked Questions': { url: '', filename: 'FAQ.pdf' }
};

// Global variables
let currentDocTitle = '';
let isMaximized = false;
let isMinimized = false;
let modalContainer = null;
// Nuevas variables para sidebar colapsable
let currentUserRole = 'VIEWER';
let isSidebarCollapsed = false;

// ============================================
// INICIALIZAR LOGGER
// ============================================

// Asegurar que el Logger está disponible
if (typeof Logger === 'undefined') {
    console.warn('Logger not loaded, logging disabled');
    window.Logger = {
        error: (...args) => console.warn('Logger unavailable:', args),
        audit: (...args) => console.warn('Logger unavailable:', args)
    };
}

// Asegurar que los botones estén ocultos al inicio por si el CSS falla
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.sidebar-btn, .eams-btn').forEach(btn => {
        btn.style.setProperty('display', 'none', 'important');
    });
});

// Wrapper global para funciones con logging automático
window.safeExecute = async (actionName, module, fn, logContext = {}) => {
    return Logger.wrap(actionName, module, fn, logContext);
};

// Función para mostrar fecha y semana
function updateDateAndWeek() {
    const dateWeekElement = document.getElementById('dateWeekDisplay');
    if (!dateWeekElement) return;
    
    const now = new Date();
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    const formattedDate = now.toLocaleDateString('en-US', options);
    
    // Calcular número de semana
    const startDate = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - startDate) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startDate.getDay() + 1) / 7);
    
    dateWeekElement.innerHTML = `<i class="fas fa-calendar-week"></i> ${formattedDate} | Week ${weekNumber}`;
}

// Función para mostrar nombre del cliente
function updateClientInfo() {
    const clientInfoElement = document.getElementById('clientInfoDisplay');
    if (!clientInfoElement) return;
    
    try {
        const session = JSON.parse(localStorage.getItem('adkintor_session'));
        const clientName = session.clientName || 'DEMO_CLIENT';
        clientInfoElement.innerHTML = `<i class="fas fa-building"></i> ${clientName}`;
    } catch (error) {
        console.error('Error loading client info:', error);
        clientInfoElement.innerHTML = `<i class="fas fa-building"></i> CLIENT`;
    }
}

// Función para colapsar/expandir sidebar
function initSidebarCollapse() {
    const collapseBtn = document.getElementById('sidebarCollapseBtn');
    const sidebar = document.getElementById('sidebar');
    
    if (!collapseBtn || !sidebar) return;
    
    // Cargar estado guardado
    const savedState = localStorage.getItem('sidebar_collapsed');
    if (savedState === 'true') {
        sidebar.classList.add('collapsed');
        isSidebarCollapsed = true;
    }
    
    collapseBtn.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
        isSidebarCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebar_collapsed', isSidebarCollapsed);
    });
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load user permissions first
    loadUserRoleAndPermissions();
    
    // Initialize events
    initEventListeners();
    
    // Setup modal close on outside click
    setupModalClose();
    
    // Initialize modal controls (minimize, maximize)
    initModalControls();

    // Update date and week
    updateDateAndWeek();

    // Update client info
    updateClientInfo();
    
    // Initialize sidebar collapse
    initSidebarCollapse();
});

function initEventListeners() {
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('adkintor_session');
            localStorage.removeItem('adkintor_user');
            localStorage.removeItem('adkintor_token');
            window.location.href = '/app/index.html';
        });
    }
    
    // Logo click - reload page
    const logoBtn = document.getElementById('logoBtn');
    if (logoBtn) {
        logoBtn.addEventListener('click', function() {
            window.location.href = '/app/main.html';
        });
    }
    
    // Sidebar buttons (Intelligence modules)
    const sidebarBtns = document.querySelectorAll('.sidebar-btn');
    sidebarBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const moduleName = this.getAttribute('data-module');
            const moduleUrl = this.getAttribute('data-url');
            const moduleTitle = this.querySelector('span') ? 
                this.querySelector('span').innerText : 
                this.innerText.trim();
            
            openIntelligenceModal(moduleName, moduleUrl, moduleTitle);
        });
    });
    
    // EAMS buttons (6 buttons)
    const eamsBtns = document.querySelectorAll('.eams-btn');
    eamsBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const eamsModule = this.getAttribute('data-eams');
            handleEamsClick(eamsModule);
        });
    });
    
    // Docs dropdown
    const docsBtn = document.getElementById('docsDropdownBtn');
    const docsDropdown = document.getElementById('docsDropdown');
    
    if (docsBtn && docsDropdown) {
        docsBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            docsDropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!docsBtn.contains(e.target) && !docsDropdown.contains(e.target)) {
                docsDropdown.classList.remove('show');
            }
        });
        
        // Documents links
        const docLinks = docsDropdown.querySelectorAll('a');
        docLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const docTitle = this.getAttribute('data-doc');
                openDocumentModal(docTitle);
                docsDropdown.classList.remove('show');
            });
        });
    }
    
    // Modal close buttons
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeIframeModal);
    }
    
    const closeDocModalBtn = document.getElementById('closeDocModalBtn');
    if (closeDocModalBtn) {
        closeDocModalBtn.addEventListener('click', closeDocumentModal);
    }
}

// Initialize modal controls
function initModalControls() {
    modalContainer = document.querySelector('#iframeModal .modal-container');
    const minimizeBtn = document.getElementById('minimizeModalBtn');
    const maximizeBtn = document.getElementById('maximizeModalBtn');
    
    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isMaximized) {
                modalContainer.classList.remove('maximized');
                isMaximized = false;
                if (maximizeBtn) maximizeBtn.innerHTML = '□';
            }
            modalContainer.classList.add('minimized');
            isMinimized = true;
        });
    }
    
    if (maximizeBtn) {
        maximizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isMinimized) {
                modalContainer.classList.remove('minimized');
                isMinimized = false;
            }
            if (isMaximized) {
                modalContainer.classList.remove('maximized');
                isMaximized = false;
                maximizeBtn.innerHTML = '□';
            } else {
                modalContainer.classList.add('maximized');
                isMaximized = true;
                maximizeBtn.innerHTML = '❐';
            }
        });
    }
    
    // Restore from minimized when clicking header
    const modalHeader = document.querySelector('#iframeModal .modal-header');
    if (modalHeader) {
        modalHeader.addEventListener('click', (e) => {
            if (isMinimized && e.target.tagName !== 'BUTTON') {
                modalContainer.classList.remove('minimized');
                isMinimized = false;
            }
        });
    }
}

function resetModalState() {
    if (!modalContainer) return;
    modalContainer.classList.remove('maximized', 'minimized');
    isMaximized = false;
    isMinimized = false;
    const maximizeBtn = document.getElementById('maximizeModalBtn');
    if (maximizeBtn) maximizeBtn.innerHTML = '□';
}

function setupModalClose() {
    // ❌ DESACTIVADO: Cierre al hacer clic fuera del modal
    // const iframeModal = document.getElementById('iframeModal');
    // if (iframeModal) {
    //     iframeModal.addEventListener('click', function(e) {
    //         if (e.target === iframeModal) {
    //             closeIframeModal();
    //         }
    //     });
    // }
    
    // ✅ MANTENER: Cierre del modal de documentos
    const docModal = document.getElementById('docModal');
    if (docModal) {
        docModal.addEventListener('click', function(e) {
            if (e.target === docModal) {
                closeDocumentModal();
            }
        });
    }
}

// ============================================
// INTELLIGENCE MODAL FUNCTIONS - CORREGIDAS
// ============================================

function openIntelligenceModal(moduleName, moduleUrl, moduleTitle) {
    // Mapear módulos de Intelligence a sus dispatchers
    const dispatcherMap = {
        'kpi_intel': '/app/modules/intelligence/kpi_dispatcher.html',
        'wo_intel': '/app/modules/intelligence/wo_dispatcher.html',
        'pvt_intel': '/app/modules/intelligence/pvt_dispatcher.html',
        'stk_intel': '/app/modules/intelligence/stk_dispatcher.html',
        'cal_intel': '/app/modules/intelligence/cal_dispatcher.html',
        'consulting': '/app/modules/intelligence/consulting_dispatcher.html'
    };
    
    // Si existe dispatcher, usarlo
    if (dispatcherMap[moduleName]) {
        openIframeModalWithTitle(moduleTitle, dispatcherMap[moduleName]);
    } else {
        // Fallback: abrir directamente
        const modal = document.getElementById('iframeModal');
        const iframe = document.getElementById('intelIframe');
        if (modal && iframe) {
            iframe.src = moduleUrl;
            modal.style.display = 'flex';
        }
    }
}

function showPlaceholderInModal(moduleTitle) {
    const modal = document.getElementById('iframeModal');
    const iframe = document.getElementById('intelIframe');
    
    if (modal && iframe) {
        // YA NO HAY titleElem - el iframe tiene su propio título
        // Crear placeholder HTML
        const placeholderHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background: #f4f6f9;
                    }
                    .placeholder {
                        text-align: center;
                        padding: 2rem;
                    }
                    .placeholder i {
                        font-size: 4rem;
                        color: #1a1a2e;
                    }
                    .placeholder h2 {
                        color: #333;
                        margin: 1rem 0;
                    }
                    .placeholder p {
                        color: #666;
                    }
                </style>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            </head>
            <body>
                <div class="placeholder">
                    <i class="fas fa-code-branch"></i>
                    <h2>${moduleTitle}</h2>
                    <p>Module under development</p>
                    <p style="font-size: 0.9rem;">Coming soon in the next release</p>
                </div>
            </body>
            </html>
        `;
        
        const blob = new Blob([placeholderHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        iframe.src = url;
        modal.style.display = 'flex';
        
        // Clean up object URL when closed
        iframe.onload = () => {
            setTimeout(() => URL.revokeObjectURL(url), 100);
        };
    }
}

function closeIframeModal() {
    const modal = document.getElementById('iframeModal');
    const iframe = document.getElementById('intelIframe');
    
    if (modal) {
        modal.style.display = 'none';
        if (iframe) {
            iframe.src = ''; // Clear src
        }
        resetModalState();
    }
    
    // Restaurar breadcrumbs cuando se cierra el modal
    const breadcrumbDynamic = document.getElementById('dynamicBreadcrumb');
    if (breadcrumbDynamic) {
        breadcrumbDynamic.style.display = 'none';
        breadcrumbDynamic.textContent = '';
    }
}

// ============================================
// EAMS HANDLERS
// ============================================

function handleEamsClick(module) {
    switch(module) {
        case 'asset':
            openAssetDispatcher();
            break;
        case 'work_order':
            openWorkOrderDispatcher();
            break;
        case 'preventive':
            openPreventiveDispatcher();
            break;
        case 'calibrations':
            openCalibrationDispatcher();
            break;
        case 'inventory':
            openInventoryDispatcher();
            break;
        case 'plant_layout':
            openPlantLayout();
            break;
        case 'sys_wizard':
            openSysWizard();
            break;
        default:
            console.log('Unknown EAMS module:', module);
    }
}

function openAssetDispatcher() {
    const dynamicContent = document.getElementById('dynamicContent');
    const breadcrumbDynamic = document.getElementById('dynamicBreadcrumb');
    
    if (dynamicContent) {
        fetch('/app/modules/eams/ast_dispatcher.html?t=' + Date.now())
            .then(response => {
                if (!response.ok) throw new Error('Dispatcher not found');
                return response.text();
            })
            .then(html => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                const scripts = tempDiv.querySelectorAll('script');
                scripts.forEach(script => script.remove());
                dynamicContent.innerHTML = tempDiv.innerHTML;
                
                if (breadcrumbDynamic) {
                    breadcrumbDynamic.textContent = 'ASSETS';
                    breadcrumbDynamic.style.display = 'inline';
                }
                
                scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    newScript.textContent = oldScript.textContent;
                    document.body.appendChild(newScript);
                });
                
                setTimeout(() => {
                    initAstDispatcherButtons();
                }, 100);
            })
            .catch(error => {
                console.error('Error loading ASSET dispatcher:', error);
                dynamicContent.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-triangle"></i><h3>Error loading Asset Dispatcher</h3><p>Please try again later</p></div>`;
            });
    }
}

// ============================================
// WORK ORDER DISPATCHER
// ============================================

function openWorkOrderDispatcher() {
    const dynamicContent = document.getElementById('dynamicContent');
    const breadcrumbDynamic = document.getElementById('dynamicBreadcrumb');
    
    if (dynamicContent) {
        fetch('/app/modules/eams/wo_dispatcher.html?t=' + Date.now())
            .then(response => {
                if (!response.ok) throw new Error('Dispatcher not found');
                return response.text();
            })
            .then(html => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                const scripts = tempDiv.querySelectorAll('script');
                scripts.forEach(script => script.remove());
                dynamicContent.innerHTML = tempDiv.innerHTML;
                
                if (breadcrumbDynamic) {
                    breadcrumbDynamic.textContent = 'WORK ORDERS';
                    breadcrumbDynamic.style.display = 'inline';
                }
                
                scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    newScript.textContent = oldScript.textContent;
                    document.body.appendChild(newScript);
                });
                
                setTimeout(() => {
                    initWoDispatcherButtons();
                }, 100);
            })
            .catch(error => {
                console.error('Error loading WO dispatcher:', error);
                dynamicContent.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-triangle"></i><h3>Error loading Work Order Dispatcher</h3><p>Please try again later</p></div>`;
            });
    }
}

function initWoDispatcherButtons() {
    const createBtn = document.getElementById('createBtn');
    const searchBtn = document.getElementById('searchBtn');
    const executeBtn = document.getElementById('executeBtn');
    const approveBtn = document.getElementById('approveBtn');
    const closeBtn = document.getElementById('closeBtn');
    
    if (createBtn) {
        const newBtn = createBtn.cloneNode(true);
        createBtn.parentNode.replaceChild(newBtn, createBtn);
        newBtn.addEventListener('click', () => openWOModal('create'));
    }
    if (searchBtn) {
        const newBtn = searchBtn.cloneNode(true);
        searchBtn.parentNode.replaceChild(newBtn, searchBtn);
        newBtn.addEventListener('click', () => openWOModal('search'));
    }
    if (executeBtn) {
        const newBtn = executeBtn.cloneNode(true);
        executeBtn.parentNode.replaceChild(newBtn, executeBtn);
        newBtn.addEventListener('click', () => openWOModal('execute'));
    }
    if (approveBtn) {
        const newBtn = approveBtn.cloneNode(true);
        approveBtn.parentNode.replaceChild(newBtn, approveBtn);
        newBtn.addEventListener('click', () => openWOModal('approve'));
    }
    if (closeBtn) {
        const newBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newBtn, closeBtn);
        newBtn.addEventListener('click', () => openWOModal('close'));
    }
}

function openWOModal(type) {
    // Guardar URL de EAMS antes de abrir
    const session = JSON.parse(localStorage.getItem('adkintor_session'));
    if (session && session.eamsApiUrl) {
        localStorage.setItem('eamsApiUrl', session.eamsApiUrl);
    }
    
    let title = '';
    let url = '';
    
    switch(type) {
        case 'create':
            title = 'Create Work Order';
            url = '/app/modules/eams/wo_create.html';
            break;
        case 'search':
            title = 'Search & Report';
            url = '/app/modules/eams/wo_search.html';
            break;
        case 'execute':
            title = 'Technical Report';
            url = '/app/modules/eams/wo_execute.html';
            break;
        case 'approve':
            title = 'Approval Manager';
            url = '/app/modules/eams/wo_approve.html';
            break;
        case 'close':
            title = 'Final Closure';
            url = '/app/modules/eams/wo_close.html';
            break;
    }
    
    openIframeModalWithTitle(title, url);
}

// ============================================
// PREVENTIVE DISPATCHER
// ============================================

function openPreventiveDispatcher() {
    const dynamicContent = document.getElementById('dynamicContent');
    const breadcrumbDynamic = document.getElementById('dynamicBreadcrumb');
    
    if (dynamicContent) {
        fetch('/app/modules/eams/pvt_dispatcher.html?t=' + Date.now())
            .then(response => {
                if (!response.ok) throw new Error('Dispatcher not found');
                return response.text();
            })
            .then(html => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                const scripts = tempDiv.querySelectorAll('script');
                scripts.forEach(script => script.remove());
                dynamicContent.innerHTML = tempDiv.innerHTML;
                
                if (breadcrumbDynamic) {
                    breadcrumbDynamic.textContent = 'PREVENTIVE';
                    breadcrumbDynamic.style.display = 'inline';
                }
                
                scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    newScript.textContent = oldScript.textContent;
                    document.body.appendChild(newScript);
                });
                
                setTimeout(() => {
                    initPvtDispatcherButtons();
                }, 100);
            })
            .catch(error => {
                console.error('Error loading PVT dispatcher:', error);
                dynamicContent.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-triangle"></i><h3>Error loading Preventive Dispatcher</h3><p>Please try again later</p></div>`;
            });
    }
}

function initPvtDispatcherButtons() {
    const releaseBtn = document.getElementById('releaseBtn');
    const manualBtn = document.getElementById('manualBtn');
    const activityBtn = document.getElementById('activityBtn');
    const plannerBtn = document.getElementById('plannerBtn');
    const sweeperBtn = document.getElementById('sweeperBtn');
    
    if (releaseBtn) {
        const newBtn = releaseBtn.cloneNode(true);
        releaseBtn.parentNode.replaceChild(newBtn, releaseBtn);
        newBtn.addEventListener('click', () => openPvtModal('release'));
    }
    if (manualBtn) {
        const newBtn = manualBtn.cloneNode(true);
        manualBtn.parentNode.replaceChild(newBtn, manualBtn);
        newBtn.addEventListener('click', () => openPvtModal('manual'));
    }
    if (activityBtn) {
        const newBtn = activityBtn.cloneNode(true);
        activityBtn.parentNode.replaceChild(newBtn, activityBtn);
        newBtn.addEventListener('click', () => openPvtModal('activity'));
    }
    if (plannerBtn) {
        const newBtn = plannerBtn.cloneNode(true);
        plannerBtn.parentNode.replaceChild(newBtn, plannerBtn);
        newBtn.addEventListener('click', () => openPvtModal('planner'));
    }
    if (sweeperBtn) {
        const newBtn = sweeperBtn.cloneNode(true);
        sweeperBtn.parentNode.replaceChild(newBtn, sweeperBtn);
        newBtn.addEventListener('click', () => openPvtModal('sweeper'));
    }
}

function openPvtModal(type) {
    // Guardar URL de EAMS antes de abrir
    const session = JSON.parse(localStorage.getItem('adkintor_session'));
    if (session && session.eamsApiUrl) {
        localStorage.setItem('eamsApiUrl', session.eamsApiUrl);
    }
    
    let title = '';
    let url = '';
    
    switch(type) {
        case 'release':
            title = 'Weekly Release';
            url = '/app/modules/eams/pvt_release.html';
            break;
        case 'manual':
            title = 'Manual PM';
            url = '/app/modules/eams/pvt_manual.html';
            break;
        case 'activity':
            title = 'Activity Builder';
            url = '/app/modules/eams/pvt_activity.html';
            break;
        case 'planner':
            title = 'Strategic Planner';
            url = '/app/modules/eams/pvt_planner.html';
            break;
        case 'sweeper':
            title = 'System Sweeper';
            url = '/app/modules/eams/pvt_sweeper.html';
            break;
    }
    
    openIframeModalWithTitle(title, url);
}

// ============================================
// INVENTORY DISPATCHER
// ============================================

function openInventoryDispatcher() {
    const dynamicContent = document.getElementById('dynamicContent');
    const breadcrumbDynamic = document.getElementById('dynamicBreadcrumb');
    
    if (dynamicContent) {
        fetch('/app/modules/eams/stk_dispatcher.html?t=' + Date.now())
            .then(response => {
                if (!response.ok) throw new Error('Dispatcher not found');
                return response.text();
            })
            .then(html => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                const scripts = tempDiv.querySelectorAll('script');
                scripts.forEach(script => script.remove());
                dynamicContent.innerHTML = tempDiv.innerHTML;
                
                if (breadcrumbDynamic) {
                    breadcrumbDynamic.textContent = 'INVENTORY';
                    breadcrumbDynamic.style.display = 'inline';
                }
                
                scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    newScript.textContent = oldScript.textContent;
                    document.body.appendChild(newScript);
                });
                
                setTimeout(() => {
                    initStkDispatcherButtons();
                }, 100);
            })
            .catch(error => {
                console.error('Error loading STK dispatcher:', error);
                dynamicContent.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-triangle"></i><h3>Error loading Inventory Dispatcher</h3><p>Please try again later</p></div>`;
            });
    }
}

function initStkDispatcherButtons() {
    const viewerBtn = document.getElementById('viewerBtn');
    const inventoryBtn = document.getElementById('inventoryBtn');
    const procurementBtn = document.getElementById('procurementBtn');
    
    if (viewerBtn) {
        const newBtn = viewerBtn.cloneNode(true);
        viewerBtn.parentNode.replaceChild(newBtn, viewerBtn);
        newBtn.addEventListener('click', () => openStkModal('viewer'));
    }
    if (inventoryBtn) {
        const newBtn = inventoryBtn.cloneNode(true);
        inventoryBtn.parentNode.replaceChild(newBtn, inventoryBtn);
        newBtn.addEventListener('click', () => openStkModal('inventory'));
    }
    if (procurementBtn) {
        const newBtn = procurementBtn.cloneNode(true);
        procurementBtn.parentNode.replaceChild(newBtn, procurementBtn);
        newBtn.addEventListener('click', () => openStkModal('procurement'));
    }
}

function openStkModal(type) {
    // Guardar URL de EAMS antes de abrir
    const session = JSON.parse(localStorage.getItem('adkintor_session'));
    if (session && session.eamsApiUrl) {
        localStorage.setItem('eamsApiUrl', session.eamsApiUrl);
    }
    
    let title = '';
    let url = '';
    
    switch(type) {
        case 'viewer':
            title = 'Inventory Viewer';
            url = '/app/modules/eams/stk_viewer.html';
            break;
        case 'inventory':
            title = 'Inventory Hub';
            url = '/app/modules/eams/stk_inventory.html';
            break;
        case 'procurement':
            title = 'Procurement Hub';
            url = '/app/modules/eams/stk_procurement.html';
            break;
    }
    
    openIframeModalWithTitle(title, url);
}

// ============================================
// CALIBRATION DISPATCHER
// ============================================

function openCalibrationDispatcher() {
    const dynamicContent = document.getElementById('dynamicContent');
    const breadcrumbDynamic = document.getElementById('dynamicBreadcrumb');
    
    if (dynamicContent) {
        fetch('/app/modules/eams/cal_dispatcher.html?t=' + Date.now())
            .then(response => {
                if (!response.ok) throw new Error('Dispatcher not found');
                return response.text();
            })
            .then(html => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                const scripts = tempDiv.querySelectorAll('script');
                scripts.forEach(script => script.remove());
                dynamicContent.innerHTML = tempDiv.innerHTML;
                
                if (breadcrumbDynamic) {
                    breadcrumbDynamic.textContent = 'CALIBRATION';
                    breadcrumbDynamic.style.display = 'inline';
                }
                
                scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    newScript.textContent = oldScript.textContent;
                    document.body.appendChild(newScript);
                });
                
                setTimeout(() => {
                    initCalDispatcherButtons();
                }, 100);
            })
            .catch(error => {
                console.error('Error loading CAL dispatcher:', error);
                dynamicContent.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-triangle"></i><h3>Error loading Calibration Dispatcher</h3><p>Please try again later</p></div>`;
            });
    }
}

function initCalDispatcherButtons() {
    const viewerBtn = document.getElementById('viewerBtn');
    const managerBtn = document.getElementById('managerBtn');
    const reportsBtn = document.getElementById('reportsBtn');
    
    if (viewerBtn) {
        const newBtn = viewerBtn.cloneNode(true);
        viewerBtn.parentNode.replaceChild(newBtn, viewerBtn);
        newBtn.addEventListener('click', () => openCalModal('viewer'));
    }
    if (managerBtn) {
        const newBtn = managerBtn.cloneNode(true);
        managerBtn.parentNode.replaceChild(newBtn, managerBtn);
        newBtn.addEventListener('click', () => openCalModal('manager'));
    }
    if (reportsBtn) {
        const newBtn = reportsBtn.cloneNode(true);
        reportsBtn.parentNode.replaceChild(newBtn, reportsBtn);
        newBtn.addEventListener('click', () => openCalModal('reports'));
    }
}

function openCalModal(type) {
    // Guardar URL de EAMS antes de abrir
    const session = JSON.parse(localStorage.getItem('adkintor_session'));
    if (session && session.eamsApiUrl) {
        localStorage.setItem('eamsApiUrl', session.eamsApiUrl);
    }
    
    let title = '';
    let url = '';
    
    switch(type) {
        case 'viewer':
            title = 'Calibration Viewer';
            url = '/app/modules/eams/cal_viewer.html';
            break;
        case 'manager':
            title = 'Calibration Manager';
            url = '/app/modules/eams/cal_manager.html';
            break;
        case 'reports':
            title = 'Reports & Audits';
            url = '/app/modules/eams/cal_reports.html';
            break;
    }
    
    openIframeModalWithTitle(title, url);
}

// ============================================
// PLANT LAYOUT (visor único)
// ============================================

function openPlantLayout() {
    // Guardar URL de EAMS antes de abrir
    const session = JSON.parse(localStorage.getItem('adkintor_session'));
    if (session && session.eamsApiUrl) {
        localStorage.setItem('eamsApiUrl', session.eamsApiUrl);
    }
    
    // ✅ USAR LA MISMA FUNCIÓN QUE LOS OTROS MÓDULOS
    openIframeModalWithTitle('Plant Layout', '/app/modules/eams/plant_layout.html');
    
    // Actualizar breadcrumb
    const breadcrumbDynamic = document.getElementById('dynamicBreadcrumb');
    if (breadcrumbDynamic) {
        breadcrumbDynamic.textContent = 'PLANT LAYOUT';
        breadcrumbDynamic.style.display = 'inline';
    }
}

// ============================================
// SYS WIZARD (visor único)
// ============================================

function openSysWizard() {
    // Guardar URL de EAMS antes de abrir
    const session = JSON.parse(localStorage.getItem('adkintor_session'));
    if (session && session.eamsApiUrl) {
        localStorage.setItem('eamsApiUrl', session.eamsApiUrl);
    }
    
    // ✅ USAR LA MISMA FUNCIÓN QUE LOS OTROS MÓDULOS
    openIframeModalWithTitle('System Configurator', '/app/modules/eams/sys_wizard.html');
    
    // Actualizar breadcrumb
    const breadcrumbDynamic = document.getElementById('dynamicBreadcrumb');
    if (breadcrumbDynamic) {
        breadcrumbDynamic.textContent = 'SYSTEM > Configurator';
        breadcrumbDynamic.style.display = 'inline';
    }
}

// ============================================
// FUNCIÓN AUXILIAR PARA ABRIR MODALES
// ============================================

function openIframeModalWithTitle(title, url) {
    const modal = document.getElementById('iframeModal');
    const container = modal?.querySelector('.modal-container');
    const iframe = document.getElementById('intelIframe');
    
    if (modal && iframe) {
        iframe.src = url;
        modal.style.display = 'flex';
        
        // Maximizado por defecto
        if (container) {
            container.classList.remove('minimized');
            container.classList.add('maximized');
            isMaximized = true;
            isMinimized = false;
            const maximizeBtn = document.getElementById('maximizeModalBtn');
            if (maximizeBtn) maximizeBtn.innerHTML = '❐';
        }
        
        // Enviar logo y versión al iframe
        loadCompanyLogoForIframe(iframe);
        sendVersionToIframe(iframe);
    }
}

// ============================================
// CARGA DE LOGO DESDE API
// ============================================

async function loadCompanyLogoForIframe(iframe) {
    try {
        const session = JSON.parse(localStorage.getItem('adkintor_session'));
        if (!session || !session.eamsApiUrl) {
            // Logo por defecto
            sendLogoToIframe(iframe, 'https://i.imgur.com/aQol7vU.png');
            return;
        }
        
        const response = await fetch(window.ADKINTOR_CONFIG.PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                targetUrl: session.eamsApiUrl,
                payload: { action: 'WO_getCompanyLogoUrl', args: [] }
            })
        });
        
        const result = await response.json();
        const logoUrl = (result.success && result.data) ? result.data : 'https://i.imgur.com/aQol7vU.png';
        sendLogoToIframe(iframe, logoUrl);
        
    } catch (error) {
        console.warn('Could not load company logo, using default:', error);
        sendLogoToIframe(iframe, 'https://i.imgur.com/aQol7vU.png');
    }
}

function sendLogoToIframe(iframe, logoUrl) {
    const send = () => {
        if (iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                type: 'SET_COMPANY_LOGO',
                logoUrl: logoUrl
            }, '*');
        }
    };
    
    // Si el iframe ya está cargado, enviar ahora
    if (iframe.contentWindow && iframe.contentWindow.document && 
        iframe.contentWindow.document.readyState === 'complete') {
        send();
    } else {
        iframe.onload = send;
    }
}

// ============================================
// VERSIÓN DINÁMICA
// ============================================

async function sendVersionToIframe(iframe) {
    try {
        const session = JSON.parse(localStorage.getItem('adkintor_session'));
        let version = 'v1.0.0'; // fallback
        
        if (session && session.eamsApiUrl) {
            const response = await fetch(window.ADKINTOR_CONFIG.PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUrl: session.eamsApiUrl,
                    payload: { action: 'getVersionInfo', args: [] }
                })
            });
            const result = await response.json();
            if (result.success && result.data && result.data.fullVersion) {
                version = 'v' + result.data.fullVersion;
                console.log('✅ Versión obtenida desde API:', version);
            } else {
                console.warn('No se pudo obtener versión desde API, usando fallback');
            }
        }
        
        const send = () => {
            if (iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                    type: 'SET_VERSION',
                    version: version
                }, '*');
            }
        };
        
        if (iframe.contentWindow && iframe.contentWindow.document && 
            iframe.contentWindow.document.readyState === 'complete') {
            send();
        } else {
            const existingOnload = iframe.onload;
            iframe.onload = function(e) {
                if (existingOnload) existingOnload(e);
                send();
            };
        }
    } catch (error) {
        console.warn('Error obteniendo versión:', error);
        // Fallback: usar la de config
        const version = window.ADKINTOR_CONFIG?.VERSION || 'v1.0.0';
        // ... enviar versión
    }
}

function initAstDispatcherButtons() {
    const addAssetBtn = document.getElementById('addAssetBtn');
    const assetMasterBtn = document.getElementById('assetMasterBtn');
    const modifyAssetBtn = document.getElementById('modifyAssetBtn');
    
    if (addAssetBtn) {
        // Remover eventos anteriores clonando el elemento
        const newBtn = addAssetBtn.cloneNode(true);
        addAssetBtn.parentNode.replaceChild(newBtn, addAssetBtn);
        newBtn.addEventListener('click', () => {
            openAssetModal('add');
        });
    }
    
    if (assetMasterBtn) {
        const newBtn = assetMasterBtn.cloneNode(true);
        assetMasterBtn.parentNode.replaceChild(newBtn, assetMasterBtn);
        newBtn.addEventListener('click', () => {
            openAssetModal('master');
        });
    }
    
    if (modifyAssetBtn) {
        const newBtn = modifyAssetBtn.cloneNode(true);
        modifyAssetBtn.parentNode.replaceChild(newBtn, modifyAssetBtn);
        newBtn.addEventListener('click', () => {
            openAssetModal('modify');
        });
    }
}

// Abrir modales de assets (reutiliza el modal de Intelligence)
function openAssetModal(type) {
    // Guardar URL de EAMS antes de abrir
    const session = JSON.parse(localStorage.getItem('adkintor_session'));
    if (session && session.eamsApiUrl) {
        localStorage.setItem('eamsApiUrl', session.eamsApiUrl);
    }
    
    let title = '';
    let url = '';
    
    switch(type) {
        case 'add':
            title = 'Add Asset';
            url = '/app/modules/eams/ast_add.html';
            break;
        case 'master':
            title = 'Asset Master';
            url = '/app/modules/eams/ast_master.html';
            break;
        case 'modify':
            title = 'Modify Asset';
            url = '/app/modules/eams/ast_modify.html';
            break;
    }
    
    // Reutilizar la función unificada
    openIframeModalWithTitle(title, url);
    
    // Actualizar breadcrumbs específicos de assets
    const breadcrumbDynamic = document.getElementById('dynamicBreadcrumb');
    if (breadcrumbDynamic) {
        let path = '';
        switch(type) {
            case 'add': path = 'ASSETS > Add Asset'; break;
            case 'master': path = 'ASSETS > Asset Master'; break;
            case 'modify': path = 'ASSETS > Modify Asset'; break;
        }
        breadcrumbDynamic.textContent = path;
        breadcrumbDynamic.style.display = 'inline';
    }
}

// DOCUMENT MODAL FUNCTIONS
function openDocumentModal(docTitle) {
    const modal = document.getElementById('docModal');
    const titleElem = document.getElementById('docModalTitle');
    const placeholder = document.getElementById('pdfPlaceholder');
    
    if (modal && titleElem && placeholder) {
        currentDocTitle = docTitle;
        titleElem.textContent = docTitle;
        
        // Update placeholder with document info
        const pdfConfigItem = pdfConfig[docTitle];
        const downloadBtn = document.getElementById('downloadPdfBtn');
        const printBtn = document.getElementById('printPdfBtn');
        
        if (pdfConfigItem && pdfConfigItem.url) {
            // If real URL is configured, enable buttons
            if (downloadBtn) {
                downloadBtn.disabled = false;
                downloadBtn.onclick = () => {
                    window.open(pdfConfigItem.url, '_blank');
                };
            }
            if (printBtn) {
                printBtn.disabled = false;
                printBtn.onclick = () => {
                    const printWindow = window.open(pdfConfigItem.url, '_blank');
                    printWindow.onload = () => {
                        printWindow.print();
                    };
                };
            }
        } else {
            // Placeholder mode
            if (downloadBtn) {
                downloadBtn.disabled = true;
                downloadBtn.onclick = null;
            }
            if (printBtn) {
                printBtn.disabled = true;
                printBtn.onclick = null;
            }
        }
        
        modal.style.display = 'flex';
    }
}

function closeDocumentModal() {
    const modal = document.getElementById('docModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// UTILITY FUNCTIONS
function showTemporaryMessage(message) {
    const toast = document.getElementById('toastMessage');
    if (toast) {
        toast.textContent = message;
        toast.style.display = 'block';
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }
}

// Reset breadcrumbs when loading different module (optional)
function resetBreadcrumbs() {
    const breadcrumbDynamic = document.getElementById('dynamicBreadcrumb');
    if (breadcrumbDynamic) {
        breadcrumbDynamic.style.display = 'none';
        breadcrumbDynamic.textContent = '';
    }
}

// ============================================
// LOAD USER PERMISSIONS FROM LOCALSTORAGE
// ============================================

async function loadUserRoleAndPermissions() {
    const loadingDiv = document.getElementById('dynamicContent');
    
    try {
        // Obtener sesión
        const session = JSON.parse(localStorage.getItem('adkintor_session'));
        const userRole = session.role || 'VIEWER';
        const userName = session.userName || session.name || session.email.split('@')[0];
        const eamsApiUrl = session.eamsApiUrl;
        
        console.log('User role from localStorage:', userRole);
        console.log('User name from localStorage:', userName);
        
        currentUserRole = userRole;
        
        // Obtener permisos desde la API (SETUP_HUB)
        let permissions = [];
        
        if (eamsApiUrl) {
            try {
                const response = await fetch('https://adkintor-proxy.empty-bonus-1852.workers.dev/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        targetUrl: eamsApiUrl,
                        payload: { action: 'getPermissionsByRole', args: [userRole] }
                    })
                });
                const result = await response.json();
                
                if (result.success && Array.isArray(result.data)) {
                    permissions = result.data;
                    console.log('Permissions loaded from SETUP_HUB:', permissions);
                } else {
                    console.warn('Failed to load permissions from API, using fallback');
                    permissions = getFallbackPermissions(userRole);
                }
            } catch (error) {
                console.error('Error fetching permissions:', error);
                permissions = getFallbackPermissions(userRole);
            }
        } else {
            permissions = getFallbackPermissions(userRole);
        }
        
        // Guardar permisos para usar en applyPermissionsByRole
        window.currentPermissions = permissions;
        
        // Aplicar permisos
        applyPermissionsByRole();
        
        // Mostrar mensaje de bienvenida
        if (loadingDiv) {
            loadingDiv.innerHTML = `
                <div class="welcome-message">
                    <i class="fas fa-chalkboard-user"></i>
                    <h2>Welcome back, ${userName}!</h2>
                    <p>Role: ${userRole}</p>
                    <p>Select a module from the sidebar or EAMS buttons to get started</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error loading user permissions:', error);
        if (loadingDiv) {
            loadingDiv.innerHTML = `
                <div class="welcome-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h2>Welcome</h2>
                    <p>Select a module from the sidebar or EAMS buttons to get started</p>
                </div>
            `;
        }
    }
}

function getFallbackPermissions(role) {
    // Fallback en caso de que no se pueda conectar a la API
    const fallback = {
        'ADMIN': ['WO_IntelligenceUI', 'PVT_IntelligenceUI', 'STK_IntelligenceUI', 'CAL_IntelligenceUI', 'KPI_IntelligenceUI', 'CONSULTING_IntelligenceUI', 'AST_MainDispatcherUI', 'WO_MainDispatcherUI', 'PVT_MainDispatcherUI', 'CAL_MainDispatcherUI', 'STK_MainDispatcherUI', 'SYS_PlantLayoutUI'],
        'MANAGER': ['WO_IntelligenceUI', 'PVT_IntelligenceUI', 'STK_IntelligenceUI', 'CAL_IntelligenceUI', 'KPI_IntelligenceUI', 'AST_MainDispatcherUI', 'WO_MainDispatcherUI'],
        'SUPERVISOR': ['WO_IntelligenceUI', 'PVT_IntelligenceUI', 'STK_IntelligenceUI', 'AST_MainDispatcherUI', 'WO_MainDispatcherUI'],
        'TECHNICIAN': ['WO_IntelligenceUI', 'AST_MainDispatcherUI', 'WO_MainDispatcherUI'],
        'PLANNER': ['PVT_IntelligenceUI', 'WO_IntelligenceUI', 'PVT_MainDispatcherUI', 'WO_MainDispatcherUI'],
        'VIEWER': ['WO_IntelligenceUI'],
        'FINANCE': ['STK_IntelligenceUI', 'KPI_IntelligenceUI']
    };
    return fallback[role] || fallback['VIEWER'];
}

function applyPermissionsByRole() {
    // Usar permisos cargados desde SETUP_HUB (o fallback)
    const permissions = window.currentPermissions || [];
    
    if (permissions.length === 0) {
        console.warn('No permissions loaded, hiding all buttons');
        document.querySelectorAll('.sidebar-btn, .eams-btn').forEach(btn => {
            btn.style.setProperty('display', 'none', 'important');
        });
        return;
    }
    
    // Obtener los botones
    const sidebarBtns = document.querySelectorAll('.sidebar-btn');
    const eamsBtns = document.querySelectorAll('.eams-btn');
    
    // Aplicar permisos a sidebar buttons (FORESIGHT)
    sidebarBtns.forEach(btn => {
        const permission = btn.getAttribute('data-permission');
        if (permission && permissions.includes(permission)) {
            btn.style.setProperty('display', 'flex', 'important');
        } else {
            btn.style.setProperty('display', 'none', 'important');
        }
    });
    
    // Aplicar permisos a EAMS buttons
    eamsBtns.forEach(btn => {
        const permission = btn.getAttribute('data-permission');
        if (permission && permissions.includes(permission)) {
            btn.style.setProperty('display', 'inline-block', 'important');
        } else {
            btn.style.setProperty('display', 'none', 'important');
        }
    });
}

// ============================================
// TOAST MEJORADO (arriba derecha)
// ============================================

function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.warn('Toast container not found');
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    // Auto-remover después de duration
    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 350);
    }, duration);
}

// ============================================
// INICIALIZACIÓN - MOSTRAR TOAST DE BIENVENIDA
// ============================================

// Al cargar main.html, mostrar toast de bienvenida
document.addEventListener('DOMContentLoaded', function() {
    // Mostrar toast de bienvenida
    setTimeout(() => {
        const session = JSON.parse(localStorage.getItem('adkintor_session'));
        const name = session?.userName || session?.email?.split('@')[0] || 'User';
        showToast(`Welcome back, ${name}! 👋`, 'info', 3000);
    }, 500);
});
