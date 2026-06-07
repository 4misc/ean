/**
 * Éan Gallery - Client-side Interactive Logic (ES Module)
 * Handles Cart, Modal, Filters, Checkout, Navigation, and Accessibility.
 */

import { products } from './products.js';

// ==========================================================================
// Application State
// ==========================================================================
let cart = JSON.parse(localStorage.getItem('ean_gallery_cart')) || [];
let currentFilter = 'all';

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
  
  // Gallery
  artGrid: document.getElementById('artworks-grid'),
  filterBtns: document.querySelectorAll('.filter-btn'),
  
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
// Gallery Rendering & Filtering
// ==========================================================================
function renderGallery() {
  if (!DOM.artGrid) return;
  
  // Filter products based on current selection
  const filteredProducts = products.filter(product => {
    if (currentFilter === 'all') return true;
    return product.type === currentFilter;
  });
  
  // Generate HTML structures
  DOM.artGrid.innerHTML = '';
  
  if (filteredProducts.length === 0) {
    DOM.artGrid.innerHTML = `<p class="cart-empty-message">No artworks found in this category.</p>`;
    return;
  }
  
  filteredProducts.forEach((product, index) => {
    const card = document.createElement('article');
    card.className = 'art-card';
    card.style.animationDelay = `${index * 0.1}s`; // Staggered entrance
    
    // Check if it's the award winning piece to add a premium badge
    const isAwardWinner = product.id === 'rape-of-europe';
    const badgeHTML = isAwardWinner 
      ? `<div class="art-card-badge">SCC Award Winner</div>` 
      : '';
      
    card.innerHTML = `
      ${badgeHTML}
      <div class="art-card-img-wrapper">
        <img src="${product.imageURL}" alt="${product.title}" loading="lazy">
        <div class="art-card-overlay">
          <button class="art-card-overlay-btn" data-id="${product.id}">View Details</button>
        </div>
      </div>
      <div class="art-card-info">
        <div class="art-card-meta">
          <span class="art-card-type">${product.type}</span>
          <span class="art-card-price">&euro;${product.price.toLocaleString()}</span>
        </div>
        <h3 class="art-card-title">${product.title}</h3>
        <p class="art-card-medium">${product.medium}</p>
      </div>
    `;
    
    // Clicking the card anywhere opens the details modal
    card.addEventListener('click', (e) => {
      // Don't trigger twice if clicking the overlay button directly
      if (!e.target.classList.contains('art-card-overlay-btn')) {
        openDetailModal(product.id);
      }
    });
    
    // Add specific listener for overlay button
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
  const selectedFilter = e.currentTarget.getAttribute('data-filter');
  
  // Update UI classes
  DOM.filterBtns.forEach(btn => btn.classList.remove('active'));
  e.currentTarget.classList.add('active');
  
  currentFilter = selectedFilter;
  renderGallery();
}

// ==========================================================================
// Cart State Operations
// ==========================================================================
function addToCart(productId) {
  const existingItemIndex = cart.findIndex(item => item.id === productId);
  
  if (existingItemIndex > -1) {
    // Limited to 1 quantity per original artwork since each fine art piece is unique
    // Let's notify client or just keep quantity at 1. Fine art pieces are 1-of-1.
    // If they want quantity increase (e.g. for prints/general items) we would increment, 
    // but in Valerie's platform we enforce a strict 1-quantity limit per original piece.
    alertCollector("This original artwork is a unique, one-of-a-kind piece. You cannot purchase multiple quantities of the same piece.");
  } else {
    cart.push({ id: productId, quantity: 1 });
  }
  
  saveCart();
  updateCartUI();
  
  // Smoothly slide open the cart drawer so the user receives instant feedback
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
  
  // Fine art safety: original unique pieces should stay at 1.
  // We allow delta to go below 1 which removes it.
  const newQty = item.quantity + delta;
  
  if (newQty <= 0) {
    removeFromCart(productId);
  } else {
    // Enforce 1 quantity for original artworks
    alertCollector("This original artwork is unique. Quantities are limited to one per piece.");
  }
  
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('ean_gallery_cart', JSON.stringify(cart));
}

function updateCartUI() {
  if (!DOM.cartCounter || !DOM.cartItems || !DOM.cartTotal) return;
  
  // Calculate counts
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  DOM.cartCounter.textContent = totalItems;
  
  // Clear container
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
    
    // Wire up events on the dynamic nodes
    cartItem.querySelector('.minus-btn').addEventListener('click', () => updateQuantity(product.id, -1));
    cartItem.querySelector('.plus-btn').addEventListener('click', () => updateQuantity(product.id, 1));
    cartItem.querySelector('.cart-remove-btn').addEventListener('click', () => removeFromCart(product.id));
    
    DOM.cartItems.appendChild(cartItem);
  });
  
  DOM.cartTotal.textContent = `€${totalValue.toLocaleString()}`;
}

