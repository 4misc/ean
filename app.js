/**
 * Valerie Starovoit - Interactive Controller (ES Module)
 * Controls Cart, Modals, Gallery Filters, and Studio Journal Mode.
 */

import { products } from './products.js';

// ==========================================================================
// Application State
// ==========================================================================
let cart = JSON.parse(localStorage.getItem('valerie_portfolio_cart')) || [];
let currentFilter = 'all';
let journalModeActive = false; // Signature feature

// Track element that had focus before modal opened (for accessibility)
let previousActiveElement = null;

// ==========================================================================
// DOM Selectors
// ==========================================================================
const DOM = {
  // Navigation & Header
  header: document.getElementById('main-header'),
  navLinks: document.querySelectorAll('.nav-link'),
  mobileNavLinks: document.querySelectorAll('.mobile-nav-link'),
  mobileNav: document.getElementById('mobile-navigation'),
  menuToggle: document.getElementById('mobile-menu-toggle'),
  
  // Gallery & Interactive Toggle
  artGrid: document.getElementById('artworks-grid'),
  filterBtns: document.querySelectorAll('.filter-btn'),
  journalToggleBtn: document.getElementById('journal-toggle-btn'),
  
  // Cart Drawer
  cartBtn: document.getElementById('cart-btn'),
  cartCounter: document.getElementById('cart-counter'),
  cartDrawer: document.getElementById('cart-drawer'),
  cartOverlay: document.getElementById('cart-overlay'),
  cartClose: document.getElementById('cart-close'),
  cartItems: document.getElementById('cart-items'),
  cartTotal: document.getElementById('cart-total'),
  checkoutTrigger: document.getElementById('checkout-trigger'),
  
  // Details Modal
  detailModal: document.getElementById('detail-modal'),
  detailModalClose: document.getElementById('detail-modal-close'),
  detailModalContent: document.getElementById('detail-modal-content'),
  
  // Checkout Modal
  checkoutModal: document.getElementById('checkout-modal'),
  checkoutModalClose: document.getElementById('checkout-modal-close'),
  checkoutForm: document.getElementById('checkout-form'),
  checkoutItemCount: document.getElementById('checkout-item-count'),
  checkoutTotalValue: document.getElementById('checkout-total-value'),
  revolutPayLinkBtn: document.getElementById('revolut-pay-link-btn'),
  
  // Confirmation Modal
  confirmationModal: document.getElementById('confirmation-modal'),
  confirmationClose: document.getElementById('confirmation-close'),
};

// ==========================================================================
// Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  renderGallery();
  updateCartUI();
  setupEventListeners();
  setupScrollSpy();
});

// ==========================================================================
// Gallery Rendering & Asymmetrical Layouts
// ==========================================================================
function renderGallery() {
  if (!DOM.artGrid) return;
  
  // Apply the active state class to the grid based on toggle state
  if (journalModeActive) {
    DOM.artGrid.classList.add('journal-mode-active');
  } else {
    DOM.artGrid.classList.remove('journal-mode-active');
  }
  
  // Filter products based on active tab
  const filteredProducts = products.filter(product => {
    if (currentFilter === 'all') return true;
    return product.type === currentFilter;
  });
  
  // Clear grid
  DOM.artGrid.innerHTML = '';
  
  if (filteredProducts.length === 0) {
    DOM.artGrid.innerHTML = `<p class="cart-empty-message">No artworks found in this category.</p>`;
    return;
  }
  
  filteredProducts.forEach((product, index) => {
    const card = document.createElement('article');
    card.className = 'art-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    // Add ribbon to award winner
    const isAwardWinner = product.id === 'rape-of-europe';
    const badgeHTML = isAwardWinner 
      ? `<div class="art-card-badge">SCC Award Winner</div>` 
      : '';
      
    // Structuring standard commercial elements and the poetic journal overlay inside the card
    card.innerHTML = `
      ${badgeHTML}
      <div class="art-card-img-wrapper">
        <img src="${product.imageURL}" alt="${product.title}" loading="lazy">
        <div class="art-card-overlay">
          <button class="art-card-overlay-btn" data-id="${product.id}">View Details</button>
        </div>
      </div>
      
      <div class="art-card-info">
        <!-- Default Commercial Info view -->
        <div class="art-card-default-view">
          <div class="art-card-meta">
            <span class="art-card-type">${product.type}</span>
            <span class="art-card-price">&euro;${product.price.toLocaleString()}</span>
          </div>
          <h3 class="art-card-title">${product.title}</h3>
          <p class="art-card-medium">${product.medium}</p>
        </div>
        
        <!-- Interactive tactile journal view -->
        <div class="art-card-journal-view">
          <div class="art-card-journal-badge">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 12px; height: 12px; stroke-width: 2;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
            Studio Log
          </div>
          <p class="art-card-journal-text">${product.studioNotes}</p>
          <span class="art-card-journal-prompt">Read Valerie's Thoughts →</span>
        </div>
      </div>
    `;
    
    // Clicking the card opens the details modal
    card.addEventListener('click', (e) => {
      if (!e.target.classList.contains('art-card-overlay-btn')) {
        openDetailModal(product.id);
      }
    });
    
    // Wire up detail overlay button
    const overlayBtn = card.querySelector('.art-card-overlay-btn');
    if (overlayBtn) {
      overlayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openDetailModal(product.id);
      });
    }
    
    DOM.artGrid.appendChild(card);
  });
}

