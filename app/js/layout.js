// EAMS HANDLERS (6 modules)
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
                
                // Initialize dispatcher buttons (without "coming soon" message)
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
            openAssetModal('add');
        });
    }
    
    if (assetMasterBtn) {
        assetMasterBtn.addEventListener('click', () => {
            openAssetModal('master');
        });
    }
    
    if (modifyAssetBtn) {
        modifyAssetBtn.addEventListener('click', () => {
            openAssetModal('modify');
        });
    }
}

// Nueva función: Abrir modales de assets
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
    
    // Crear modal de iframe (reutilizando el mismo sistema que Intelligence)
    const modal = document.getElementById('iframeModal');
    const iframe = document.getElementById('intelIframe');
    const titleElem = document.getElementById('modalTitle');
    
    if (modal && iframe && titleElem) {
        titleElem.textContent = title;
        iframe.src = url;
        modal.style.display = 'flex';
        
        // Actualizar breadcrumbs en el main
        updateBreadcrumbsForAsset(type);
    }
}

function updateBreadcrumbsForAsset(type) {
    const breadcrumbDynamic = document.getElementById('dynamicBreadcrumb');
    if (breadcrumbDynamic) {
        let path = '';
        switch(type) {
            case 'add':
                path = 'ASSETS > Add Asset';
                break;
            case 'master':
                path = 'ASSETS > Asset Master';
                break;
            case 'modify':
                path = 'ASSETS > Modify Asset';
                break;
        }
        breadcrumbDynamic.textContent = path;
        breadcrumbDynamic.style.display = 'inline';
    }
}

// Modificar closeIframeModal para restaurar breadcrumbs
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
