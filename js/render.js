// Local Cache State
export const state = { apps: [], products: [], profiles: [] };
const dataMap = new Map();

// INTERSECTION OBSERVER - Optimasi render memori dengan viewport virtualization
const itemObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            if (el.dataset.rendered === 'false') {
                const id = el.dataset.id;
                const type = el.dataset.type;
                const data = dataMap.get(id);
                
                if (data) {
                    populateCardContent(el, data, type);
                    el.dataset.rendered = 'true';
                }
            }
        }
    });
}, { rootMargin: '250px 0px' }); // Render dikit lebih awal (250px sebelum masuk viewport)

// HANDLER DIFFING DATA DARI FIREBASE
export function handleDocChanges(type, changes) {
    changes.forEach(change => {
        const docData = { id: change.doc.id, ...change.doc.data() };
        
        if (change.type === 'added') {
            state[type].push(docData);
            dataMap.set(docData.id, docData);
            if (isPageActiveForType(type)) addDocToDOM(type, docData);
        } 
        else if (change.type === 'modified') {
            const index = state[type].findIndex(item => item.id === docData.id);
            if (index > -1) state[type][index] = docData;
            dataMap.set(docData.id, docData);
            if (isPageActiveForType(type)) updateDocInDOM(type, docData);
        } 
        else if (change.type === 'removed') {
            state[type] = state[type].filter(item => item.id !== docData.id);
            dataMap.delete(docData.id);
            if (isPageActiveForType(type)) removeDocFromDOM(docData.id);
        }
    });

    if (type === 'profiles') {
        // Selalu urutkan profiles
        state.profiles.sort((a, b) => (a.order || 0) - (b.order || 0));
        if (isPageActiveForType('profiles')) renderProfiles(); 
    }
}

function isPageActiveForType(type) {
    if (type === 'apps') return document.getElementById('page-home').classList.contains('active');
    if (type === 'products') return document.getElementById('page-store').classList.contains('active');
    if (type === 'profiles') return document.getElementById('page-profile').classList.contains('active');
    return false;
}

// PAGE-BASED LAZY RENDERING CORE
export function clearInactivePages(activePageId) {
    itemObserver.disconnect(); // Bersihkan memori observer sebelum pindah halaman
    if (activePageId !== 'page-home') document.getElementById('home-list').innerHTML = '';
    if (activePageId !== 'page-store') document.getElementById('store-list').innerHTML = '';
    if (activePageId !== 'page-profile') document.getElementById('profile-list').innerHTML = '';
}

export function renderActivePage(pageId) {
    if (pageId === 'page-home') fullRenderVirtualList('apps', 'home-list');
    else if (pageId === 'page-store') fullRenderVirtualList('products', 'store-list');
    else if (pageId === 'page-profile') renderProfiles(); // Profile tidak di-virtualize
}

// FULL RENDER DENGAN VIRTUALISASI (SHELLS ONLY)
function fullRenderVirtualList(type, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    const frag = document.createDocumentFragment();

    state[type].forEach(item => {
        const shell = createCardShell(type, item);
        frag.appendChild(shell);
        itemObserver.observe(shell);
    });

    container.appendChild(frag);
}

// BIKIN CANGKANG UNTUK OBSERVER (Kosong untuk performa, siap diisi saat scroll)
function createCardShell(type, item) {
    const el = document.createElement(type === 'apps' ? 'a' : 'div');
    el.className = `item-card glass ${type === 'apps' ? 'app-item' : 'store-item'}`;
    el.dataset.id = item.id;
    el.dataset.type = type;
    el.dataset.rendered = 'false';

    if (type === 'apps') {
        el.href = item.targetLink || '#';
        el.target = '_blank';
        el.rel = 'noopener noreferrer';
        el.dataset.category = Array.isArray(item.category)
            ? item.category.map(c => c.toLowerCase()).join(',')
            : (item.category || 'all').toLowerCase();
        el.dataset.name = item.name || item.title || '';
    } else if (type === 'products') {
        el.dataset.name = item.name || '';
        el.addEventListener('click', () => {
            import('./ui.js').then(m => m.showProductModal(item));
        });
    }

    return el;
}