// Custom sophisticated alert method instead of ugly browser alert
function alertCollector(message) {
  // Let's create an elegant temporary status bar or log. For now, a clean browser alert.
  alert(message);
}

// ==========================================================================
// Modal Control (Details, Checkout, Confirmation)
// ==========================================================================
function openDetailModal(productId) {
  const product = products.find(p => p.id === productId);
  if (!product || !DOM.detailModalContent) return;
  
  // Render details inside the modal
  DOM.detailModalContent.innerHTML = `
    <div class="detail-modal-img-side">
      <img src="${product.imageURL}" alt="${product.title}">
    </div>
    <div class="detail-modal-info-side">
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
      
      <div class="detail-modal-actions">
        <button class="btn-primary" id="modal-add-to-cart" data-id="${product.id}" style="flex-grow: 1;">
          Add to Collection
        </button>
      </div>
    </div>
  `;
  
  // Event listeners on dynamic modal content
  document.getElementById('modal-add-to-cart').addEventListener('click', (e) => {
    const id = e.currentTarget.getAttribute('data-id');
    addToCart(id);
    closeModal(DOM.detailModal);
  });
  
  openModal(DOM.detailModal);
}

function openCheckoutModal() {
  if (cart.length === 0) return;
  
  // Calculate checkout details
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  let totalValue = 0;
  cart.forEach(item => {
    const p = products.find(prod => prod.id === item.id);
    if (p) totalValue += p.price * item.quantity;
  });
  
  // Update values in form
  DOM.checkoutItemCount.textContent = `${totalItems} ${totalItems === 1 ? 'piece' : 'pieces'}`;
  DOM.checkoutTotalValue.textContent = `€${totalValue.toLocaleString()}`;
  
  // Dynamic Revolut link mapping
  // Pre-populates the URL with the total amount for faster acquisition
  if (DOM.revolutPayLinkBtn) {
    DOM.revolutPayLinkBtn.href = `https://revolut.me/ean_gallery/${totalValue}`;
  }
  
  // Close the cart drawer
  closeCartDrawer();
  
  // Open the checkout modal
  openModal(DOM.checkoutModal);
}

function openModal(modalElement) {
  previousActiveElement = document.activeElement;
  modalElement.classList.add('active');
  document.body.style.overflow = 'hidden'; // Prevent scrolling background
  
  // Set focus to the close button inside modal
  const closeBtn = modalElement.querySelector('.modal-close-btn');
  if (closeBtn) closeBtn.focus();
}

function closeModal(modalElement) {
  modalElement.classList.remove('active');
  document.body.style.overflow = ''; // Restore scroll
  
  if (previousActiveElement) {
    previousActiveElement.focus();
  }
}

// Close all active modals/drawers
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
  // Add subtle shadow & blur padding shift to header on scroll
  if (window.scrollY > 50) {
    DOM.header.classList.add('scrolled');
  } else {
    DOM.header.classList.remove('scrolled');
  }
}

function setupScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  
  window.addEventListener('scroll', () => {
    let scrollPosition = window.scrollY + 120; // Offset for header height
    
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      
      if (scrollPosition >= top && scrollPosition < top + height) {
        // Desktop nav active class
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
  // Window scroll effects
  window.addEventListener('scroll', handleWindowScroll);
  
  // Navigation filters
  DOM.filterBtns.forEach(btn => {
    btn.addEventListener('click', handleFilterClick);
  });
  
  // Header Cart Toggle
  DOM.cartBtn.addEventListener('click', openCartDrawer);
  DOM.cartClose.addEventListener('click', closeCartDrawer);
  DOM.cartOverlay.addEventListener('click', closeCartDrawer);
  
  // Mobile Hamburger menu toggle
  DOM.menuToggle.addEventListener('click', toggleMobileMenu);
  
  // Close mobile navigation drawer on link clicks (smooth scrolls)
  DOM.mobileNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      closeMobileMenu();
    });
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
    
    // Process "Order Placement"
    cart = [];
    saveCart();
    updateCartUI();
    
    // Close checkout screen and open confirmation
    closeModal(DOM.checkoutModal);
    openModal(DOM.confirmationModal);
  });
  
  // Confirmation Modal Close
  DOM.confirmationClose.addEventListener('click', () => closeModal(DOM.confirmationModal));
  
  // Keypress accessibility (Close modal on Escape key)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeEverything();
    }
  });
}
