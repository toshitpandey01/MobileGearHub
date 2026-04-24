'use strict';
let currentCategory = 'All';
let currentSort = 'default';
let visibleCount = 12;
let cart = JSON.parse(localStorage.getItem('nexgadget_cart') || '[]');
let wishlist = new Set(JSON.parse(localStorage.getItem('nexgadget_wishlist') || '[]'));
let filteredProducts = [...PRODUCTS];
const overlay   = document.getElementById('disclaimer-overlay');
const disclaimerBtn = document.getElementById('disclaimer-btn');

function hideDisclaimer() {
  overlay.style.animation = 'fadeIn 0.3s ease reverse both';
  overlay.style.animationFillMode = 'forwards';
  setTimeout(() => overlay.classList.add('hidden'), 300);
  sessionStorage.setItem('ng_disclaimer_seen', '1');
}

if (sessionStorage.getItem('ng_disclaimer_seen')) {
  overlay.classList.add('hidden');
}

disclaimerBtn.addEventListener('click', hideDisclaimer);
overlay.addEventListener('click', (e) => { if (e.target === overlay) hideDisclaimer(); });
const header    = document.getElementById('site-header');
const scrollBtn = document.getElementById('scroll-top');

window.addEventListener('scroll', () => {
  const y = window.scrollY;
  header.classList.toggle('scrolled', y > 20);
  scrollBtn.classList.toggle('visible', y > 400);
}, { passive: true });

scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
const themeToggle = document.getElementById('theme-toggle');
const themeIcon   = document.getElementById('theme-icon');
const root        = document.documentElement;
const savedTheme  = localStorage.getItem('ng_theme') || 'dark';

root.setAttribute('data-theme', savedTheme);
syncThemeIcon(savedTheme);

themeToggle.addEventListener('click', () => {
  const cur = root.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('ng_theme', next);
  syncThemeIcon(next);
});

function syncThemeIcon(theme) {
  themeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
}
const menuToggle = document.getElementById('menu-toggle');
const navLinks   = document.getElementById('nav-links');

menuToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('mobile-open');
  menuToggle.classList.toggle('open', isOpen);
  menuToggle.setAttribute('aria-expanded', isOpen);
});

navLinks.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('mobile-open');
    menuToggle.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  });
});
(function startCountdown() {
  let endTime = parseInt(sessionStorage.getItem('ng_countdown_end') || '0');
  if (!endTime || endTime <= Date.now()) {
    endTime = Date.now() + (12 * 3600 + 45 * 60) * 1000;
    sessionStorage.setItem('ng_countdown_end', endTime);
  }
  const hoursEl = document.getElementById('count-hours');
  const minsEl  = document.getElementById('count-mins');
  const secsEl  = document.getElementById('count-secs');

  function tick() {
    const diff = Math.max(0, endTime - Date.now());
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    hoursEl.textContent = String(h).padStart(2, '0');
    minsEl.textContent  = String(m).padStart(2, '0');
    secsEl.textContent  = String(s).padStart(2, '0');
    if (diff > 0) requestAnimationFrame(() => setTimeout(tick, 1000));
  }
  tick();
})();
function buildCategoryFilters() {
  const bar = document.getElementById('filter-bar');
  const categories = ['All', ...new Set(PRODUCTS.map(p => p.category))];
  bar.innerHTML = '';
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (cat === currentCategory ? ' active' : '');
    btn.textContent = cat === 'All' ? '🔍 All Products' : cat;
    btn.setAttribute('aria-pressed', cat === currentCategory);
    btn.addEventListener('click', () => {
      currentCategory = cat;
      visibleCount = 12;
      document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.toggle('active', b.textContent.replace('🔍 ', '') === cat || (cat === 'All' && b.textContent === '🔍 All Products'));
        b.setAttribute('aria-pressed', b === btn);
      });
      applyFiltersAndSort();
    });
    bar.appendChild(btn);
  });
}
function applyFiltersAndSort() {
  filteredProducts = PRODUCTS.filter(p => currentCategory === 'All' || p.category === currentCategory);
  const sort = document.getElementById('sort-select').value;
  if (sort === 'price-asc')  filteredProducts.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') filteredProducts.sort((a, b) => b.price - a.price);
  if (sort === 'rating')     filteredProducts.sort((a, b) => b.rating - a.rating);
  if (sort === 'discount')   filteredProducts.sort((a, b) => b.discount - a.discount);
  renderProducts();
}