function handleFilterClick(e) {
  DOM.filterBtns.forEach(btn => btn.classList.remove('active'));
  e.currentTarget.classList.add('active');
  
  currentFilter = e.currentTarget.getAttribute('data-filter');
  renderGallery();
}

// Toggling the signature Studio Journal Mode
function toggleJournalMode() {
  journalModeActive = !journalModeActive;
  
  // Update toggle button visuals
  if (journalModeActive) {
    DOM.journalToggleBtn.classList.add('active');
    DOM.journalToggleBtn.setAttribute('aria-checked', 'true');
  } else {
    DOM.journalToggleBtn.classList.remove('active');
    DOM.journalToggleBtn.setAttribute('aria-checked', 'false');
  }
  
  // Re-trigger layout rendering with smooth class fades
  renderGallery();
}

// ==========================================================================
// E-Commerce Cart Logic (LocalStorage)
// ==========================================================================
function addToCart(productId) {
  const existingItemIndex = cart.findIndex(item => item.id === productId);
  
  // Original fine art is 1-of-1: enforce 1 quantity limit per piece
  if (existingItemIndex > -1) {
    alertCollector("This original artwork is a unique, one-of-a-kind creation. You cannot purchase multiple quantities of the same piece.");
  } else {
    cart.push({ id: productId, quantity: 1 });
  }
  
  saveCart();
  updateCartUI();
  openCartDrawer();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
  updateCartUI();
}

function updateQuantity(productId, delta) {
  const item = cart.find(item => item.id === productId);
  if (!item) return;
  
  const newQty = item.quantity + delta;
  
  if (newQty <= 0) {
    removeFromCart(productId);
  } else {
    alertCollector("This original artwork is unique. Quantities are limited to one per piece.");
  }
  
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('valerie_portfolio_cart', JSON.stringify(cart));
}

function updateCartUI() {
  if (!DOM.cartCounter || !DOM.cartItems || !DOM.cartTotal) return;
  
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  DOM.cartCounter.textContent = totalItems;
  
  DOM.cartItems.innerHTML = '';
  
  if (cart.length === 0) {
    DOM.cartItems.innerHTML = `
      <div class="cart-empty-message">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1,0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0,1-1.12-1.243l1.264-12A1.125 1.125 0 0,1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1,1-.75 0 .375.375 0 0,1 .75 0Zm7.5 0a.375.375 0 1,1-.75 0 .375.375 0 0,1 .75 0Z" />
        </svg>
        <p>Your collection is currently empty.</p>
      </div>
    `;
    DOM.cartTotal.textContent = '€0';
    DOM.checkoutTrigger.disabled = true;
    return;
  }
  
  DOM.checkoutTrigger.disabled = false;
  let totalValue = 0;
  
  cart.forEach(item => {
    const product = products.find(p => p.id === item.id);
    if (!product) return;
    
    totalValue += product.price * item.quantity;
    
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.innerHTML = `
      <img src="${product.imageURL}" alt="${product.title}" class="cart-item-img">
      <div class="cart-item-details">
        <h4 class="cart-item-title">${product.title}</h4>
        <p class="cart-item-meta">${product.medium}</p>
        <div class="cart-item-bottom">
          <div class="cart-quantity-controls">
            <button class="qty-btn minus-btn" data-id="${product.id}" aria-label="Decrease quantity">-</button>
            <span class="qty-val">${item.quantity}</span>
            <button class="qty-btn plus-btn" data-id="${product.id}" aria-label="Increase quantity">+</button>
          </div>
          <span class="cart-item-price">&euro;${(product.price * item.quantity).toLocaleString()}</span>
        </div>
      </div>
      <button class="cart-remove-btn" data-id="${product.id}" aria-label="Remove item">Remove</button>
    `;
    
    cartItem.querySelector('.minus-btn').addEventListener('click', () => updateQuantity(product.id, -1));
    cartItem.querySelector('.plus-btn').addEventListener('click', () => updateQuantity(product.id, 1));
    cartItem.querySelector('.cart-remove-btn').addEventListener('click', () => removeFromCart(product.id));
    
    DOM.cartItems.appendChild(cartItem);
  });
  
  DOM.cartTotal.textContent = `€${totalValue.toLocaleString()}`;
}

