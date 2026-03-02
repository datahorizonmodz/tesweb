import { executeMusicCommand } from "./music.js";
import { clearInactivePages, renderActivePage } from "./render.js";

// DOM Elements
const htmlTag = document.documentElement;
const themeBtn = document.getElementById('theme-btn');
const navBtns = document.querySelectorAll('.nav-btn[data-target]');
const pages = document.querySelectorAll('.page');
const navIndicator = document.getElementById('nav-indicator');
const mainNav = document.getElementById('main-nav');
const searchTrigger = document.getElementById('search-trigger');
const searchClose = document.getElementById('search-close');
const searchInput = document.getElementById('search-input');
const searchWrapper = document.getElementById('search-wrapper');
const filterContainer = document.getElementById('filter-container');
const filterTrack = document.getElementById('filter-track');
const modal = document.getElementById('product-modal');
const closeModalBtn = document.getElementById('close-modal');

// Admin Login DOM Elements
const loginModal = document.getElementById('login-modal');
const loginBox = document.getElementById('login-box');
const closeLoginModal = document.getElementById('close-login-modal');
const adminLoginForm = document.getElementById('admin-login-form');
const adminUsername = document.getElementById('admin-username');
const adminPassword = document.getElementById('admin-password');
const toggleUserEye = document.getElementById('toggle-user-eye');
const togglePassEye = document.getElementById('toggle-pass-eye');

const filterCategories = ['Popular', 'Editing', 'Enhancer', 'Music', 'Film', 'Anime', 'Random'];

let isDraggingFilter = false;
let filterPauseTimer;
let isDraggingIndicator = false;
let dragStartX = 0;
let indicatorInitialLeft = 0;
let currentDragLeft = 0;

// GLOBAL BACKDROP LOGIC
export function showGlobalBackdrop(zIndex) {
    const gb = document.getElementById('global-backdrop');
    if (gb) {
        gb.style.zIndex = zIndex;
        gb.classList.add('show');
    }
}

export function hideGlobalBackdrop() {
    const gb = document.getElementById('global-backdrop');
    if (gb) gb.classList.remove('show');
}

export function hideGlobalLoader() {
    const loader = document.getElementById('global-loader');
    if (loader && !loader.classList.contains('hidden')) {
        loader.classList.add('hidden');
        document.body.classList.add('loaded-state');
        hideGlobalBackdrop(); 
        
        // Pemicu render aman saat halaman pertama kali termuat penuh
        const activeBtn = document.querySelector('.nav-btn.active');
        if (activeBtn) {
            renderActivePage(activeBtn.dataset.target);
        }
    }
}

// PAGE TRANSITION ANIMATED TEXT
let loadingInterval;
function startLoadingText() {
    const loaderText = document.getElementById('loading-text');
    const loader = document.getElementById('page-transition-loader');
    if (!loader || !loaderText) return;
    loader.classList.add('active');
    let dots = 0;
    loadingInterval = setInterval(() => {
        dots = (dots + 1) % 4;
        loaderText.textContent = "Checking Data" + ".".repeat(dots);
    }, 250);
}

function stopLoadingText() {
    clearInterval(loadingInterval);
    const loader = document.getElementById('page-transition-loader');
    if (loader) loader.classList.remove('active');
}