document.getElementById('sort-select').addEventListener('change', () => {
  currentSort = document.getElementById('sort-select').value;
  applyFiltersAndSort();
});
function renderProducts() {
  const grid = document.getElementById('products-grid');
  const visible = filteredProducts.slice(0, visibleCount);
  const countEl = document.getElementById('product-count');
  const loadMoreBtn = document.getElementById('load-more-btn');

  countEl.textContent = `Showing ${Math.min(visibleCount, filteredProducts.length)} of ${filteredProducts.length} products`;
  loadMoreBtn.style.display = filteredProducts.length > visibleCount ? 'inline-flex' : 'none';

  grid.innerHTML = '';
  visible.forEach((product, idx) => {
    const card = createProductCard(product, idx);
    grid.appendChild(card);
  });
  grid.querySelectorAll('.product-card').forEach(attachTilt);
}

function createProductCard(p, idx) {
  const card = document.createElement('article');
  card.className = 'product-card';
  card.setAttribute('role', 'listitem');
  card.setAttribute('aria-label', `${p.name} by ${p.brand}`);
  card.style.animationDelay = `${idx * 0.04}s`;

  const stockClass = p.stock === 'in' ? 'stock-in' : p.stock === 'low' ? 'stock-low' : 'stock-out';
  const stockText  = p.stock === 'in' ? 'In Stock' : p.stock === 'low' ? 'Few Left' : 'Out of Stock';
  const isWishlisted = wishlist.has(p.id);

  card.innerHTML = `
    <div class="product-image-wrap">
      <img
        src="${p.image}"
        alt="${p.name}"
        loading="lazy"
        onerror="this.src='https://placehold.co/400x300/1a1a2e/5555aa?text=${encodeURIComponent(p.name)}'"
      />
      ${p.discount ? `<span class="product-badge">${p.discount}% OFF</span>` : ''}
      ${p.featured ? `<span class="product-badge badge-hot" style="top:40px">HOT</span>` : ''}
      <span class="product-stock-badge ${stockClass}">${stockText}</span>
      <button class="product-wishlist ${isWishlisted ? 'wishlisted' : ''}"
              data-id="${p.id}"
              aria-label="${isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}">
        <i class="fa${isWishlisted ? 's' : 'r'} fa-heart"></i>
      </button>
    </div>
    <div class="product-info">
      <p class="product-brand">${p.brand}</p>
      <h3 class="product-name">${p.name}</h3>
      <p class="product-summary">${p.summary}</p>
      <div class="product-rating">
        <span class="stars" aria-label="${p.rating} out of 5">${generateStars(p.rating)}</span>
        <span class="rating-count">(${p.reviews.toLocaleString()})</span>
      </div>
      <div class="product-price-row">
        <span class="price-current">${formatINR(p.price)}</span>
        <span class="price-old">${formatINR(p.oldPrice)}</span>
        ${p.discount ? `<span class="price-discount">Save ${p.discount}%</span>` : ''}
      </div>
    </div>
    <div class="product-card-actions">
      <button class="btn-add-cart" data-id="${p.id}" ${p.stock === 'out' ? 'disabled' : ''}>
        <i class="fas fa-cart-plus"></i>
        ${p.stock === 'out' ? 'Out of Stock' : 'Add to Cart'}
      </button>
      <button class="btn-view-detail" data-id="${p.id}" aria-label="View details for ${p.name}">
        <i class="fas fa-eye"></i>
      </button>
    </div>
  `;

  card.querySelector('.btn-add-cart').addEventListener('click', (e) => {
    e.stopPropagation();
    addToCart(p.id);
  });
  card.querySelector('.btn-view-detail').addEventListener('click', (e) => {
    e.stopPropagation();
    openModal(p.id);
  });
  card.querySelector('.product-wishlist').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleWishlist(p.id, e.currentTarget);
  });
  card.addEventListener('click', () => openModal(p.id));

  return card;
}
document.getElementById('load-more-btn').addEventListener('click', () => {
  visibleCount += 8;
  renderProducts();
});
function renderFeatured() {
  const grid = document.getElementById('featured-grid');
  const featured = PRODUCTS.filter(p => p.featured).slice(0, 6);
  grid.innerHTML = '';
  featured.forEach(p => {
    const card = document.createElement('article');
    card.className = 'featured-card';
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label', `Featured: ${p.name}`);
    card.innerHTML = `
      <img class="featured-card-bg" src="${p.image}" alt="${p.name}" loading="lazy"
           onerror="this.src='https://placehold.co/600x360/0a0a1a/5555aa?text=${encodeURIComponent(p.name)}'">
      <div class="featured-card-overlay">
        <span class="featured-category">${p.category}</span>
        <h3 class="featured-name">${p.name}</h3>
        <span class="featured-price">${formatINR(p.price)}</span>
      </div>
    `;
    card.addEventListener('click', () => openModal(p.id));
    grid.appendChild(card);
  });
}
function renderTrending() {
  const grid = document.getElementById('trending-grid');
  const trending = PRODUCTS.filter(p => p.trending).slice(0, 10);
  grid.innerHTML = '';
  trending.forEach((p, idx) => {
    const card = document.createElement('article');
    card.className = 'trending-card';
    card.setAttribute('role', 'listitem');
    card.innerHTML = `
      <div class="trending-rank">#${idx + 1}</div>
      <img src="${p.image}" alt="${p.name}" loading="lazy"
           onerror="this.src='https://placehold.co/200x130/0a0a1a/5555aa?text=${encodeURIComponent(p.brand)}'">
      <p class="trending-card-name">${p.name}</p>
      <p class="trending-card-price">${formatINR(p.price)}</p>
    `;
    card.addEventListener('click', () => openModal(p.id));
    grid.appendChild(card);
  });
}
const modalOverlay = document.getElementById('product-modal');
const modalContent = document.getElementById('modal-content');
const modalClose   = document.getElementById('modal-close');