function alertCollector(message) {
  alert(message);
}

// ==========================================================================
// Modal Operations (Details Modal with Dual Tabs, Checkout)
// ==========================================================================
function openDetailModal(productId) {
  const product = products.find(p => p.id === productId);
  if (!product || !DOM.detailModalContent) return;
  
  // Render details including the dual tab templates inside the modal
  DOM.detailModalContent.innerHTML = `
    <div class="detail-modal-img-side">
      <img src="${product.imageURL}" alt="${product.title}">
    </div>
    <div class="detail-modal-info-side">
      <!-- Tabs Navigation Header -->
      <div class="modal-tabs">
        <button class="modal-tab-btn" id="tab-btn-commercial" data-tab="commercial">Collector Info</button>
        <button class="modal-tab-btn" id="tab-btn-journal" data-tab="journal">Studio Journal</button>
      </div>
      
      <!-- Collector Info tab sheet -->
      <div class="modal-tab-content-sheet" id="sheet-commercial">
        <span class="detail-modal-type">${product.type}</span>
        <h2 class="detail-modal-title" id="modal-artwork-title">${product.title}</h2>
        <div class="detail-modal-price">&euro;${product.price.toLocaleString()}</div>
        
        <div class="detail-modal-specs">
          <div>
            <div class="spec-item-label">Medium</div>
            <div class="spec-item-value">${product.medium}</div>
          </div>
          <div>
            <div class="spec-item-label">Dimensions</div>
            <div class="spec-item-value">${product.dimensions}</div>
          </div>
        </div>
        
        <p class="detail-modal-desc">${product.description}</p>
      </div>
      
      <!-- Studio Journal tab sheet -->
      <div class="modal-tab-content-sheet" id="sheet-journal">
        <span class="detail-modal-type">${product.type} - Journal</span>
        <h2 class="detail-modal-title" style="font-size: 2.25rem; margin-bottom: 1.5rem;">${product.title}</h2>
        
        <div class="journal-sheet-note">
          <p>${product.studioNotes}</p>
        </div>
      </div>
      
      <!-- Action triggers -->
      <div class="detail-modal-actions">
        <button class="btn-primary" id="modal-add-to-cart" data-id="${product.id}" style="width: 100%;">
          Add to Collection
        </button>
      </div>
    </div>
  `;
  
  // Tab click management
  const tabs = DOM.detailModalContent.querySelectorAll('.modal-tab-btn');
  const sheets = DOM.detailModalContent.querySelectorAll('.modal-tab-content-sheet');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const selectedTab = e.currentTarget.getAttribute('data-tab');
      
      tabs.forEach(t => t.classList.remove('active'));
      sheets.forEach(s => s.classList.remove('active'));
      
      e.currentTarget.classList.add('active');
      DOM.detailModalContent.querySelector(`#sheet-${selectedTab}`).classList.add('active');
    });
  });
  
  // Open with the tab that corresponds to current Journal Mode status
  if (journalModeActive) {
    DOM.detailModalContent.querySelector('#tab-btn-journal').classList.add('active');
    DOM.detailModalContent.querySelector('#sheet-journal').classList.add('active');
  } else {
    DOM.detailModalContent.querySelector('#tab-btn-commercial').classList.add('active');
    DOM.detailModalContent.querySelector('#sheet-commercial').classList.add('active');
  }
  
  // Wire up "Add to Collection"
  document.getElementById('modal-add-to-cart').addEventListener('click', (e) => {
    const id = e.currentTarget.getAttribute('data-id');
    addToCart(id);
    closeModal(DOM.detailModal);
  });
  
  openModal(DOM.detailModal);
}

