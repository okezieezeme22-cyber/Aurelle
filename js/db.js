/* AURÉLLE data layer. The only file that talks to Supabase.
   Pages keep using the same objects as before (products, orders, AUTH); this file fills them from the database. */
(() => {
  const cfg = window.AURELLE_SUPABASE || {};
  const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(cfg.url || '') &&
    typeof cfg.anonKey === 'string' && cfg.anonKey.length > 20 && !/YOUR_/.test(cfg.anonKey);
  const DB = { configured, offline: !configured, sb: null, profile: null, recovery: false, error: '' };
  window.DB = DB;
  window.AURELLE_ORDERS = [];
  window.AURELLE_USERS = [];
  window.AURELLE_INVLOG = [];
  DB.myReviews = [];

  const NOT_READY = { ok: false, error: 'The store database is not connected yet.' };
  const fail = (e) => ({ ok: false, error: (e && e.message) || 'Something went wrong. Please try again.' });

  /* ----- row mappers (database shape -> the shape the pages already use) ----- */
  const mapProduct = (r) => {
    const vs = (r.product_variants || []).slice().sort((a, b) => a.position - b.position)
      .map((v) => ({ sku: v.sku, size: v.size, colour: v.colour, stock: v.stock }));
    return { slug: r.slug, name: r.name, category: r.category, price: r.price, compare: r.compare_price, image: r.image,
      bestseller: r.best_seller, isNew: r.is_new, sold: r.sold, published: r.published, created: String(r.created_at).slice(0, 10),
      stock: vs.reduce((n, v) => n + v.stock, 0), dbVariants: vs };
  };
  const mapOrder = (r) => ({
    ref: r.ref, items: r.items || [], subtotal: r.subtotal, deliveryFee: r.delivery_fee, total: r.total, customer: r.customer || {},
    orderStatus: r.order_status, paymentStatus: r.payment_status, refunded: r.refunded || 0, paidAt: r.paid_at || undefined,
    createdAt: r.created_at, userEmail: r.user_email, stockDeducted: r.stock_deducted, stockRestored: r.stock_restored,
    demo: r.is_demo, history: r.history || [], paymentLog: r.payment_log || []
  });
  const mapProfile = (p) => p && ({ id: p.id, role: p.role, name: p.name, email: p.email, phone: p.phone,
    addresses: p.addresses || [], created: p.created_at, createdAt: p.created_at, status: p.status });
  DB.mapProfile = mapProfile;

  /* ----- catalogue (cached for 30 seconds in this tab so page changes feel instant) ----- */
  const cacheKey = () => 'aurelle_cat:' + (DB.profile ? DB.profile.id : 'anon');
  async function loadCatalogue(fresh) {
    if (!fresh) {
      try {
        const c = JSON.parse(sessionStorage.getItem(cacheKey()) || 'null');
        if (c && Date.now() - c.t < 30000) return c.rows;
      } catch (e) {}
    }
    const { data, error } = await DB.sb.from('products')
      .select('slug,name,category,price,compare_price,image,best_seller,is_new,sold,published,created_at,product_variants(sku,size,colour,position,stock)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    try { sessionStorage.setItem(cacheKey(), JSON.stringify({ t: Date.now(), rows: data })); } catch (e) {}
    return data;
  }
  function applyCatalogue(rows) {
    window.AURELLE_DB = { products: rows.map(mapProduct) };
    if (window.AURELLE_REBUILD) window.AURELLE_REBUILD();
  }

  async function loadProfile(uid) {
    const { data } = await DB.sb.from('profiles').select('*').eq('id', uid).maybeSingle();
    return mapProfile(data);
  }
  async function loadOrders() {
    const { data, error } = await DB.sb.from('orders_full').select('*').order('created_at', { ascending: false }).limit(1000);
    if (error) throw error;
    window.AURELLE_ORDERS.splice(0, window.AURELLE_ORDERS.length, ...data.map(mapOrder));
  }
  async function loadAdminExtras() {
    const [u, l] = await Promise.all([
      DB.sb.from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false }).limit(1000),
      DB.sb.from('inventory_log').select('*').order('at', { ascending: false }).limit(200)
    ]);
    if (u.error) throw u.error; if (l.error) throw l.error;
    window.AURELLE_USERS.splice(0, window.AURELLE_USERS.length, ...u.data.map(mapProfile));
    window.AURELLE_INVLOG.splice(0, window.AURELLE_INVLOG.length, ...l.data.map((r) => ({
      sku: r.sku, product: r.product, change: r.change, from: r.from_qty, to: r.to_qty, reason: r.reason, by: r.by_email, at: r.at })));
  }

  /* ----- start-up: runs once, before the page's own scripts ----- */
  DB.init = async (opts = {}) => {
    if (!configured) { DB.error = 'not-configured'; return DB; }
    try {
      DB.sb = window.supabase.createClient(cfg.url, cfg.anonKey);
      DB.sb.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') DB.recovery = true;
        if (event === 'SIGNED_OUT') DB.profile = null;
      });
      const { data: { session } } = await DB.sb.auth.getSession();
      if (session) {
        DB.profile = await loadProfile(session.user.id);
        if (DB.profile && DB.profile.status === 'suspended') { await DB.sb.auth.signOut(); DB.profile = null; }
      }
      const jobs = [loadCatalogue(opts.fresh).then(applyCatalogue)];
      if (DB.profile && opts.orders) jobs.push(loadOrders());
      if (DB.profile && DB.profile.role === 'admin' && opts.admin) jobs.push(loadAdminExtras());
      if (DB.profile && opts.orders) jobs.push(DB.loadMyReviews());
      await Promise.all(jobs);
    } catch (e) {
      DB.offline = true; DB.error = (e && e.message) || 'connection-failed';
      console.error('AURÉLLE: could not reach Supabase.', e);
    }
    return DB;
  };
  DB.refreshAll = async () => {
    if (DB.offline) return;
    applyCatalogue(await loadCatalogue(true));
    if (DB.profile) await loadOrders();
    if (DB.profile && DB.profile.role === 'admin') await loadAdminExtras();
  };
  DB.setProfile = (p) => { DB.profile = p; };
  DB.loadProfile = loadProfile;

  /* ----- orders ----- */
  DB.placeOrder = async (items, customer) => {
    if (DB.offline) return NOT_READY;
    const { data, error } = await DB.sb.rpc('place_order', { p_items: items.map((i) => ({ sku: i.sku, quantity: i.quantity })), p_customer: customer });
    if (error) return fail(error);
    return { ok: true, order: mapOrder(data) };
  };

  /* ----- reviews ----- */
  DB.loadReviews = async (slug) => {
    if (DB.offline) return [];
    const { data } = await DB.sb.from('reviews').select('reviewer,rating,body,created_at').eq('slug', slug).order('created_at', { ascending: false }).limit(20);
    return (data || []).map((r) => ({ name: r.reviewer, rating: r.rating, text: r.body, at: r.created_at }));
  };
  DB.loadMyReviews = async () => {
    if (DB.offline || !DB.profile) return;
    const { data } = await DB.sb.from('reviews').select('slug').eq('user_id', DB.profile.id);
    DB.myReviews = (data || []).map((r) => r.slug);
  };
  DB.addReview = async ({ slug, reviewer, rating, text }) => {
    if (DB.offline || !DB.profile) return NOT_READY;
    const { error } = await DB.sb.from('reviews').insert({ slug, user_id: DB.profile.id, reviewer, rating, body: text });
    if (error) return error.code === '23505' ? { ok: false, error: 'You have already reviewed this product.' } : fail(error);
    DB.myReviews.push(slug);
    return { ok: true };
  };

  /* ----- newsletter ----- */
  DB.subscribe = async (email) => {
    if (DB.offline) return NOT_READY;
    const { error } = await DB.sb.from('newsletter_subscribers').insert({ email: email.trim().toLowerCase() });
    if (error && error.code !== '23505') return fail(error);     // already subscribed counts as success
    return { ok: true };
  };

  /* ----- admin (the database re-checks the admin role on every one of these) ----- */
  const admin = async (fn, args) => { if (DB.offline) return NOT_READY; const { error } = await DB.sb.rpc(fn, args); return error ? fail(error) : { ok: true }; };
  DB.setStatus = (ref, status, note) => admin('admin_set_order_status', { p_ref: ref, p_status: status, p_note: note || null });
  DB.verifyPayment = (ref, reference, reason) => admin('admin_verify_payment', { p_ref: ref, p_reference: reference, p_reason: reason });
  DB.refund = (ref, amount, reason) => admin('admin_refund', { p_ref: ref, p_amount: amount, p_reason: reason });
  DB.adjustStock = async (sku, delta, reason) => {
    if (DB.offline) return NOT_READY;
    const { data, error } = await DB.sb.rpc('admin_adjust_stock', { p_sku: sku, p_delta: delta, p_reason: reason });
    return error ? fail(error) : { ok: true, from: data.from, to: data.to };
  };
  DB.loadDemo = (orders) => admin('admin_load_demo', { p_orders: orders });
  DB.clearDemo = () => admin('admin_clear_demo', {});
  DB.updateProduct = async (slug, patch) => {
    if (DB.offline) return NOT_READY;
    const { data, error } = await DB.sb.from('products').update(patch).eq('slug', slug).select('slug');
    if (error) return fail(error);
    return data && data.length ? { ok: true } : { ok: false, error: 'You do not have permission to change products.' };
  };
})();