// PENGISIAN KONTEN (Dipanggil saat elemen masuk viewport)
function populateCardContent(el, item, type) {
    if (type === 'apps') {
        let dateString = '';
        if (item.updateDate?.toDate) {
            const dateObj = item.updateDate.toDate();
            dateString = `${dateObj.getDate()} ${dateObj.toLocaleString('en-US', { month: 'short' })} ${dateObj.getFullYear()}`;
        } else if (item.updateDate) {
            dateString = item.updateDate;
        }

        let categoryDisplay = '';
        if (Array.isArray(item.category) && item.category.length > 0) {
            categoryDisplay = item.category.join(' - ');
        } else if (typeof item.category === 'string' && item.category.toLowerCase() !== 'all' && item.category !== '') {
            categoryDisplay = item.category;
        }

        let dateCategoryHtml = dateString;
        if (dateString && categoryDisplay) dateCategoryHtml += ` - ${categoryDisplay}`;
        else if (categoryDisplay) dateCategoryHtml = categoryDisplay;

        el.innerHTML = `
            <img src="${item.imageUrl || 'https://via.placeholder.com/50'}" class="item-icon" alt="Icon">
            <div class="item-info">
                <div class="item-title">
                    ${item.name || item.title || ''}
                    ${item.version ? `<span style="color: var(--text-muted); font-size: 0.85rem; font-weight: normal; margin-left: 6px;">${item.version}</span>` : ''}
                </div>
                <div class="item-date">${dateCategoryHtml}</div>
            </div>
            <div class="item-action">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </div>
        `;
    } else if (type === 'products') {
        el.innerHTML = `
            <img src="${item.imageUrl || 'https://via.placeholder.com/50'}" class="item-icon" alt="Icon">
            <div class="item-info">
                <div class="item-title">${item.name || 'Product'}</div>
                <div class="item-date">${item.price || '-'}</div>
            </div>
            <div class="item-action">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            </div>
        `;
    }

    // Trigger animasi entrance tanpa membebani thread saat mass-rendering
    el.style.animation = 'none';
    void el.offsetWidth; // force reflow
    el.classList.add('stagger-card');
}

// REALTIME DOM UPDATES
function addDocToDOM(type, docData) {
    if (type === 'profiles') return;
    const container = document.getElementById(type === 'apps' ? 'home-list' : 'store-list');
    const shell = createCardShell(type, docData);
    container.appendChild(shell);
    itemObserver.observe(shell);
}

function updateDocInDOM(type, docData) {
    if (type === 'profiles') return;
    const el = document.querySelector(`.item-card[data-id="${docData.id}"]`);
    if (el) {
        if (el.dataset.rendered === 'true') {
            populateCardContent(el, docData, type);
        }
        if (type === 'apps') {
            el.dataset.category = Array.isArray(docData.category) ? docData.category.map(c => c.toLowerCase()).join(',') : (docData.category || 'all').toLowerCase();
            el.dataset.name = docData.name || docData.title || '';
        } else if (type === 'products') {
            el.dataset.name = docData.name || '';
        }
    }
}

function removeDocFromDOM(id) {
    const el = document.querySelector(`.item-card[data-id="${id}"]`);
    if (el) {
        itemObserver.unobserve(el);
        el.remove();
    }
}

// RENDER PROFILES (Kecuali Virtualisasi)
export function renderProfiles() {
    const container = document.getElementById('profile-list');
    container.innerHTML = '';
    const frag = document.createDocumentFragment();

    state.profiles
        .filter(s => s.isActive !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach((social, index) => {
            const el = document.createElement('a');
            el.href = social.targetLink || social.link || '#';
            el.target = '_blank';
            el.rel = 'noopener noreferrer';
            el.className = 'social-btn glass stagger-card';
            el.style.animationDelay = `${index * 0.08}s`;
            el.innerHTML = `
                <div style="display: flex; align-items: center; gap: 16px;">
                    <img src="${social.imageUrl || 'https://via.placeholder.com/40'}" alt="${social.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                    <span style="font-weight: 700; font-size: 1.05rem; letter-spacing: 0.5px;">${social.name || 'Link'}</span>
                </div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 11h12.17l-5.58-5.59L12 4l8 8-8 8-1.41-1.41L16.17 13H4v-2z"/>
                </svg>
            `;
            frag.appendChild(el);
        });
    container.appendChild(frag);
}