export function showProductModal(product) {
  document.getElementById('modal-img').src = product.imageUrl || '';
  document.getElementById('modal-title').textContent = product.name || product.title || '';
    
  let priceHtml = '';
  if (Array.isArray(product.priceText) && product.priceText.length > 0) {
    priceHtml = product.priceText.map(price => `<div style="margin-bottom: 4px;">- ${price}</div>`).join('');
  } else if (product.priceText) {
    priceHtml = `<div style="margin-bottom: 4px;">- ${product.priceText}</div>`;
  } else {
    priceHtml = `<div style="margin-bottom: 4px;">-</div>`;
  }
    
  const modalPrices = document.getElementById('modal-prices');
  modalPrices.style.textAlign = 'left'; 
  modalPrices.innerHTML = `
    <div style="font-weight: 800; color: var(--text-muted); font-size: 1rem; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">LIST HARGA</div>
    <div style="font-weight: normal; color: var(--text-main); font-size: 0.95rem; line-height: 1.5;">${priceHtml}</div>
  `;

  const descH4 = document.querySelector('.modal-section h4');
  if (descH4) descH4.style.display = 'none';

  const modalDesc = document.getElementById('modal-desc');
  modalDesc.style.textAlign = 'left';
  modalDesc.innerHTML = `
    <div style="font-weight: 800; color: var(--text-muted); font-size: 1rem; margin-bottom: 8px; margin-top: 16px; text-transform: uppercase; letter-spacing: 0.5px;">DESKRIPSI PRODUK</div>
    <div style="color: var(--text-main); font-size: 0.95rem; line-height: 1.6; white-space: pre-wrap;">${product.description || '-'}</div>
  `;

  const waBtn = document.getElementById('modal-wa-btn');
  if (waBtn) {
    waBtn.href = product.whatsappLink || product.targetLink || '#';
    waBtn.target = '_blank';
    waBtn.rel = 'noopener noreferrer';
  }

  showGlobalBackdrop(199); 
  modal.classList.add('show');
  document.body.classList.add('modal-open');

  setTimeout(() => {
    const scrollArea = document.getElementById('modal-scroll-area');
    const scrollIndicator = document.getElementById('scroll-indicator');
    const scrollShadow = document.getElementById('scroll-shadow');
    
    if(!scrollArea) return;
    scrollArea.scrollTop = 0;

    const isScrollable = scrollArea.scrollHeight > (scrollArea.clientHeight + 2);
    if (isScrollable) {
        scrollIndicator.style.opacity = '1';
        scrollShadow.style.opacity = '1';
        scrollIndicator.style.transform = 'translateX(-50%) translateY(0)';
    } else {
        scrollIndicator.style.opacity = '0';
        scrollShadow.style.opacity = '0';
    }

    scrollArea.onscroll = () => {
        const scrollPos = scrollArea.scrollTop + scrollArea.clientHeight;
        const distanceToBottom = scrollArea.scrollHeight - scrollPos;

        if (distanceToBottom <= 15) {
            scrollIndicator.style.opacity = '0';
            scrollShadow.style.opacity = '0';
            scrollIndicator.style.transform = 'translateX(-50%) translateY(10px)';
        } else {
            scrollIndicator.style.opacity = '1';
            scrollShadow.style.opacity = '1';
            scrollIndicator.style.transform = 'translateX(-50%) translateY(0)';
        }
    };
  }, 250);
}

export function initUI() {
  setTimeout(hideGlobalLoader, 8000); // Failsafe loader

  themeBtn.addEventListener('click', () => {
    const isDark = htmlTag.getAttribute('data-theme') === 'dark';
    htmlTag.setAttribute('data-theme', isDark ? 'light' : 'dark');
  });

  // PAGE NAVIGATION (Lazy Rendering Logic)
  navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
          const targetId = btn.dataset.target;
          if (document.getElementById(targetId).classList.contains('active')) return;

          navBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          startLoadingText();
          
          requestAnimationFrame(() => {
              setTimeout(() => {
                  pages.forEach(p => p.classList.remove('active'));
                  document.getElementById(targetId).classList.add('active');

                  clearInactivePages(targetId);
                  renderActivePage(targetId);

                  updateIndicator(btn);
                  if (mainNav.classList.contains('nav-search-active')) closeSearch();
                  
                  setTimeout(stopLoadingText, 100); 
              }, 50); 
          });
      });
  });

  window.addEventListener('load', () => {
      const activeBtn = document.querySelector('.nav-btn.active[data-target]');
      setTimeout(() => updateIndicator(activeBtn), 300);
      buildFilters();
  });
  
  window.addEventListener('resize', () => {
      const activeBtn = document.querySelector('.nav-btn.active[data-target]');
      updateIndicator(activeBtn);
  });

  searchTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (mainNav.classList.contains('nav-search-active')) {
          const query = searchInput.value.trim().toLowerCase();
          if (query === '/admin') {
              triggerExistingSearchClose();
              checkAdminAccess();
          } else if (executeMusicCommand(searchInput.value)) {
              triggerExistingSearchClose();
          }
          return;
      }
      mainNav.classList.add('nav-search-active');
      updateIndicator(null);
      setTimeout(() => searchInput.focus(), 300);
  });

  searchClose.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); closeSearch(); }, {passive: false});
  searchClose.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); closeSearch(); });
  searchClose.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); closeSearch(); });
  
  document.addEventListener('click', (e) => {
      if (mainNav.classList.contains('nav-search-active') && !searchWrapper.contains(e.target)) closeSearch();
  });
  
  searchWrapper.addEventListener('click', (e) => e.stopPropagation());
  searchInput.addEventListener('input', (e) => triggerFilter(e.target.value.toLowerCase()));

  searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
          const query = searchInput.value.trim().toLowerCase();
          if (query === '/admin') {
              triggerExistingSearchClose();
              checkAdminAccess();
          } else if (executeMusicCommand(searchInput.value)) {
              triggerExistingSearchClose();
          }
      }
  });

  if(filterContainer) {
      filterContainer.addEventListener('touchstart', pauseFilterAutoScroll, {passive: true});
      filterContainer.addEventListener('mousedown', pauseFilterAutoScroll);
      filterContainer.addEventListener('touchend', resumeFilterAutoScroll);
      filterContainer.addEventListener('mouseup', resumeFilterAutoScroll);
      filterContainer.addEventListener('mouseleave', resumeFilterAutoScroll);
      filterContainer.addEventListener('wheel', pauseFilterAutoScroll, {passive: true});
  }

  if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
          modal.classList.remove('show');
          document.body.classList.remove('modal-open');
          hideGlobalBackdrop();
      });
  }
  if (modal) {
      modal.addEventListener('click', (e) => {
          if (e.target === modal) {
              modal.classList.remove('show');
              document.body.classList.remove('modal-open');
              hideGlobalBackdrop();
          }
      });
  }

  if (closeLoginModal) {
      closeLoginModal.addEventListener('click', () => {
          loginModal.classList.remove('show');
          hideGlobalBackdrop();
      });
  }
  if (loginModal) {
      loginModal.addEventListener('click', (e) => { 
          if (e.target === loginModal) {
              loginModal.classList.remove('show');
              hideGlobalBackdrop();
          }
      });
  }

  if (adminLoginForm) {
      adminLoginForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const u = adminUsername.value;
          const p = adminPassword.value;

          if (u === 'izindatzon' && p === 'qwert67') {
              localStorage.setItem('datzon_admin_auth_expiry', Date.now() + (60 * 60 * 1000));
              loginBox.classList.add('fade-out');
              setTimeout(() => {
                  window.location.href = 'admin.html';
              }, 300);
          } else {
              loginBox.classList.remove('shake');
              void loginBox.offsetWidth; 
              loginBox.classList.add('shake');
              adminUsername.value = '';
              adminPassword.value = '';
          }
      });
  }

  function setupEyeToggle(btn, input) {
      if(!btn || !input) return;
      btn.addEventListener('click', () => {
          if (input.type === 'password') {
              input.type = 'text';
              btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"></path></svg>`;
          } else {
              input.type = 'password';
              btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
          }
      });
  }
  
  setupEyeToggle(toggleUserEye, adminUsername);
  setupEyeToggle(togglePassEye, adminPassword);

  mainNav.addEventListener('mousedown', handleDragStart);
  mainNav.addEventListener('touchstart', handleDragStart, { passive: true });
  document.addEventListener('mousemove', handleDragMove);
  document.addEventListener('touchmove', handleDragMove, { passive: false });
  document.addEventListener('mouseup', handleDragEnd);
  document.addEventListener('touchend', handleDragEnd);
}

