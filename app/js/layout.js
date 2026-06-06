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
    const existingModules = ['wo_intel', 'kpi_intel'];
    
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
}