function openCheckoutModal() {
  if (cart.length === 0) return;
  
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  let totalValue = 0;
  cart.forEach(item => {
    const p = products.find(prod => prod.id === item.id);
    if (p) totalValue += p.price * item.quantity;
  });
  
  DOM.checkoutItemCount.textContent = `${totalItems} ${totalItems === 1 ? 'piece' : 'pieces'}`;
  DOM.checkoutTotalValue.textContent = `€${totalValue.toLocaleString()}`;
  
  // Pre-populate Revolut link with checkout total sum
  if (DOM.revolutPayLinkBtn) {
    DOM.revolutPayLinkBtn.href = `https://revolut.me/valerie_starovoit/${totalValue}`;
  }
  
  closeCartDrawer();
  openModal(DOM.checkoutModal);
}

function openModal(modalElement) {
  previousActiveElement = document.activeElement;
  modalElement.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  const closeBtn = modalElement.querySelector('.modal-close-btn');
  if (closeBtn) closeBtn.focus();
}

function closeModal(modalElement) {
  modalElement.classList.remove('active');
  document.body.style.overflow = '';
  
  if (previousActiveElement) {
    previousActiveElement.focus();
  }
}

function closeEverything() {
  closeModal(DOM.detailModal);
  closeModal(DOM.checkoutModal);
  closeModal(DOM.confirmationModal);
  closeCartDrawer();
  closeMobileMenu();
}

// ==========================================================================
// Drawers (Cart Drawer & Mobile Navigation)
// ==========================================================================
function openCartDrawer() {
  DOM.cartDrawer.classList.add('active');
  DOM.cartOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  DOM.cartClose.focus();
}

function closeCartDrawer() {
  DOM.cartDrawer.classList.remove('active');
  DOM.cartOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

function toggleMobileMenu() {
  const isActive = DOM.mobileNav.classList.toggle('active');
  DOM.menuToggle.classList.toggle('active');
  DOM.menuToggle.setAttribute('aria-expanded', isActive);
  
  if (isActive) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

function closeMobileMenu() {
  DOM.mobileNav.classList.remove('active');
  DOM.menuToggle.classList.remove('active');
  DOM.menuToggle.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

// ==========================================================================
// Scroll Management (Header & Scroll Spy)
// ==========================================================================
function handleWindowScroll() {
  if (window.scrollY > 50) {
    DOM.header.classList.add('scrolled');
  } else {
    DOM.header.classList.remove('scrolled');
  }
}

function setupScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  
  window.addEventListener('scroll', () => {
    let scrollPosition = window.scrollY + 120;
    
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      
      if (scrollPosition >= top && scrollPosition < top + height) {
        DOM.navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  });
}

// ==========================================================================
// Event Listeners Configuration
// ==========================================================================
function setupEventListeners() {
  window.addEventListener('scroll', handleWindowScroll);
  
  DOM.filterBtns.forEach(btn => {
    btn.addEventListener('click', handleFilterClick);
  });
  
  // Interactive Toggle Switch
  DOM.journalToggleBtn.addEventListener('click', toggleJournalMode);
  
  // Cart triggers
  DOM.cartBtn.addEventListener('click', openCartDrawer);
  DOM.cartClose.addEventListener('click', closeCartDrawer);
  DOM.cartOverlay.addEventListener('click', closeCartDrawer);
  
  // Mobile Hamburger menu toggle
  DOM.menuToggle.addEventListener('click', toggleMobileMenu);
  
  DOM.mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => closeMobileMenu());
  });
  
  // Detail Modal Close
  DOM.detailModalClose.addEventListener('click', () => closeModal(DOM.detailModal));
  DOM.detailModal.addEventListener('click', (e) => {
    if (e.target === DOM.detailModal) closeModal(DOM.detailModal);
  });
  
  // Checkout Modal triggers & closes
  DOM.checkoutTrigger.addEventListener('click', openCheckoutModal);
  DOM.checkoutModalClose.addEventListener('click', () => closeModal(DOM.checkoutModal));
  DOM.checkoutModal.addEventListener('click', (e) => {
    if (e.target === DOM.checkoutModal) closeModal(DOM.checkoutModal);
  });
  
  // Intercept checkout form submission
  DOM.checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Clear state
    cart = [];
    saveCart();
    updateCartUI();
    
    closeModal(DOM.checkoutModal);
    openModal(DOM.confirmationModal);
  });
  
  // Confirmation Modal Close
  DOM.confirmationClose.addEventListener('click', () => closeModal(DOM.confirmationModal));
  
  // Escape key close accessibility
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeEverything();
    }
  });
}