function openModal(productId) {
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p) return;

  const specsHtml = Object.entries(p.specs || {}).map(([k, v]) =>
    `<div class="spec-item"><span class="spec-label">${k}</span><span class="spec-value">${v}</span></div>`
  ).join('');

  const featuresHtml = (p.features || []).map(f => `<li>${f}</li>`).join('');

  modalContent.innerHTML = `
    <div class="modal-grid">
      <div class="modal-image-section">
        <img class="modal-main-img" src="${p.image}" alt="${p.name}"
             onerror="this.src='https://placehold.co/480x320/1a1a2e/5555aa?text=${encodeURIComponent(p.name)}'">
        <div class="product-rating">
          <span class="stars">${generateStars(p.rating)}</span>
          <span class="rating-count">${p.rating}/5 (${p.reviews.toLocaleString()} reviews)</span>
        </div>
      </div>
      <div class="modal-details">
        <p class="modal-brand">${p.brand} · ${p.category}</p>
        <h2 class="modal-name">${p.name}</h2>
        <div class="modal-price-row">
          <span class="modal-price">${formatINR(p.price)}</span>
          <span class="modal-old-price">${formatINR(p.oldPrice)}</span>
          ${p.discount ? `<span class="modal-discount-badge">Save ${p.discount}%</span>` : ''}
        </div>
        <p class="modal-summary">${p.summary}</p>

        ${specsHtml ? `
          <p class="modal-specs-title">Specifications</p>
          <div class="modal-specs-grid">${specsHtml}</div>
        ` : ''}

        ${featuresHtml ? `
          <p class="modal-specs-title">Feature Highlights</p>
          <ul class="modal-features-list">${featuresHtml}</ul>
        ` : ''}

        <div class="modal-actions">
          <button class="btn btn-primary modal-add-cart" data-id="${p.id}" ${p.stock === 'out' ? 'disabled' : ''}>
            <i class="fas fa-cart-plus"></i> ${p.stock === 'out' ? 'Out of Stock' : 'Add to Cart'}
          </button>
          <button class="btn btn-outline modal-wishlist" data-id="${p.id}" aria-label="Wishlist">
            <i class="fa${wishlist.has(p.id) ? 's' : 'r'} fa-heart"></i>
          </button>
        </div>
        <div class="modal-external-links">
          ${p.storeLink ? `<a href="${p.storeLink}" target="_blank" rel="noopener noreferrer" class="btn-external btn-official-store"><i class="fas fa-store"></i> Official Store</a>` : ''}
          ${p.compareLink ? `<a href="${p.compareLink}" target="_blank" rel="noopener noreferrer" class="btn-external btn-compare"><i class="fas fa-chart-bar"></i> Compare & Reviews</a>` : ''}
        </div>
      </div>
    </div>
  `;

  modalContent.querySelector('.modal-add-cart').addEventListener('click', () => {
    addToCart(p.id);
    closeModal();
  });
  modalContent.querySelector('.modal-wishlist').addEventListener('click', (e) => {
    toggleWishlist(p.id, e.currentTarget);
    const icon = e.currentTarget.querySelector('i');
    icon.className = wishlist.has(p.id) ? 'fas fa-heart' : 'far fa-heart';
  });

  modalOverlay.classList.add('open');
  modalOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('open');
  modalOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal(); closeCart(); } });
