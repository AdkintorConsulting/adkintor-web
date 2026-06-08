// ============================================
// ADKINTOR LAYOUT JS - VERSIÓN CON ROLES Y PERMISOS
// ============================================

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
let currentUserRole = null;
let currentUserEmail = null;
let currentEamsApiUrl = null;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Get session data
    const sessionData = localStorage.getItem('adkintor_session');
    if (!sessionData) {
        window.location.href = '/app/index.html';
        return;
    }
    
    const session = JSON.parse(sessionData);
    currentUserEmail = session.email;
    currentEamsApiUrl = session.eamsApiUrl;
    
    if (!currentEamsApiUrl) {
        showErrorMessage('EAMS API not configured. Please contact administrator.');
        return;
    }
    
    // Get user role from EAMS
    await loadUserRoleAndPermissions();
    
    // Initialize events
    initEventListeners();
    
    // Setup modal close on outside click
    setupModalClose();
});

async function loadUserRoleAndPermissions() {
    const loadingDiv = document.getElementById('dynamicContent');
    if (loadingDiv) {
        loadingDiv.innerHTML = `
            <div class="welcome-message">
                <i class="fas fa-spinner fa-pulse"></i>
                <h2>Loading user permissions...</h2>
                <p>Please wait</p>
            </div>
        `;
    }
    
    try {
        // Primero, obtener el rol desde localStorage (viene de WEB_USERS)
        const session = JSON.parse(localStorage.getItem('adkintor_session'));
        let userRole = session.role || 'VIEWER';
        
        console.log('Role from localStorage (WEB_USERS):', userRole);
        
        // Intentar obtener rol desde EAMS para confirmar
        if (currentEamsApiUrl) {
            try {
                const roleResponse = await callEamsApi('getUserRoleFromHub', [currentUserEmail]);
                console.log('EAMS Role response:', roleResponse);
                
                if (roleResponse && roleResponse.success && roleResponse.data) {
                    if (Array.isArray(roleResponse.data) && roleResponse.data.length > 0) {
                        userRole = roleResponse.data[0];
                    } else if (typeof roleResponse.data === 'string') {
                        userRole = roleResponse.data;
                    }
                    console.log('Role from EAMS (SETUP_HUB):', userRole);
                }
            } catch (eamsError) {
                console.warn('Could not get role from EAMS, using localStorage role:', eamsError);
            }
        }
        
        currentUserRole = userRole;
        console.log('Final user role:', currentUserRole);
        
        // Apply permissions based on role
        applyPermissionsByRole();
        
        // Show welcome message with correct name
        const userName = session.userName || session.name || session.email.split('@')[0];
        const dynamicContent = document.getElementById('dynamicContent');
        if (dynamicContent) {
            dynamicContent.innerHTML = `
                <div class="welcome-message">
                    <i class="fas fa-chalkboard-user"></i>
                    <h2>Welcome back, ${userName}!</h2>
                    <p>Role: ${currentUserRole}</p>
                    <p>Select a module from the sidebar or EAMS buttons to get started</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error loading user role:', error);
        showTemporaryMessage('Could not load permissions. Using default view.');
        showAllButtons();
        
        const session = JSON.parse(localStorage.getItem('adkintor_session'));
        const userName = session.userName || session.name || session.email.split('@')[0];
        const dynamicContent = document.getElementById('dynamicContent');
        if (dynamicContent) {
            dynamicContent.innerHTML = `
                <div class="welcome-message">
                    <i class="fas fa-chalkboard-user"></i>
                    <h2>Welcome back, ${userName}!</h2>
                    <p>Select a module from the sidebar or EAMS buttons to get started</p>
                </div>
            `;
        }
    }
}

function applyPermissionsByRole() {
    // Define permission mapping based on role
    // You can customize which modules each role can access
    const rolePermissions = {
        'ADMIN': ['WORK_ORDERS', 'PREVENTIVE', 'INVENTORY', 'CALIBRATION', 'KPI', 'CONSULTING', 'ASSETS', 'PLANT_LAYOUT'],
        'MANAGER': ['WORK_ORDERS', 'PREVENTIVE', 'INVENTORY', 'CALIBRATION', 'KPI', 'ASSETS'],
        'SUPERVISOR': ['WORK_ORDERS', 'PREVENTIVE', 'INVENTORY', 'ASSETS'],
        'TECHNICIAN': ['WORK_ORDERS', 'ASSETS'],
        'PLANNER': ['PREVENTIVE', 'WORK_ORDERS'],
        'VIEWER': ['WORK_ORDERS'],
        'FINANCE': ['INVENTORY', 'KPI'],
        'AVAILABLE': ['WORK_ORDERS', 'INVENTORY'],
        'AVAILABLE II': ['WORK_ORDERS', 'PREVENTIVE'],
        'AVAILABLE III': ['WORK_ORDERS', 'PREVENTIVE', 'INVENTORY']
    };
    
    const permissions = rolePermissions[currentUserRole] || rolePermissions['VIEWER'];
    
    // Hide/Show sidebar buttons (Intelligence modules)
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

function showAllButtons() {
    const sidebarBtns = document.querySelectorAll('.sidebar-btn');
    sidebarBtns.forEach(btn => btn.style.display = 'flex');
    
    const eamsBtns = document.querySelectorAll('.eams-btn');
    eamsBtns.forEach(btn => btn.style.display = 'inline-block');
}

async function callEamsApi(action, args = []) {
    if (!currentEamsApiUrl) {
        console.error('EAMS API URL not available');
        return { success: false, error: 'EAMS API not configured' };
    }
    
    try {
        const proxyUrl = window.ADKINTOR_CONFIG?.PROXY_URL;
        if (!proxyUrl) {
            console.error('Proxy URL not configured');
            return { success: false, error: 'Proxy not configured' };
        }
        
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                targetUrl: currentEamsApiUrl,
                payload: { action: action, args: args }
            })
        });
        
        return await response.json();
    } catch (error) {
        console.error(`Error calling EAMS API (${action}):`, error);
        return { success: false, error: error.message };
    }
}

function initEventListeners() {
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('adkintor_session');
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
    const existingModules = ['wo_intel', 'kpi'];
    
    if (!existingModules.includes(moduleName)) {
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
            iframe.src = '';
        }
    }
    
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
            showTemporaryMessage('Coming soon - WORK ORDER module under construction');
            break;
        case 'preventive':
            showTemporaryMessage('Coming soon - PREVENTIVE module under construction');
            break;
        case 'calibrations':
            showTemporaryMessage('Coming soon - CALIBRATIONS module under construction');
            break;
        case 'inventory':
            showTemporaryMessage('Coming soon - INVENTORY module under construction');
            break;
        case 'plant_layout':
            showTemporaryMessage('Coming soon - PLANT LAYOUT module under construction');
            break;
        default:
            console.log('Unknown EAMS module:', module);
    }
}

function openAssetDispatcher() {
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
                
                if (breadcrumbDynamic) {
                    breadcrumbDynamic.textContent = 'ASSETS';
                    breadcrumbDynamic.style.display = 'inline';
                }
                
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

function initAstDispatcherButtons() {
    const addAssetBtn = document.getElementById('addAssetBtn');
    const assetMasterBtn = document.getElementById('assetMasterBtn');
    const modifyAssetBtn = document.getElementById('modifyAssetBtn');
    
    if (addAssetBtn) {
        addAssetBtn.addEventListener('click', () => {
            showTemporaryMessage('Coming soon - Web version under development');
        });
    }
    
    if (assetMasterBtn) {
        assetMasterBtn.addEventListener('click', () => {
            showTemporaryMessage('Coming soon - Web version under development');
        });
    }
    
    if (modifyAssetBtn) {
        modifyAssetBtn.addEventListener('click', () => {
            showTemporaryMessage('Coming soon - Web version under development');
        });
    }
}

// DOCUMENT MODAL FUNCTIONS
function openDocumentModal(docTitle) {
    const modal = document.getElementById('docModal');
    const titleElem = document.getElementById('docModalTitle');
    
    if (modal && titleElem) {
        currentDocTitle = docTitle;
        titleElem.textContent = docTitle;
        
        const pdfConfigItem = pdfConfig[docTitle];
        const downloadBtn = document.getElementById('downloadPdfBtn');
        const printBtn = document.getElementById('printPdfBtn');
        
        if (pdfConfigItem && pdfConfigItem.url) {
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

function showErrorMessage(message) {
    const dynamicContent = document.getElementById('dynamicContent');
    if (dynamicContent) {
        dynamicContent.innerHTML = `
            <div class="error-message" style="text-align: center; padding: 2rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #e94560;"></i>
                <h3 style="margin-top: 1rem;">Error</h3>
                <p>${message}</p>
            </div>
        `;
    }
}

function resetBreadcrumbs() {
    const breadcrumbDynamic = document.getElementById('dynamicBreadcrumb');
    if (breadcrumbDynamic) {
        breadcrumbDynamic.style.display = 'none';
        breadcrumbDynamic.textContent = '';
    }
}
