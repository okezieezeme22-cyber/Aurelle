(() => {
  const $ = (id) => document.getElementById(id);

  /* ----- Announcement bar (remembers if closed this session) ----- */
  const announce = $('announce');
  try {
    const cfg = JSON.parse(localStorage.getItem('aurelle_settings') || '{}');
    if (cfg.announcement) announce.querySelector('p').textContent = cfg.announcement;
    if (cfg.announcementOn === false) announce.hidden = true;
  } catch (e) {}
  try { if (sessionStorage.getItem('aurelle_announce') === 'closed') announce.hidden = true; } catch (e) {}
  $('announceClose').addEventListener('click', () => {
    announce.hidden = true;
    try { sessionStorage.setItem('aurelle_announce', 'closed'); } catch (e) {}
  });

  /* ----- Header shadow on scroll ----- */
  const header = $('header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ----- Mobile menu ----- */
  const nav = $('mainNav'), scrim = $('scrim'), toggle = $('menuToggle');
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    scrim.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) $('menuClose').focus(); else toggle.focus({ preventScroll: true });
  }
  toggle.addEventListener('click', () => setMenu(true));
  $('menuClose').addEventListener('click', () => setMenu(false));
  scrim.addEventListener('click', () => setMenu(false));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* ----- Search panel ----- */
  const panel = $('searchPanel'), searchBtn = $('searchToggle');
  function setSearch(open) {
    panel.hidden = !open;
    searchBtn.setAttribute('aria-expanded', String(open));
    if (open) $('searchInput').focus();
  }
  searchBtn.addEventListener('click', () => setSearch(panel.hidden));

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (nav.classList.contains('is-open')) setMenu(false);
    if (!panel.hidden) { setSearch(false); searchBtn.focus(); }
  });

  /* ----- Cart count (reads the cart saved by later steps) ----- */
  function updateCartCount() {
    let count = 0;
    try {
      const cart = JSON.parse(localStorage.getItem('aurelle_cart') || '[]');
      count = cart.reduce((n, item) => n + (Number(item.quantity) || 0), 0);
    } catch (e) {}
    const badge = $('cartCount');
    badge.textContent = count > 99 ? '99+' : count;
    badge.hidden = count === 0;
    $('cartLink').setAttribute('aria-label', `Shopping cart, ${count} ${count === 1 ? 'item' : 'items'}`);
  }
  updateCartCount();
  window.addEventListener('storage', updateCartCount);
  window.addEventListener('aurelle:cart-changed', updateCartCount);
})();
