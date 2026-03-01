import { hideGlobalLoader, showProductModal } from "./ui.js";

// SENSOR LAYAR (Intersection Observer)
// Memantau elemen mana yang sedang terlihat di layar HP
const observerOptions = {
    root: null,
    rootMargin: '50px 0px', // Render elemen 50px sebelum benar-benar masuk layar
    threshold: 0.05
};

const itemObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
        } else {
            entry.target.classList.remove('in-view');
        }
    });
}, observerOptions);

export function renderApps(apps) {
    const container = document.getElementById('home-list');
    if (!container) return;

    const fragment = document.createDocumentFragment();
    apps.forEach((app, index) => {
        const el = document.createElement('a');
        el.href = app.targetLink || '#';
        el.target = '_blank';
        el.className = 'item-card glass app-item stagger-card'; 
        
        el.dataset.category = Array.isArray(app.category)
            ? app.category.map(c => c.toLowerCase()).join(',')
            : (app.category || 'all').toLowerCase();
        el.dataset.name = app.name || app.title || '';

        let dateString = '';
        if (app.updateDate?.toDate) {
            const dateObj = app.updateDate.toDate();
            dateString = `${dateObj.getDate()} ${dateObj.toLocaleString('en-US', { month: 'short' })} ${dateObj.getFullYear()}`;
        } else if (app.updateDate) {
            dateString = app.updateDate;
        }

        const categoryDisplay = Array.isArray(app.category) ? app.category.join(' - ') : (app.category || '');
        const dateCategoryHtml = [dateString, categoryDisplay].filter(Boolean).join(' - ');

        el.innerHTML = `
            <img src="${app.imageUrl || 'https://via.placeholder.com/50'}" class="item-icon" alt="Icon" loading="lazy">
            <div class="item-info">
                <div class="item-title">
                    ${app.name || app.title || ''}
                    ${app.version ? `<span class="version-tag">${app.version}</span>` : ''}
                </div>
                <div class="item-date">${dateCategoryHtml}</div>
            </div>
            <div class="item-action">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </div>
        `;
        
        // Pasang sensor ke kartu ini
        itemObserver.observe(el);
        fragment.appendChild(el);
    });

    container.innerHTML = ''; 
    container.appendChild(fragment);
    hideGlobalLoader();
}

export function renderProducts(products) {
    const container = document.getElementById('store-list');
    if (!container) return;

    const fragment = document.createDocumentFragment();
    products.forEach((product, index) => {
        const el = document.createElement('div');
        el.className = 'item-card glass store-item stagger-card';
        el.dataset.name = product.name || '';
        
        el.innerHTML = `
            <img src="${product.imageUrl || 'https://via.placeholder.com/50'}" class="item-icon" alt="Icon" loading="lazy">
            <div class="item-info">
                <div class="item-title">${product.name || 'Product'}</div>
                <div class="item-date">${product.price || '-'}</div>
            </div>
            <div class="item-action">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            </div>
        `;
        
        el.addEventListener('click', () => showProductModal(product));
        
        // Pasang sensor ke kartu ini
        itemObserver.observe(el);
        fragment.appendChild(el);
    });

    container.innerHTML = '';
    container.appendChild(fragment);
    hideGlobalLoader();
}

export function renderSocials(socials) {
    const container = document.getElementById('profile-list');
    if (!container) return;

    const fragment = document.createDocumentFragment();
    socials.filter(s => s.isActive !== false)
           .sort((a, b) => (a.order || 0) - (b.order || 0))
           .forEach((social, index) => {
        const el = document.createElement('a');
        el.href = social.targetLink || social.link || '#';
        el.target = '_blank';
        el.className = 'social-btn glass stagger-card';
        
        el.innerHTML = `
            <div style="display: flex; align-items: center; gap: 16px;">
                <img src="${social.imageUrl || 'https://via.placeholder.com/40'}" alt="${social.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" loading="lazy">
                <span style="font-weight: 700; font-size: 1.05rem; letter-spacing: 0.5px;">${social.name || 'Link'}</span>
            </div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 11h12.17l-5.58-5.59L12 4l8 8-8 8-1.41-1.41L16.17 13H4v-2z"/>
            </svg>
        `;
        
        // Pasang sensor ke kartu ini
        itemObserver.observe(el);
        fragment.appendChild(el);
    });

    container.innerHTML = '';
    container.appendChild(fragment);
    hideGlobalLoader();
}