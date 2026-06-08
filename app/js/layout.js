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

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize events
    initEventListeners();
    
    // Setup modal close on outside click
    setupModalClose();
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

function setupModalClose() {
    // Close modal when clicking outside content
    const iframeModal = document.getElementById('iframeModal');
    if (iframeModal) {
        iframeModal.addEventListener('click', function(e) {
            if (e.target === iframeModal) {
                closeIframeModal();
            }
        });
    }
    
    const docModal = document.getElementById('docModal');
    if (docModal) {
        docModal.addEventListener('click', function(e) {
            if (e.target === docModal) {
                closeDocumentModal();
            }
        });
    }
}

// INTELLIGENCE MODAL FUNCTIONS
function openIntelligenceModal(moduleName, moduleUrl, moduleTitle) {
    // Check if module exists (for placeholders)
    const existingModules = ['wo_intel', 'kpi_intel', 'pvt_intel', 'stk_intel', 'cal_intel', 'consulting'];
    
    if (!existingModules.includes(moduleName)) {
        // Show placeholder in iframe
        showPlaceholderInModal(moduleTitle);
        return;
    }
    
    const modal = document.getElementById('iframeModal');
    const iframe = document.getElementById('intelIframe');
    const titleElem = document.getElementById('modalTitle');
    
    if (modal && iframe && titleElem) {
        titleElem.textContent = moduleTitle;
        iframe.src = moduleUrl;
        modal.style.display = 'flex';
    }
}

function showPlaceholderInModal(moduleTitle) {
    const modal = document.getElementById('iframeModal');
    const iframe = document.getElementById('intelIframe');
    const titleElem = document.getElementById('modalTitle');
    
    if (modal && iframe && titleElem) {
        titleElem.textContent = moduleTitle + ' (Coming Soon)';
        
        // Create placeholder HTML
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
                    <h2>Coming Soon</h2>
                    <p>Module under development</p>
                    <p style="font-size: 0.9rem;">${moduleTitle} will be available in the next release</p>
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
    }
    
    // Restaurar breadcrumbs cuando se cierra el modal
    const breadcrumbDynamic = document.getElementById('dynamicBreadcrumb');
    if (breadcrumbDynamic) {
        breadcrumbDynamic.style.display = 'none';
        breadcrumbDynamic.textContent = '';
    }
}

// ============================================
// EAMS HANDLERS - ACTUALIZADO
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
        default:
            console.log('Unknown EAMS module:', module);
    }
}