const cartSidebar  = document.getElementById('cart-sidebar');
const cartOverlay  = document.getElementById('cart-overlay');
const cartBtn      = document.getElementById('cart-btn');
const cartClose    = document.getElementById('cart-close');
const cartShopBtn  = document.getElementById('cart-shop-btn');

function openCart() {
  cartSidebar.classList.add('open');
  cartOverlay.classList.add('open');
  cartSidebar.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  renderCart();
}
function closeCart() {
  cartSidebar.classList.remove('open');
  cartOverlay.classList.remove('open');
  cartSidebar.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

cartBtn.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);
if (cartShopBtn) cartShopBtn.addEventListener('click', closeCart);

function addToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product || product.stock === 'out') return;
  const existing = cart.find(i => i.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: productId, qty: 1 });
  }
  saveCart();
  updateCartCount();
  showToast(`<i class="fas fa-check-circle"></i> ${product.name} added to cart!`, 'success');
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCart();
  updateCartCount();
  renderCart();
}

function updateQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart();
  renderCart();
}

function saveCart() {
  localStorage.setItem('nexgadget_cart', JSON.stringify(cart));
}

function updateCartCount() {
  const count = cart.reduce((sum, i) => sum + i.qty, 0);
  const badge = document.getElementById('cart-count');
  badge.textContent = count;
  badge.classList.toggle('visible', count > 0);
}