function checkAdminAccess() {
    const AUTH_KEY = 'datzon_admin_auth_expiry';
    const expiry = localStorage.getItem(AUTH_KEY);
    if (expiry && Date.now() < parseInt(expiry)) {
        window.location.href = 'admin.html';
    } else {
        loginBox.classList.remove('fade-out');
        showGlobalBackdrop(99998); 
        loginModal.classList.add('show');
        adminUsername.focus();
    }
}

function updateIndicator(btn) {
    if (!btn) return;
    if (mainNav.classList.contains('nav-search-active')) {
        navIndicator.style.opacity = '0';
        return;
    }
    const navRect = mainNav.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const width = 72;
    const left = (btnRect.left - navRect.left) + (btnRect.width / 2) - (width / 2);
    navIndicator.style.width = `${width}px`;
    navIndicator.style.left = `${left}px`;
    navIndicator.style.opacity = '1';
}

function closeSearch() {
    if (!mainNav.classList.contains('nav-search-active')) return;
    mainNav.classList.remove('nav-search-active');
    searchInput.value = '';
    triggerFilter('');
    searchInput.blur();
    setTimeout(() => {
        const activeBtn = document.querySelector('.nav-btn.active[data-target]');
        updateIndicator(activeBtn);
    }, 400); 
}

function triggerExistingSearchClose() {
    searchClose.click();
}

// FILTER PADA HALAMAN AKTIF SAJA UNTUK OPTIMASI
function triggerFilter(query) {
    let visibleCount = 0;
    const activePage = document.querySelector('.page.active').id;
    const containerId = activePage === 'page-home' ? 'home-list' : activePage === 'page-store' ? 'store-list' : null;
    
    if(!containerId) return;

    document.querySelectorAll(`#${containerId} .item-card`).forEach(item => {
        if(item.dataset.name.toLowerCase().includes(query)) {
            item.style.display = 'flex';
            item.classList.remove('stagger-card');
            void item.offsetWidth; 
            item.style.animationDelay = `${(visibleCount % 15) * 0.05}s`;
            item.classList.add('stagger-card');
            visibleCount++;
        } else {
            item.style.display = 'none';
            item.classList.remove('stagger-card');
        }
    });

    const noResId = activePage === 'page-home' ? 'home-no-results' : 'store-no-results';
    const noResEl = document.getElementById(noResId);
    if (noResEl) noResEl.style.display = (visibleCount === 0) ? 'block' : 'none';
}

