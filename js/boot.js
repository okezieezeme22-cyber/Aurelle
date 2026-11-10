/* Loads the page in the right order: Supabase first, then the page's own scripts.
   Each page uses one tag, for example:
   <script src="js/boot.js" data-early="main" data-scripts="overrides,shared,auth,home" data-orders></script> */
(() => {
  const me = document.currentScript;
  const V = '20261110f';
  const base = me.src.replace(/boot\.js(\?.*)?$/, '');
  const names = (k) => (me.dataset[k] || '').split(',').map((s) => s.trim()).filter(Boolean);
  const load = (src) => new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src + (src.includes('?') ? '' : '?v=' + V); s.async = false; s.onload = resolve; s.onerror = () => reject(new Error('Could not load ' + src));
    document.head.appendChild(s);
  });
  const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';

  Promise.all(names('early').map((n) => load(base + n + '.js')));          // menu, search and cart badge work immediately

  (async () => {
    await Promise.all([load(base + 'supabase-config.js'), load(base + 'db.js'), load(base + 'products.js')]);
    if (window.DB.configured) { try { await load(SUPABASE_JS); } catch (e) { window.DB.configured = false; window.DB.offline = true; } }
    await window.DB.init({ fresh: 'fresh' in me.dataset, orders: 'orders' in me.dataset, admin: 'admin' in me.dataset });
    await Promise.all(names('scripts').map((n) => load(base + n + '.js')));
  })().catch((e) => {
    console.error(e);
    const main = document.getElementById('main') || document.body;
    main.insertAdjacentHTML('afterbegin', '<p class="form-msg is-error" role="alert" style="padding:16px;text-align:center">This page could not load. Check your connection and refresh.</p>');
  });
})();
