/* ═══════════════════════════════════════════
   NEUROVIA NEXUS — API CONNECTION
   Fetches real data from Express backend
═══════════════════════════════════════════ */

const API_URL = 'http://localhost:5000/api';

// ── Fetch with fallback ──
async function apiFetch(endpoint) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`);
    const data = await res.json();
    if (data.success) return data.data;
    return null;
  } catch (e) {
    console.warn(`API unavailable (${endpoint}), using static content.`);
    return null;
  }
}

// ══════════════════════════════════════
// SERVICES
// ══════════════════════════════════════
async function loadServices() {
  const container = document.getElementById('services-grid');
  if (!container) return;

  const data = await apiFetch('/services');
  if (!data || !data.services || data.services.length === 0) return;

  const icons = { remote: '⚡', onsite: '🔧', both: '🏢' };

  container.innerHTML = data.services.slice(0, 6).map((svc, i) => `
    <a href="services.html" class="service-card reveal${i > 0 ? ' delay-' + Math.min(i, 4) : ''}" data-index="${String(i+1).padStart(2,'0')}">
      <div class="service-icon">${svc.icon || icons[svc.supportType] || '⚡'}</div>
      <h3>${svc.title}</h3>
      <p>${svc.shortDescription}</p>
      <span class="card-arrow">→</span>
    </a>
  `).join('');

  // Re-observe new elements for scroll animation
  const observer = window.revealObserver;
  if (observer) {
    container.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  } else {
    container.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  }
}

// ══════════════════════════════════════
// TESTIMONIALS
// ══════════════════════════════════════
async function loadTestimonials() {
  const container = document.getElementById('testimonials-grid');
  if (!container) return;

  const data = await apiFetch('/testimonials');
  if (!data || !data.testimonials || data.testimonials.length === 0) return;

  container.innerHTML = data.testimonials.slice(0, 4).map((t, i) => `
    <div class="tcard reveal${i > 0 ? ' delay-' + Math.min(i, 3) : ''}">
      <div class="tcard-stars">${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</div>
      <p>"${t.message}"</p>
      <div class="tcard-author">
        <div class="tcard-avatar">${t.customerName.split(' ').map(n => n[0]).join('').slice(0,2)}</div>
        <div>
          <strong>${t.customerName}</strong>
          <span>${t.designation || ''}${t.company ? ', ' + t.company : ''}</span>
        </div>
      </div>
    </div>
  `).join('');

  const obs2 = window.revealObserver;
  if (obs2) {
    container.querySelectorAll('.reveal').forEach(el => obs2.observe(el));
  } else {
    container.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  }
}

// ══════════════════════════════════════
// WISHLIST
// ══════════════════════════════════════
async function loadWishlist() {
  const container = document.getElementById('wishlist-grid');
  if (!container) return;

  const data = await apiFetch('/wishlist');
  if (!data || !data.items || data.items.length === 0) return;

  const statusColors = {
    'Research':       'background:rgba(79,127,255,0.1);color:#6b9fff;border:1px solid rgba(79,127,255,0.2)',
    'Planning':       'background:rgba(168,85,247,0.1);color:#a855f7;border:1px solid rgba(168,85,247,0.2)',
    'In Development': 'background:rgba(245,158,11,0.1);color:#f59e0b;border:1px solid rgba(245,158,11,0.2)',
    'Completed':      'background:rgba(34,197,94,0.1);color:#22c55e;border:1px solid rgba(34,197,94,0.2)',
  };

  container.innerHTML = data.items.map((item, i) => `
    <div class="future-card reveal${i > 0 ? ' delay-' + Math.min(i, 3) : ''}" data-status="${item.status}">
      <div class="future-status" style="${statusColors[item.status] || ''}">${item.status}</div>
      <h3>${item.title}</h3>
      <p>${item.description}</p>
    </div>
  `).join('');

  const obs3 = window.revealObserver;
  if (obs3) {
    container.querySelectorAll('.reveal').forEach(el => obs3.observe(el));
  } else {
    container.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  }
}

// ══════════════════════════════════════
// COUNTDOWN (from live settings)
// ══════════════════════════════════════
async function loadCountdownDate() {
  const data = await apiFetch('/settings');
  if (!data || !data.settings?.countdownTargetDate) return;

  // Update the global TARGET_DATE used by the countdown timer
  window.COUNTDOWN_TARGET = new Date(data.data?.settings?.countdownTargetDate || data.settings.countdownTargetDate);
}

// ══════════════════════════════════════
// BLOG POSTS (latest 3 on homepage)
// ══════════════════════════════════════
async function loadLatestPosts() {
  const container = document.getElementById('latest-posts');
  if (!container) return;

  const data = await apiFetch('/blog?limit=3');
  if (!data || !data.posts || data.posts.length === 0) return;

  const gradients = [
    'linear-gradient(135deg,#0f0f2e,#1a1040)',
    'linear-gradient(135deg,#1a0e0e,#401616)',
    'linear-gradient(135deg,#0e1a10,#162816)',
  ];

  container.innerHTML = data.posts.map((post, i) => `
    <a href="blog.html" class="blog-card-small reveal${i > 0 ? ' delay-' + i : ''}">
      <span class="blog-category-sm">${post.category}</span>
      <h4>${post.title}</h4>
      <div class="blog-meta">
        <span>${post.readingTime || 3} min</span>
        <span>${post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-IN', { month:'short', year:'numeric' }) : ''}</span>
      </div>
    </a>
  `).join('');

  const obs4 = window.revealObserver;
  if (obs4) {
    container.querySelectorAll('.reveal').forEach(el => obs4.observe(el));
  } else {
    container.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  }
}

// ══════════════════════════════════════
// SETTINGS (hero text, company info)
// ══════════════════════════════════════
async function loadSettings() {
  const data = await apiFetch('/settings');
  if (!data || !data.settings) return;
  const s = data.settings;

  // Update hero text if elements exist
  const heroTitle = document.getElementById('hero-headline');
  const heroSub = document.getElementById('hero-subtitle');
  if (heroTitle && s.heroHeadline) heroTitle.textContent = s.heroHeadline;
  if (heroSub && s.heroSubtitle) heroSub.textContent = s.heroSubtitle;

  // Update footer contact info
  const footerEmail = document.querySelectorAll('.footer-email');
  const footerPhone = document.querySelectorAll('.footer-phone');
  const footerAddress = document.querySelectorAll('.footer-address');
  footerEmail.forEach(el => { if (s.supportEmail) el.textContent = s.supportEmail; });
  footerPhone.forEach(el => { if (s.phone) el.textContent = s.phone; });
  footerAddress.forEach(el => { if (s.address) el.textContent = s.address; });

  // Countdown target date
  if (s.countdownTargetDate) {
    window.COUNTDOWN_TARGET = new Date(s.countdownTargetDate);
  }
}

// ══════════════════════════════════════
// CONTACT FORM SUBMISSION
// ══════════════════════════════════════
async function submitContactToAPI(formData) {
  const res = await fetch(`${API_URL}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
  return res.json();
}

// ══════════════════════════════════════
// NEWSLETTER SUBSCRIPTION
// ══════════════════════════════════════
async function subscribeToNewsletter(email) {
  const res = await fetch(`${API_URL}/contact/newsletter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

// ══════════════════════════════════════
// BOOKING FORM SUBMISSION
// ══════════════════════════════════════
async function submitBookingToAPI(formData) {
  const res = await fetch(`${API_URL}/bookings`, {
    method: 'POST',
    body: formData, // FormData for file uploads
  });
  return res.json();
}

// Export for use in other scripts
window.neurovia = {
  API_URL,
  apiFetch,
  loadServices,
  loadTestimonials,
  loadWishlist,
  loadLatestPosts,
  loadSettings,
  submitContactToAPI,
  subscribeToNewsletter,
  submitBookingToAPI,
};