function buildFilters() {
    const arr = ['All', ...filterCategories];
    const fullArr = [...arr, ...arr]; 
    fullArr.forEach((cat, index) => {
        const btn = document.createElement('div');
        btn.className = `filter-tag ${cat === 'All' ? 'active' : ''}`;
        
        if (index >= arr.length) btn.classList.add('duplicate-tag');
        
        btn.textContent = cat;
        btn.dataset.cat = cat;
        btn.addEventListener('click', () => {
            selectFilter(cat);
            pauseFilterAutoScroll();
            resumeFilterAutoScroll();
        });
        filterTrack.appendChild(btn);
    });
    requestAnimationFrame(autoScrollFilter);
}

function autoScrollFilter() {
    if (!isDraggingFilter && filterContainer && window.innerWidth < 768) {
        filterContainer.scrollLeft += 0.8; 
        if (filterContainer.scrollLeft >= filterTrack.scrollWidth / 2) filterContainer.scrollLeft = 0; 
    }
    requestAnimationFrame(autoScrollFilter);
}

function pauseFilterAutoScroll() { isDraggingFilter = true; clearTimeout(filterPauseTimer); }

function resumeFilterAutoScroll() {
    clearTimeout(filterPauseTimer);
    filterPauseTimer = setTimeout(() => { isDraggingFilter = false; }, 1000);
}

function selectFilter(category) {
    const cat = category.toLowerCase();
    document.querySelectorAll('.filter-tag').forEach(t => {
        t.classList.toggle('active', t.dataset.cat.toLowerCase() === category.toLowerCase());
    });
    
    let visibleCount = 0;
    document.querySelectorAll('#home-list .item-card').forEach(item => {
        const itemCategories = item.dataset.category ? item.dataset.category.split(',') : [];
        if (cat === 'all' || itemCategories.includes(cat)) {
            item.style.display = 'flex';
            item.classList.remove('stagger-card');
            void item.offsetWidth; 
            item.style.animationDelay = `${(visibleCount % 15) * 0.05}s`;
            item.classList.add('stagger-card');
            visibleCount++;
        } else {
            item.style.display = 'none';
            item.classList.remove('stagger-card');
        }
    });
    
    const hNoRes = document.getElementById('home-no-results');
    if (hNoRes) hNoRes.style.display = visibleCount === 0 ? 'block' : 'none';
}

function handleDragStart(e) {
    if (mainNav.classList.contains('nav-search-active')) return;
    const targetBtn = e.target.closest('.nav-btn');
    if (targetBtn && targetBtn.classList.contains('active')) {
        let clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        isDraggingIndicator = true;
        dragStartX = clientX;
        indicatorInitialLeft = parseFloat(navIndicator.style.left || 0);
        currentDragLeft = indicatorInitialLeft;
        navIndicator.classList.add('dragging');
        document.body.style.userSelect = 'none';
    }
}

function handleDragMove(e) {
    if (!isDraggingIndicator) return;
    if (e.type === 'touchmove') e.preventDefault();
    let clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    let deltaX = clientX - dragStartX;
    currentDragLeft = indicatorInitialLeft + deltaX;

    const navRect = mainNav.getBoundingClientRect();
    const indicatorWidth = parseFloat(navIndicator.style.width || 72);
    const minLeft = 4; 
    const maxLeft = navRect.width - indicatorWidth - 4;

    if (currentDragLeft < minLeft) currentDragLeft = minLeft;
    if (currentDragLeft > maxLeft) currentDragLeft = maxLeft;

    navIndicator.style.left = `${currentDragLeft}px`;
}

function handleDragEnd(e) {
    if (!isDraggingIndicator) return;
    isDraggingIndicator = false;
    navIndicator.classList.remove('dragging');
    document.body.style.userSelect = '';

    const navRect = mainNav.getBoundingClientRect();
    const indicatorCenter = navRect.left + currentDragLeft + (parseFloat(navIndicator.style.width || 72) / 2);

    const targets = Array.from(document.querySelectorAll('.nav-btn[data-target], #search-wrapper'));
    let closestBtn = null;
    let minDistance = Infinity;

    targets.forEach(btn => {
        const btnRect = btn.getBoundingClientRect();
        const btnCenter = btnRect.left + (btnRect.width / 2);
        const distance = Math.abs(btnCenter - indicatorCenter);
        if (distance < minDistance) {
            minDistance = distance;
            closestBtn = btn;
        }
    });

    if (closestBtn) {
        if (closestBtn.id === 'search-wrapper') {
            if (!mainNav.classList.contains('nav-search-active')) document.getElementById('search-trigger').click();
            else updateIndicator(null);
        } else {
            closestBtn.click();
        }
    } else {
        const activeBtn = document.querySelector('.nav-btn.active[data-target]');
        updateIndicator(activeBtn);
    }
}