function openAssetDispatcher() {
    // Load ASSET dispatcher via fetch
    const dynamicContent = document.getElementById('dynamicContent');
    const breadcrumbDynamic = document.getElementById('dynamicBreadcrumb');
    
    if (dynamicContent) {
        fetch('/app/modules/eams/ast_dispatcher.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Dispatcher not found');
                }
                return response.text();
            })
            .then(html => {
                dynamicContent.innerHTML = html;
                
                // Update breadcrumbs
                if (breadcrumbDynamic) {
                    breadcrumbDynamic.textContent = 'ASSETS';
                    breadcrumbDynamic.style.display = 'inline';
                }
                
                // Initialize dispatcher buttons (sin "coming soon")
                initAstDispatcherButtons();
            })
            .catch(error => {
                console.error('Error loading ASSET dispatcher:', error);
                dynamicContent.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Error loading Asset Dispatcher</h3>
                        <p>Please try again later</p>
                    </div>
                `;
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
        fetch('/app/modules/eams/wo_dispatcher.html')
            .then(response => {
                if (!response.ok) throw new Error('Dispatcher not found');
                return response.text();
            })
            .then(html => {
                dynamicContent.innerHTML = html;
                if (breadcrumbDynamic) {
                    breadcrumbDynamic.textContent = 'WORK ORDERS';
                    breadcrumbDynamic.style.display = 'inline';
                }
                initWoDispatcherButtons();
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
        fetch('/app/modules/eams/pvt_dispatcher.html')
            .then(response => {
                if (!response.ok) throw new Error('Dispatcher not found');
                return response.text();
            })
            .then(html => {
                dynamicContent.innerHTML = html;
                if (breadcrumbDynamic) {
                    breadcrumbDynamic.textContent = 'PREVENTIVE';
                    breadcrumbDynamic.style.display = 'inline';
                }
                initPvtDispatcherButtons();
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
        fetch('/app/modules/eams/stk_dispatcher.html')
            .then(response => {
                if (!response.ok) throw new Error('Dispatcher not found');
                return response.text();
            })
            .then(html => {
                dynamicContent.innerHTML = html;
                if (breadcrumbDynamic) {
                    breadcrumbDynamic.textContent = 'INVENTORY';
                    breadcrumbDynamic.style.display = 'inline';
                }
                initStkDispatcherButtons();
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
        fetch('/app/modules/eams/cal_dispatcher.html')
            .then(response => {
                if (!response.ok) throw new Error('Dispatcher not found');
                return response.text();
            })
            .then(html => {
                dynamicContent.innerHTML = html;
                if (breadcrumbDynamic) {
                    breadcrumbDynamic.textContent = 'CALIBRATION';
                    breadcrumbDynamic.style.display = 'inline';
                }
                initCalDispatcherButtons();
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
    const modal = document.getElementById('iframeModal');
    const iframe = document.getElementById('intelIframe');
    const titleElem = document.getElementById('modalTitle');
    
    if (modal && iframe && titleElem) {
        titleElem.textContent = 'Plant Layout';
        iframe.src = '/app/modules/eams/plant_layout.html';
        modal.style.display = 'flex';
        
        const breadcrumbDynamic = document.getElementById('dynamicBreadcrumb');
        if (breadcrumbDynamic) {
            breadcrumbDynamic.textContent = 'PLANT LAYOUT';
            breadcrumbDynamic.style.display = 'inline';
        }
    }
}

// ============================================
// FUNCIÓN AUXILIAR PARA ABRIR MODALES
// ============================================

function openIframeModalWithTitle(title, url) {
    const modal = document.getElementById('iframeModal');
    const iframe = document.getElementById('intelIframe');
    const titleElem = document.getElementById('modalTitle');
    
    if (modal && iframe && titleElem) {
        titleElem.textContent = title;
        iframe.src = url;
        modal.style.display = 'flex';
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
    
    const modal = document.getElementById('iframeModal');
    const iframe = document.getElementById('intelIframe');
    const titleElem = document.getElementById('modalTitle');
    
    if (modal && iframe && titleElem) {
        titleElem.textContent = title;
        iframe.src = url;
        modal.style.display = 'flex';
        
        // Actualizar breadcrumbs
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

// ============================================
// LOAD USER PERMISSIONS FROM LOCALSTORAGE
// ============================================

async function loadUserRoleAndPermissions() {
    const loadingDiv = document.getElementById('dynamicContent');
    
    try {
        // Obtener el rol directamente desde localStorage (viene de WEB_USERS)
        const session = JSON.parse(localStorage.getItem('adkintor_session'));
        const userRole = session.role || 'VIEWER';
        const userName = session.userName || session.name || session.email.split('@')[0];
        
        console.log('User role from localStorage:', userRole);
        console.log('User name from localStorage:', userName);
        
        currentUserRole = userRole;
        
        // Aplicar permisos según el rol
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

function applyPermissionsByRole() {
    // Define permission mapping based on role
    const rolePermissions = {
        'ADMIN': ['WORK_ORDERS', 'PREVENTIVE', 'INVENTORY', 'CALIBRATION', 'KPI', 'CONSULTING', 'ASSETS', 'PLANT_LAYOUT'],
        'MANAGER': ['WORK_ORDERS', 'PREVENTIVE', 'INVENTORY', 'CALIBRATION', 'KPI', 'ASSETS'],
        'SUPERVISOR': ['WORK_ORDERS', 'PREVENTIVE', 'INVENTORY', 'ASSETS'],
        'TECHNICIAN': ['WORK_ORDERS', 'ASSETS'],
        'PLANNER': ['PREVENTIVE', 'WORK_ORDERS'],
        'VIEWER': ['WORK_ORDERS'],
        'FINANCE': ['INVENTORY', 'KPI']
    };
    
    const permissions = rolePermissions[currentUserRole] || rolePermissions['VIEWER'];
    
    // Hide/Show sidebar buttons
    const sidebarBtns = document.querySelectorAll('.sidebar-btn');
    sidebarBtns.forEach(btn => {
        const permission = btn.getAttribute('data-permission');
        if (permission && permissions.includes(permission)) {
            btn.style.display = 'flex';
        } else {
            btn.style.display = 'none';
        }
    });
    
    // Hide/Show EAMS buttons
    const eamsBtns = document.querySelectorAll('.eams-btn');
    eamsBtns.forEach(btn => {
        const permission = btn.getAttribute('data-permission');
        if (permission && permissions.includes(permission)) {
            btn.style.display = 'inline-block';
        } else {
            btn.style.display = 'none';
        }
    });
}    
    
}