function renderCart() {
  const itemsEl   = document.getElementById('cart-items');
  const emptyEl   = document.getElementById('cart-empty');
  const footerEl  = document.getElementById('cart-footer');
  const totalEl   = document.getElementById('cart-total');

  if (cart.length === 0) {
    emptyEl.style.display = 'block';
    footerEl.style.display = 'none';
    itemsEl.innerHTML = '';
    itemsEl.appendChild(emptyEl);
    return;
  }

  emptyEl.style.display = 'none';
  footerEl.style.display = 'block';

  const oldItems = itemsEl.querySelectorAll('.cart-item');
  oldItems.forEach(el => el.remove());

  let total = 0;
  cart.forEach(item => {
    const p = PRODUCTS.find(x => x.id === item.id);
    if (!p) return;
    total += p.price * item.qty;
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <img src="${p.image}" alt="${p.name}" loading="lazy"
           onerror="this.src='https://placehold.co/64x64/1a1a2e/5555aa?text=${encodeURIComponent(p.brand)}'">
      <div class="cart-item-info">
        <p class="cart-item-name">${p.name}</p>
        <p class="cart-item-price">${formatINR(p.price)}</p>
        <div class="cart-item-qty-ctrl">
          <button class="qty-btn" data-id="${p.id}" data-delta="-1" aria-label="Decrease quantity">−</button>
          <span class="qty-display">${item.qty}</span>
          <button class="qty-btn" data-id="${p.id}" data-delta="1" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <button class="cart-item-remove" data-id="${p.id}" aria-label="Remove ${p.name} from cart">
        <i class="fas fa-trash-alt"></i>
      </button>
    `;
    el.querySelector('.cart-item-remove').addEventListener('click', () => removeFromCart(p.id));
    el.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => updateQty(p.id, parseInt(btn.dataset.delta)));
    });
    itemsEl.appendChild(el);
  });

  totalEl.textContent = formatINR(total);
}
function toggleWishlist(productId, btn) {
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p) return;
  if (wishlist.has(productId)) {
    wishlist.delete(productId);
    btn.classList.remove('wishlisted');
    const icon = btn.querySelector('i');
    if (icon) icon.className = 'far fa-heart';
    showToast(`<i class="far fa-heart"></i> Removed from wishlist`, 'error');
  } else {
    wishlist.add(productId);
    btn.classList.add('wishlisted');
    const icon = btn.querySelector('i');
    if (icon) icon.className = 'fas fa-heart';
    showToast(`<i class="fas fa-heart"></i> Added to wishlist!`, 'success');
  }
  localStorage.setItem('nexgadget_wishlist', JSON.stringify([...wishlist]));
}
const searchInput  = document.getElementById('search-input');
const searchDropdown = document.getElementById('search-results');

searchInput.addEventListener('input', debounce(() => {
  const q = searchInput.value.trim().toLowerCase();
  if (q.length < 2) {
    searchDropdown.classList.remove('visible');
    return;
  }
  const results = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.brand.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q)
  ).slice(0, 6);

  if (results.length === 0) {
    searchDropdown.classList.remove('visible');
    return;
  }

  searchDropdown.innerHTML = results.map(p => `
    <div class="search-result-item" data-id="${p.id}" tabindex="0" role="option">
      <img src="${p.image}" alt="${p.name}" loading="lazy"
           onerror="this.src='https://placehold.co/40x40/1a1a2e/5555aa?text=${p.brand[0]}'">
      <div class="search-result-info">
        <span class="result-name">${p.name}</span>
        <span class="result-price">${formatINR(p.price)}</span>
      </div>
    </div>
  `).join('');

  searchDropdown.classList.add('visible');
  searchDropdown.querySelectorAll('.search-result-item').forEach(item => {
    const handler = () => {
      openModal(parseInt(item.dataset.id));
      searchDropdown.classList.remove('visible');
      searchInput.value = '';
    };
    item.addEventListener('click', handler);
    item.addEventListener('keydown', (e) => { if (e.key === 'Enter') handler(); });
  });
}, 200));

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-wrapper')) {
    searchDropdown.classList.remove('visible');
  }
});
function attachTilt(card) {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotX = ((y - cy) / cy) * -8;
    const rotY = ((x - cx) / cx) * 8;
    card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(6px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
    card.style.transition = 'transform 0.4s cubic-bezier(0.4,0,0.2,1)';
  });
  card.addEventListener('mouseenter', () => {
    card.style.transition = 'transform 0.1s linear';
  });
}
const parallaxEls = document.querySelectorAll('.parallax-element');
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  parallaxEls.forEach(el => {
    const speed = parseFloat(el.dataset.speed || 0.2);
    el.style.transform = `translateY(${scrollY * speed}px)`;
  });
}, { passive: true });
const ioOptions = { threshold: 0.08 };
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      io.unobserve(entry.target);
    }
  });
}, ioOptions);

function observeAnimatable() {
  document.querySelectorAll('.trust-badge, .testimonial-card, .featured-card, .trending-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    io.observe(el);
  });
}
document.getElementById('newsletter-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('newsletter-email').value.trim();
  if (!email || !email.includes('@')) {
    showToast('<i class="fas fa-exclamation-circle"></i> Please enter a valid email.', 'error');
    return;
  }
  showToast('<i class="fas fa-check-circle"></i> Subscribed! Great deals coming your way 🎉', 'success');
  document.getElementById('newsletter-email').value = '';
});
let toastContainer = null;

function showToast(html, type = 'success', duration = 3000) {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = html;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastIn 0.3s ease reverse both';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
function init() {
  buildCategoryFilters();
  applyFiltersAndSort();
  renderFeatured();
  renderTrending();
  updateCartCount();
  renderCart();
  observeAnimatable();
  const navAnchors = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', debounce(() => {
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 100) current = sec.id;
    });
    navAnchors.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
    });
  }, 100), { passive: true });
}

document.addEventListener('DOMContentLoaded', init);