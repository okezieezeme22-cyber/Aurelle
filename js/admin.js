/* AURÉLLE admin. Data lives in Supabase; the database re-checks the admin role on every read and write. */
(() => {
  const $ = (id) => document.getElementById(id);
  const page = document.body.dataset.page;

  /* ===== Sign-in page ===== */
  if (page === 'admin-login') {
    const U = window.AUTH, cur = U.current();
    if (cur && cur.role === 'admin') { location.replace('index.html'); return; }
    $('adminForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = $('aemail').value.trim().toLowerCase(), pw = $('apass').value, msg = $('formMsg');
      $('aemailErr').textContent = email ? '' : 'Enter your email.';
      $('apassErr').textContent = pw ? '' : 'Enter your password.';
      msg.textContent = ''; if (!email || !pw) return;
      const r = await U.login(email, pw);
      if (!r.ok) { msg.textContent = r.error; msg.className = 'form-msg is-error'; return; }
      if (r.user.role !== 'admin') { await U.logout(); msg.textContent = 'This account does not have administrator access.'; msg.className = 'form-msg is-error'; return; }
      location.href = 'index.html';
    });
    return;
  }

  /* ===== Gate ===== */
  const me = window.AUTH.current();
  if (!me || me.role !== 'admin') { location.replace('login.html'); return; }
  const adminEmail = me.email;
  $('adminUser').textContent = adminEmail;

  const A = window.AURELLE, O = window.ORDERS, S = window.AURELLE_SHOP, esc = O.esc;
  const naira = (k) => '₦' + (k / 100).toLocaleString('en-NG');
  const LOW = 3, nowIso = () => new Date().toISOString();
  const productImage = (item) => item.image || (ALL().find((p) => p.slug === item.slug) || {}).image || '';
  const jget = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
  const jset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const orders = () => O.read();
  const users = () => window.AURELLE_USERS || [];
  const invLog = () => window.AURELLE_INVLOG || [];
  const ALL = () => window.AURELLE_ALL;
  const revenueOf = (o) => (o.paymentStatus === 'Paid' || o.paymentStatus === 'Partially refunded' ? o.total - (o.refunded || 0) : 0);
  const pill = (t, cls = '') => `<span class="pill ${cls}">${esc(t)}</span>`;
  const payCls = (o) => (o.paymentStatus === 'Paid' ? 'pill--ok' : o.paymentStatus === 'Unpaid' ? 'pill--warn' : o.paymentStatus === 'Cancelled' ? '' : 'pill--bad');
  const stCls = (s) => (s === 'Delivered' ? 'pill--ok' : s === 'Cancelled' ? 'pill--bad' : s === 'Pending' ? 'pill--warn' : '');
  const view = $('view');

  /* ===== Modal ===== */
  let lastFocus = null;
  function modal(html, wide) {
    const m = $('modal'); lastFocus = document.activeElement;
    m.innerHTML = `<div class="modal__box ${wide ? 'modal__box--wide' : ''}" role="dialog" aria-modal="true" tabindex="-1">${html}</div>`;
    m.hidden = false; document.body.style.overflow = 'hidden';
    m.firstElementChild.focus();
  }
  function closeModal() { const m = $('modal'); m.hidden = true; m.innerHTML = ''; document.body.style.overflow = ''; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  const mmsg = (t, kind) => { const m = $('modalMsg'); if (m) { m.textContent = t; m.className = 'form-msg' + (kind ? ' is-' + kind : ''); } };

  /* ===== Router ===== */
  const ROUTES = { dashboard: ['Dashboard', dashboard], orders: ['Orders', ordersView], products: ['Products', productsView], inventory: ['Inventory', inventoryView], customers: ['Customers', customersView] };
  const state = { range: 30, o: { q: '', status: '', pay: '', sort: 'newest' }, inv: { product: '', low: false, q: '', shown: 40 }, cq: '' };
  function route() {
    const raw = location.hash.replace(/^#\/?/, ''), [name, qs] = raw.split('?');
    const key = ROUTES[name] ? name : 'dashboard';
    const params = new URLSearchParams(qs || '');
    if (key === 'orders' && params.has('q')) state.o.q = params.get('q');
    $('crumb').innerHTML = `Admin <span aria-hidden="true">/</span> <strong>${ROUTES[key][0]}</strong>`;
    document.title = `${ROUTES[key][0]} | AURÉLLE Admin`;
    document.querySelectorAll('#sideNav a').forEach((a) => (a.dataset.route === key ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    setSide(false);
    ROUTES[key][1]();
    badge();
  }
  function badge() {
    const n = orders().filter((o) => o.orderStatus === 'Pending').length, b = $('pendingBadge');
    b.textContent = n; b.hidden = !n;
  }
  const refresh = () => ROUTES[(location.hash.replace(/^#\/?/, '').split('?')[0])] ? route() : route();

  /* ===== Dashboard ===== */
  function dashboard() {
    const days = state.range, since = Date.now() - days * 864e5, all = orders();
    const inR = all.filter((o) => new Date(o.createdAt) >= since);
    const paid = all.filter((o) => revenueOf(o) > 0 && new Date(o.paidAt || o.createdAt) >= since);
    const revenue = paid.reduce((n, o) => n + revenueOf(o), 0);
    const emails = new Set([...users().map((u) => u.email), ...all.map((o) => (o.customer.email || '').toLowerCase())]);
    const pending = all.filter((o) => o.orderStatus === 'Pending').length;
    const lowVariants = ALL().filter((p) => p.published).flatMap((p) => A.variants(p).map((v) => ({ ...v, name: p.name, slug: p.slug }))).filter((v) => v.stock <= LOW).sort((a, b) => a.stock - b.stock);
    const lowProducts = new Set(lowVariants.map((v) => v.slug)).size;
    const hasDemo = all.some((o) => o.demo);

    // daily revenue
    const buckets = [];
    for (let i = days - 1; i >= 0; i--) { const d = new Date(Date.now() - i * 864e5); buckets.push({ key: d.toISOString().slice(0, 10), label: d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }), value: 0 }); }
    paid.forEach((o) => { const b = buckets.find((x) => x.key === (o.paidAt || o.createdAt).slice(0, 10)); if (b) b.value += revenueOf(o); });

    // best sellers (units in non-cancelled orders in range)
    const units = {};
    inR.filter((o) => o.orderStatus !== 'Cancelled').forEach((o) => o.items.forEach((i) => { units[i.name] = (units[i.name] || 0) + i.quantity; }));
    const best = Object.entries(units).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const activity = [...users().map((u) => ({ at: u.createdAt, text: `${u.name} created an account` })),
      ...all.map((o) => ({ at: o.createdAt, text: `${o.customer.fullName} placed order ${o.ref} (${naira(o.total)})` }))].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);
    const recent = [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

    view.innerHTML = `
      <div class="view__head">
        <div><h1 class="view__title">Dashboard</h1><p class="view__sub">${hasDemo ? 'Includes sample data.' : 'Live from your database.'} Revenue counts verified payments only.</p></div>
        <div class="view__actions">
          <label class="sr-only" for="rangeSel">Date range</label>
          <select class="field field--select" id="rangeSel">${[7, 30, 90].map((d) => `<option value="${d}" ${d === days ? 'selected' : ''}>Last ${d} days</option>`).join('')}</select>
          ${hasDemo ? '<button class="btn btn--ghost" id="clearDemo" type="button">Remove sample data</button>' : '<button class="btn btn--dark" id="loadDemo" type="button">Load sample data</button>'}
        </div>
      </div>
      <div class="cards">
        ${[['Total revenue', naira(revenue), `Last ${days} days`], ['Total orders', inR.length, `Last ${days} days`], ['Pending orders', pending, 'Need action'],
           ['Completed orders', inR.filter((o) => o.orderStatus === 'Delivered').length, `Last ${days} days`], ['Customers', emails.size, 'All time'],
           ['Published products', A.products.length, 'On the store'], ['Low-stock products', lowProducts, `${LOW} or fewer in a variant`]]
          .map(([l, v, h]) => `<div class="stat"><p class="stat__label">${l}</p><p class="stat__value">${v}</p><p class="stat__hint">${h}</p></div>`).join('')}
      </div>
      <div class="grid2">
        <section class="panel"><h2 class="panel__title">Revenue overview</h2>${revenue || paid.length ? chart(buckets) : '<p class="empty-note">No verified payments in this period yet.</p>'}</section>
        <section class="panel"><h2 class="panel__title">Best-selling products</h2>${best.length ? `<ol class="rank">${best.map(([n, u]) => `<li><span>${esc(n)}</span><b>${u} sold</b></li>`).join('')}</ol>` : '<p class="empty-note">No orders in this period yet.</p>'}</section>
      </div>
      <section class="panel"><div class="panel__head"><h2 class="panel__title">Recent orders</h2><a class="text-link" href="#/orders">View all</a></div>
        ${recent.length ? ordersTable(recent) : '<p class="empty-note">No orders yet. Place one on the store, or load sample data.</p>'}</section>
      <div class="grid2">
        <section class="panel"><div class="panel__head"><h2 class="panel__title">Low-stock alerts</h2><a class="text-link" href="#/inventory">Inventory</a></div>
          ${lowVariants.length ? `<ul class="alerts">${lowVariants.slice(0, 6).map((v) => `<li><span>${esc(v.name)}<small>${esc(v.colour)}, ${esc(v.size)} · ${esc(v.sku)}</small></span>${pill(v.stock === 0 ? 'Out' : v.stock + ' left', v.stock === 0 ? 'pill--bad' : 'pill--warn')}</li>`).join('')}</ul>` : '<p class="empty-note">Everything is well stocked.</p>'}</section>
        <section class="panel"><h2 class="panel__title">Recent customer activity</h2>
          ${activity.length ? `<ul class="alerts">${activity.map((a) => `<li><span>${esc(a.text)}<small>${O.fmtTime(a.at)}</small></span></li>`).join('')}</ul>` : '<p class="empty-note">No activity yet.</p>'}</section>
      </div>`;
    $('rangeSel').addEventListener('change', (e) => { state.range = +e.target.value; dashboard(); });
    if ($('loadDemo')) $('loadDemo').addEventListener('click', async (e) => { e.currentTarget.disabled = true; const r = await window.DB.loadDemo(buildDemo()); if (!r.ok) alert(r.error); await window.DB.refreshAll(); dashboard(); badge(); });
    if ($('clearDemo')) $('clearDemo').addEventListener('click', async (e) => { e.currentTarget.disabled = true; const r = await window.DB.clearDemo(); if (!r.ok) alert(r.error); await window.DB.refreshAll(); dashboard(); badge(); });
  }

  function chart(b) {
    const W = 640, H = 220, P = 30, max = Math.max(1, ...b.map((d) => d.value)), bw = (W - P * 2) / b.length;
    const bars = b.map((d, i) => { const h = (d.value / max) * (H - P * 2); return `<rect x="${(P + i * bw + bw * 0.15).toFixed(1)}" y="${(H - P - h).toFixed(1)}" width="${(bw * 0.7).toFixed(1)}" height="${d.value ? Math.max(h, 2).toFixed(1) : 0}" rx="2"><title>${d.label}: ${naira(d.value)}</title></rect>`; }).join('');
    return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Daily verified revenue, highest day ${naira(max)}">
      <line x1="${P}" y1="${H - P}" x2="${W - P}" y2="${H - P}"/>${bars}
      <text x="${P}" y="14" class="t">${naira(max)}</text>
      <text x="${P}" y="${H - 8}" class="t">${b[0].label}</text><text x="${W - P}" y="${H - 8}" class="t" text-anchor="end">${b[b.length - 1].label}</text></svg></div>`;
  }

  /* ===== Orders ===== */
  function ordersTable(list) {
    return `<div class="table-wrap"><table class="tbl"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>
      ${list.map((o) => `<tr><td><strong>${esc(o.ref)}</strong>${o.demo ? ' <span class="tag">sample</span>' : ''}</td><td>${esc(o.customer.fullName)}</td><td>${O.fmt(o.createdAt)}</td><td>${naira(o.total)}</td>
      <td>${pill(O.payLabel(o), payCls(o))}</td><td>${pill(o.orderStatus, stCls(o.orderStatus))}</td><td><button class="text-link" data-order="${esc(o.ref)}" type="button">View</button></td></tr>`).join('')}
      </tbody></table></div>`;
  }
  function ordersView() {
    const f = state.o;
    view.innerHTML = `
      <div class="view__head"><div><h1 class="view__title">Orders</h1><p class="view__sub" id="ordCount"></p></div></div>
      <div class="filters-row">
        <div><label class="sr-only" for="oq">Search</label><input class="field" id="oq" type="search" placeholder="Search order, customer, product or SKU" value="${esc(f.q)}"></div>
        <select class="field" id="os" aria-label="Order status"><option value="">All statuses</option>${[...O.STEPS, 'Cancelled'].map((s) => `<option ${f.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
        <select class="field" id="op" aria-label="Payment status"><option value="">All payments</option>${['Unpaid', 'Paid', 'Partially refunded', 'Refunded'].map((s) => `<option ${f.pay === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
        <select class="field" id="osort" aria-label="Sort orders">${[['newest', 'Newest first'], ['oldest', 'Oldest first'], ['high', 'Highest total'], ['low', 'Lowest total']].map(([v, l]) => `<option value="${v}" ${f.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      </div>
      <div id="ordList"></div>`;
    const draw = () => {
      const q = f.q.trim().toLowerCase();
      let list = orders().filter((o) => (!q || [o.ref, o.customer.fullName, o.customer.email].some((x) => String(x).toLowerCase().includes(q)) ||
        (o.items || []).some((i) => [i.name, i.sku, i.slug].some((x) => String(x || '').toLowerCase().includes(q)))) &&
        (!f.status || o.orderStatus === f.status) && (!f.pay || o.paymentStatus === f.pay));
      const cmp = { newest: (a, b) => b.createdAt.localeCompare(a.createdAt), oldest: (a, b) => a.createdAt.localeCompare(b.createdAt), high: (a, b) => b.total - a.total, low: (a, b) => a.total - b.total }[f.sort];
      list = list.sort(cmp);
      $('ordCount').textContent = `${list.length} ${list.length === 1 ? 'order' : 'orders'}`;
      $('ordList').innerHTML = list.length ? ordersTable(list) : '<div class="empty"><h2>No orders found</h2><p>Try a different search or filter.</p></div>';
    };
    $('oq').addEventListener('input', (e) => { f.q = e.target.value; draw(); });
    $('os').addEventListener('change', (e) => { f.status = e.target.value; draw(); });
    $('op').addEventListener('change', (e) => { f.pay = e.target.value; draw(); });
    $('osort').addEventListener('change', (e) => { f.sort = e.target.value; draw(); });
    draw();
  }

  const NEXT = { Pending: ['Confirmed', 'Confirm order'], Confirmed: ['Processing', 'Start processing'], Processing: ['Shipped', 'Mark as shipped'], Shipped: ['Delivered', 'Mark as delivered'] };
  function openOrder(ref) {
    const o = orders().find((x) => x.ref === ref); if (!o) return;
    const c = o.customer, next = NEXT[o.orderStatus], canCancel = ['Pending', 'Confirmed', 'Processing'].includes(o.orderStatus);
    const canRefund = (o.paymentStatus === 'Paid' || o.paymentStatus === 'Partially refunded') && o.total - (o.refunded || 0) > 0;
    const log = o.paymentLog || [];
    modal(`
      <div class="modal__head"><div><h2 class="modal__title">Order ${esc(o.ref)}</h2><p class="view__sub">Placed ${O.fmtTime(o.createdAt)}</p></div><button class="icon-btn" data-close aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
      <div class="status-row">${pill('Order: ' + o.orderStatus, stCls(o.orderStatus))}${pill('Payment: ' + O.payLabel(o), payCls(o))}${o.refunded ? pill('Refunded ' + naira(o.refunded)) : ''}</div>
      <div class="cols">
        <div>
          <h3 class="mini-title">Items</h3>
          <ul class="osum osum--page">${o.items.map((i) => {
            const image = productImage(i);
            return `<li class="osum__item"><span class="osum__img" data-name="${esc(i.name)}">${image ? `<img src="${esc(image)}" alt="${esc(i.name)}" width="56" height="75" loading="lazy">` : ''}<b>${esc(i.quantity)}</b></span><span class="osum__text"><strong>${esc(i.name)}</strong><small>${esc(i.colour)}, ${esc(i.size)} · Qty ${esc(i.quantity)} · ${esc(i.sku)}</small></span><span>${naira(i.lineTotal)}</span></li>`;
          }).join('')}</ul>
          <dl class="totals"><div><dt>Subtotal</dt><dd>${naira(o.subtotal)}</dd></div><div><dt>Delivery</dt><dd>${o.deliveryFee ? naira(o.deliveryFee) : 'Free'}</dd></div><div class="totals__sum"><dt>Total</dt><dd>${naira(o.total)}</dd></div></dl>
          <h3 class="mini-title">Customer</h3>
          <p class="plain">${esc(c.fullName)}<br>${esc(c.email)} · ${esc(c.phone)}<br>${esc(c.address)}, ${esc(c.city)}, ${esc(c.state)}${c.notes ? '<br><em>Note: ' + esc(c.notes) + '</em>' : ''}</p>
        </div>
        <div>
          <h3 class="mini-title">Progress</h3>${O.timeline(o)}
          <h3 class="mini-title">Payment audit log</h3>
          ${log.length ? `<ul class="alerts">${log.map((l) => `<li><span>${esc(l.action)}${l.reference ? ' · ref ' + esc(l.reference) : ''}${l.amount ? ' · ' + naira(l.amount) : ''}<small>${esc(l.reason)} — ${esc(l.by)}, ${O.fmtTime(l.at)}</small></span></li>`).join('')}</ul>` : '<p class="empty-note">No payment actions recorded.</p>'}
        </div>
      </div>
      <div class="actions">
        <h3 class="mini-title">Actions</h3>
        <div class="btn-row">
          ${next ? `<button class="btn btn--brown" data-act="status" data-ref="${esc(o.ref)}" data-to="${next[0]}">${next[1]}</button>` : ''}
          ${canCancel ? `<button class="btn btn--ghost" data-act="showCancel">Cancel order</button>` : ''}
          ${canRefund ? `<button class="btn btn--ghost" data-act="showRefund">Record refund</button>` : ''}
          ${o.paymentStatus === 'Unpaid' && o.orderStatus !== 'Cancelled' ? `<button class="btn btn--ghost" data-act="showVerify">Verify payment</button>` : ''}
        </div>
        <div id="actionForm"></div>
        <p class="form-msg" id="modalMsg" role="status"></p>
      </div>`, true);
    $('modal').dataset.ref = o.ref;
  }

  /* Changes are made by the database (it re-checks the rules); we then reload and redraw. */
  async function apply(promise) {
    const r = await promise; if (!r.ok) return r.error;
    await window.DB.refreshAll(); return '';
  }

  const form = (html) => { $('actionForm').innerHTML = html; const first = $('actionForm').querySelector('input,textarea'); if (first) first.focus(); };
  async function modalAction(btn) {
    const ref = $('modal').dataset.ref, act = btn.dataset.act, DB = window.DB;
    if (act === 'status') {
      const to = btn.dataset.to;
      const err = await apply(DB.setStatus(ref, to));
      if (err) return mmsg(err, 'error');
      openOrder(ref); refreshList(); mmsg(`Order marked ${to}.`, 'ok');
    }
    if (act === 'showCancel') form(`<div class="fgroup"><label for="cReason">Reason for cancelling</label><input class="field" id="cReason" maxlength="120"></div><button class="btn btn--dark" data-act="doCancel">Confirm cancellation</button>`);
    if (act === 'doCancel') {
      const reason = $('cReason').value.trim(); if (reason.length < 5) return mmsg('Enter a reason of at least 5 characters.', 'error');
      const err = await apply(DB.setStatus(ref, 'Cancelled', reason));
      if (err) return mmsg(err, 'error');
      const paid = (orders().find((x) => x.ref === ref) || {}).paymentStatus === 'Paid';
      openOrder(ref); refreshList(); mmsg(paid ? 'Order cancelled and stock restored. Record a refund for the paid amount.' : 'Order cancelled and stock restored.', 'ok');
    }
    if (act === 'showVerify') form(`<p class="plain">In production, Paystack confirms payments automatically through a signed webhook. This demo records a manual verification with a reference and a reason, which are saved in the audit log.</p>
      <div class="fgroup"><label for="vRef">Paystack transaction reference</label><input class="field" id="vRef"></div>
      <div class="fgroup"><label for="vReason">Reason and evidence</label><textarea class="field field--area" id="vReason" rows="2"></textarea></div>
      <button class="btn btn--dark" data-act="doVerify">Record verification</button>`);
    if (act === 'doVerify') {
      const r = $('vRef').value.trim(), why = $('vReason').value.trim();
      if (r.length < 6) return mmsg('Enter the payment reference (at least 6 characters).', 'error');
      if (why.length < 10) return mmsg('Enter a reason of at least 10 characters.', 'error');
      const err = await apply(DB.verifyPayment(ref, r, why));
      if (err) return mmsg(err, 'error');
      openOrder(ref); refreshList(); mmsg('Payment recorded as verified and added to the audit log.', 'ok');
    }
    if (act === 'showRefund') {
      const o = orders().find((x) => x.ref === ref), left = o.total - (o.refunded || 0);
      form(`<div class="fgroup"><label for="rAmt">Refund amount in ₦ (up to ${naira(left)})</label><input class="field" id="rAmt" type="number" min="1" step="0.01" value="${left / 100}"></div>
        <div class="fgroup"><label for="rReason">Reason</label><input class="field" id="rReason" maxlength="120"></div>
        <button class="btn btn--dark" data-act="doRefund">Record refund</button>`);
    }
    if (act === 'doRefund') {
      const amt = Math.round(parseFloat($('rAmt').value) * 100), why = $('rReason').value.trim();
      if (!(amt > 0)) return mmsg('Enter a refund amount above zero.', 'error');
      if (why.length < 5) return mmsg('Enter a reason of at least 5 characters.', 'error');
      const err = await apply(DB.refund(ref, amt, why));
      if (err) return mmsg(err, 'error');
      openOrder(ref); refreshList(); mmsg('Refund recorded. Revenue figures now exclude it.', 'ok');
    }
  }
  const refreshList = () => { const h = location.hash; if (h.startsWith('#/orders')) ordersView(); else if (h.startsWith('#/dashboard') || !h) dashboard(); else if (h.startsWith('#/customers')) customersView(); badge(); };

  /* ===== Products ===== */
  const toNaira = (k) => (k / 100).toString();
  function productsView() {
    view.innerHTML = `
      <div class="view__head"><div><h1 class="view__title">Products</h1><p class="view__sub">Price, discount and visibility changes show on the store straight away. Adding products and uploading images arrives in the next step.</p></div></div>
      <div class="table-wrap"><table class="tbl"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Status</th><th>Stock</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>
      ${ALL().map((p) => `<tr><td><span class="thumb" data-name="${esc(p.name)}"><img src="${p.image}" alt="" width="40" height="53" loading="lazy"></span> <strong>${esc(p.name)}</strong></td><td>${esc(A.catLabel[p.category])}</td>
        <td>${naira(p.price)}${p.compare ? ` <s class="muted">${naira(p.compare)}</s>` : ''}</td><td>${pill(p.published ? 'Published' : 'Unpublished', p.published ? 'pill--ok' : '')}</td>
        <td>${A.totalStock(p)}</td><td><button class="text-link" data-edit="${p.slug}" type="button">Edit</button> <button class="text-link" data-toggle="${p.slug}" type="button">${p.published ? 'Unpublish' : 'Publish'}</button></td></tr>`).join('')}
      </tbody></table></div>`;
  }
  async function saveOverride(slug, patch) {
    const row = {};
    if ('price' in patch) row.price = patch.price;
    if ('compare' in patch) row.compare_price = patch.compare;
    if ('published' in patch) row.published = patch.published;
    const r = await window.DB.updateProduct(slug, row);
    if (!r.ok) return r.error;
    await window.DB.refreshAll();
    return '';
  }
  function editProduct(slug) {
    const p = ALL().find((x) => x.slug === slug);
    modal(`<div class="modal__head"><h2 class="modal__title">Edit ${esc(p.name)}</h2><button class="icon-btn" data-close aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
      <div class="fgroup"><label for="eReg">Regular price (₦)</label><input class="field" id="eReg" type="number" min="1" step="0.01" value="${toNaira(p.compare || p.price)}"></div>
      <div class="fgroup"><label for="eDis">Discount price (₦, leave empty for none)</label><input class="field" id="eDis" type="number" min="1" step="0.01" value="${p.compare ? toNaira(p.price) : ''}"></div>
      <label class="check"><input type="checkbox" id="ePub" ${p.published ? 'checked' : ''}><span>Published on the store</span></label>
      <div class="btn-row"><button class="btn btn--dark" data-act="saveProduct" data-slug="${p.slug}">Save changes</button><button class="btn btn--ghost" data-close>Cancel</button></div>
      <p class="form-msg" id="modalMsg" role="alert"></p>`);
  }

  /* ===== Inventory ===== */
  function inventoryView() {
    const f = state.inv;
    view.innerHTML = `
      <div class="view__head"><div><h1 class="view__title">Inventory</h1><p class="view__sub">Stock is tracked for every size and colour. Each change needs a reason and is logged.</p></div></div>
      <div class="filters-row">
        <input class="field" id="iq" type="search" placeholder="Search by SKU or product" value="${esc(f.q)}" aria-label="Search inventory">
        <select class="field" id="ip" aria-label="Product"><option value="">All products</option>${ALL().map((p) => `<option value="${p.slug}" ${f.product === p.slug ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>
        <label class="check"><input type="checkbox" id="il" ${f.low ? 'checked' : ''}><span>Low or out of stock only</span></label>
      </div>
      <div id="invTable"></div>
      <section class="panel"><h2 class="panel__title">Inventory change history</h2><div id="invHist"></div></section>`;
    const draw = () => {
      const q = f.q.trim().toLowerCase();
      const rows = ALL().filter((p) => !f.product || p.slug === f.product).flatMap((p) => A.variants(p).map((v) => ({ ...v, name: p.name, slug: p.slug })))
        .filter((v) => (!q || v.sku.toLowerCase().includes(q) || v.name.toLowerCase().includes(q)) && (!f.low || v.stock <= LOW));
      $('invTable').innerHTML = rows.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>Product</th><th>SKU</th><th>Colour</th><th>Size</th><th>Stock</th><th>Status</th><th><span class="sr-only">Action</span></th></tr></thead><tbody>
        ${rows.slice(0, f.shown).map((v) => `<tr><td>${esc(v.name)}</td><td><code>${esc(v.sku)}</code></td><td>${esc(v.colour)}</td><td>${esc(v.size)}</td><td><strong>${v.stock}</strong></td>
        <td>${pill(v.stock === 0 ? 'Out of stock' : v.stock <= LOW ? 'Low stock' : 'In stock', v.stock === 0 ? 'pill--bad' : v.stock <= LOW ? 'pill--warn' : 'pill--ok')}</td>
        <td><button class="text-link" data-adjust="${esc(v.sku)}" data-slug="${v.slug}" type="button">Adjust</button></td></tr>`).join('')}</tbody></table></div>
        ${rows.length > f.shown ? `<div class="more"><button class="btn btn--ghost" id="invMore" type="button">Show more (${rows.length - f.shown} left)</button></div>` : ''}` : '<div class="empty"><h2>No matching variants</h2></div>';
      if ($('invMore')) $('invMore').addEventListener('click', () => { f.shown += 40; draw(); });
      const h = invLog().slice(0, 15);
      $('invHist').innerHTML = h.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>When</th><th>SKU</th><th>Change</th><th>From → To</th><th>Reason</th><th>By</th></tr></thead><tbody>${h.map((l) => `<tr><td>${O.fmtTime(l.at)}</td><td><code>${esc(l.sku)}</code></td><td>${l.change > 0 ? '+' : ''}${l.change}</td><td>${l.from} → ${l.to}</td><td>${esc(l.reason)}</td><td>${esc(l.by)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="empty-note">No stock changes recorded yet.</p>';
    };
    $('iq').addEventListener('input', (e) => { f.q = e.target.value; f.shown = 40; draw(); });
    $('ip').addEventListener('change', (e) => { f.product = e.target.value; f.shown = 40; draw(); });
    $('il').addEventListener('change', (e) => { f.low = e.target.checked; f.shown = 40; draw(); });
    draw();
  }
  function adjustModal(sku, slug) {
    const p = ALL().find((x) => x.slug === slug), v = A.variants(p).find((x) => x.sku === sku);
    modal(`<div class="modal__head"><div><h2 class="modal__title">Adjust stock</h2><p class="view__sub">${esc(p.name)} · ${esc(v.colour)}, ${esc(v.size)} · now ${v.stock}</p></div><button class="icon-btn" data-close aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
      <fieldset class="fieldset"><legend class="sr-only">Type of change</legend>
        <label class="check"><input type="radio" name="kind" value="add" checked><span>Add stock</span></label>
        <label class="check"><input type="radio" name="kind" value="deduct"><span>Deduct stock</span></label>
        <label class="check"><input type="radio" name="kind" value="set"><span>Set exact quantity</span></label></fieldset>
      <div class="fgroup"><label for="aQty">Quantity</label><input class="field" id="aQty" type="number" min="0" step="1" value="1"></div>
      <div class="fgroup"><label for="aWhy">Reason</label><input class="field" id="aWhy" maxlength="120" placeholder="For example: new delivery, stock count correction"></div>
      <div class="btn-row"><button class="btn btn--dark" data-act="saveStock" data-sku="${esc(sku)}" data-slug="${slug}">Save</button><button class="btn btn--ghost" data-close>Cancel</button></div>
      <p class="form-msg" id="modalMsg" role="alert"></p>`);
  }

  /* ===== Customers ===== */
  function customersView() {
    const map = {};
    users().forEach((u) => { map[u.email] = { name: u.name, email: u.email, phone: u.phone || '', type: 'Registered', joined: u.createdAt, status: u.status || 'active', orders: 0, spent: 0 }; });
    orders().forEach((o) => {
      const e = (o.customer.email || '').toLowerCase();
      const c = map[e] || (map[e] = { name: o.customer.fullName, email: e, phone: o.customer.phone, type: 'Guest', joined: o.createdAt, status: '—', orders: 0, spent: 0 });
      c.orders++; c.spent += revenueOf(o);
      if (o.createdAt < c.joined && c.type === 'Guest') c.joined = o.createdAt;
    });
    const q = state.cq.trim().toLowerCase();
    const rows = Object.values(map).filter((c) => !q || c.name.toLowerCase().includes(q) || c.email.includes(q)).sort((a, b) => b.joined.localeCompare(a.joined));
    view.innerHTML = `
      <div class="view__head"><div><h1 class="view__title">Customers</h1><p class="view__sub">${rows.length} ${rows.length === 1 ? 'customer' : 'customers'}. Contact details are private to admins.</p></div></div>
      <div class="filters-row"><input class="field" id="cq" type="search" placeholder="Search by name or email" value="${esc(state.cq)}" aria-label="Search customers"></div>
      ${rows.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Type</th><th>Joined</th><th>Account</th><th>Orders</th><th>Spent</th></tr></thead><tbody>
      ${rows.map((c) => `<tr><td><strong>${esc(c.name)}</strong></td><td>${esc(c.email)}</td><td>${esc(c.phone)}</td><td>${pill(c.type)}</td><td>${O.fmt(c.joined)}</td><td>${esc(c.status)}</td>
        <td>${c.orders ? `<a class="text-link" href="#/orders?q=${encodeURIComponent(c.email)}">${c.orders}</a>` : 0}</td><td>${naira(c.spent)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty"><h2>No customers yet</h2><p>Customers appear when someone registers or places an order.</p></div>'}`;
    $('cq').addEventListener('input', (e) => { state.cq = e.target.value; const pos = e.target.selectionStart; customersView(); const n = $('cq'); n.focus(); n.setSelectionRange(pos, pos); });
  }

  /* ===== Sample data ===== */
  function buildDemo() {
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const people = [['Chiamaka Okoro', 'Enugu'], ['Emeka Nwosu', 'Anambra'], ['Ifeoma Eze', 'Lagos'], ['Tobenna Udeh', 'FCT Abuja'], ['Adaeze Obi', 'Enugu'], ['Kelechi Ibe', 'Imo'], ['Sade Bello', 'Lagos'], ['Uche Agu', 'Enugu']];
    const plan = [['Delivered', 'Paid'], ['Delivered', 'Paid'], ['Delivered', 'Paid'], ['Shipped', 'Paid'], ['Shipped', 'Paid'], ['Processing', 'Paid'], ['Processing', 'Paid'], ['Confirmed', 'Paid'], ['Confirmed', 'Paid'], ['Pending', 'Unpaid'], ['Pending', 'Unpaid'], ['Cancelled', 'Unpaid'], ['Delivered', 'Paid'], ['Confirmed', 'Paid']];
    const prods = A.products, out = [];
    plan.forEach(([status, pay], n) => {
      const [name, state_] = people[Math.floor(rnd() * people.length)];
      const items = [];
      for (let k = 0; k < 1 + Math.floor(rnd() * 2); k++) {
        const p = prods[Math.floor(rnd() * prods.length)], vs = A.variants(p).filter((v) => v.stock > 0); if (!vs.length) continue;
        const v = vs[Math.floor(rnd() * vs.length)], q = 1 + Math.floor(rnd() * 2);
        items.push({ slug: p.slug, name: p.name, image: p.image, sku: v.sku, size: v.size, colour: v.colour, unitPrice: p.price, quantity: q, lineTotal: p.price * q });
      }
      if (!items.length) return;
      const sub = items.reduce((t, i) => t + i.lineTotal, 0), fee = S.deliveryFee(state_, sub), ago = Math.floor((n / plan.length) * 26 + rnd() * 2);
      const t0 = Date.now() - ago * 864e5, at = (h) => new Date(t0 + h * 36e5).toISOString();
      const hist = [{ status: 'Pending', at: at(0), note: 'Order placed' }];
      const chain = ['Confirmed', 'Processing', 'Shipped', 'Delivered'], idx = chain.indexOf(status);
      if (status === 'Cancelled') hist.push({ status: 'Cancelled', at: at(3), note: 'Customer changed their mind', by: 'demo' });
      else for (let s = 0; s <= idx; s++) hist.push({ status: chain[s], at: at(2 + s * 10), note: 'Status updated', by: 'demo' });
      const email = name.toLowerCase().replace(/[^a-z]+/g, '.') + '@example.com';
      out.push({ ref: `AUR-DEMO-${(1000 + n).toString(36).toUpperCase()}${n}`, items, subtotal: sub, deliveryFee: fee, total: sub + fee, demo: true, stockDeducted: false,
        customer: { fullName: name, email, phone: '08012345678', address: '14 Sample Street', state: state_, city: state_, notes: '' },
        orderStatus: status, paymentStatus: pay, createdAt: at(0), paidAt: pay === 'Paid' ? at(1) : undefined, history: hist,
        paymentLog: pay === 'Paid' ? [{ action: 'Verified (sample data)', reference: 'DEMO-REF', reason: 'Generated sample order', by: 'demo', at: at(1) }] : [], userEmail: null });
    });
    return out;
  }

  /* ===== Layout: sidebar, search, events ===== */
  function setSide(open) {
    $('side').classList.toggle('is-open', open); $('adminScrim').hidden = !open;
    $('menuBtn').setAttribute('aria-expanded', String(open));
  }
  $('menuBtn').addEventListener('click', () => setSide(true));
  $('adminScrim').addEventListener('click', () => setSide(false));
  const shell = $('shell');
  const setCollapsed = (on) => { shell.classList.toggle('is-collapsed', on); $('collapseBtn').setAttribute('aria-pressed', String(on)); try { localStorage.setItem('aurelle_admin_collapsed', on ? '1' : ''); } catch (e) {} };
  $('collapseBtn').addEventListener('click', () => setCollapsed(!shell.classList.contains('is-collapsed')));
  try { if (localStorage.getItem('aurelle_admin_collapsed')) setCollapsed(true); } catch (e) {}
  $('logoutBtn').addEventListener('click', async () => { await window.AUTH.logout(); location.href = 'login.html'; });
  $('searchForm').addEventListener('submit', (e) => { e.preventDefault(); const q = $('globalSearch').value.trim(); state.o.q = q; location.hash = '#/orders?q=' + encodeURIComponent(q); if (location.hash.startsWith('#/orders')) ordersView(); });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('globalSearch').focus(); }
    if (e.key === 'Escape') { if (!$('modal').hidden) closeModal(); else setSide(false); }
  });

  document.addEventListener('click', async (e) => {
    const t = e.target;
    if (t.closest('[data-close]') || t === $('modal')) return closeModal();
    const ob = t.closest('[data-order]'); if (ob) return openOrder(ob.dataset.order);
    const act = t.closest('[data-act]'); if (act && !$('modal').hidden) {
      if (act.dataset.act === 'saveProduct') {
        const reg = Math.round(parseFloat($('eReg').value) * 100), disRaw = $('eDis').value.trim(), dis = disRaw ? Math.round(parseFloat(disRaw) * 100) : null;
        if (!(reg > 0)) return mmsg('Enter a regular price above zero.', 'error');
        if (dis !== null && !(dis > 0 && dis < reg)) return mmsg('The discount price must be above zero and below the regular price.', 'error');
        const perr = await saveOverride(act.dataset.slug, { price: dis !== null ? dis : reg, compare: dis !== null ? reg : null, published: $('ePub').checked });
        if (perr) return mmsg(perr, 'error');
        closeModal(); return productsView();
      }
      if (act.dataset.act === 'saveStock') {
        const kind = document.querySelector('input[name="kind"]:checked').value, qty = parseInt($('aQty').value, 10), why = $('aWhy').value.trim();
        if (!(qty >= 0) || isNaN(qty)) return mmsg('Enter a whole number, zero or more.', 'error');
        if (why.length < 5) return mmsg('Enter a reason of at least 5 characters.', 'error');
        const p = ALL().find((x) => x.slug === act.dataset.slug), v = A.variants(p).find((x) => x.sku === act.dataset.sku);
        const delta = kind === 'add' ? qty : kind === 'deduct' ? -qty : qty - v.stock;
        if (kind === 'deduct' && qty > v.stock) return mmsg(`You can't deduct more than the ${v.stock} in stock.`, 'error');
        const r = await window.DB.adjustStock(v.sku, delta, why); if (!r.ok) return mmsg(r.error, 'error');
        await window.DB.refreshAll();
        closeModal(); return inventoryView();
      }
      return modalAction(act);
    }
    const ed = t.closest('[data-edit]'); if (ed) return editProduct(ed.dataset.edit);
    const tg = t.closest('[data-toggle]'); if (tg) { const p = ALL().find((x) => x.slug === tg.dataset.toggle); const perr = await saveOverride(p.slug, { published: !p.published }); if (perr) alert(perr); return productsView(); }
    const ad = t.closest('[data-adjust]'); if (ad) return adjustModal(ad.dataset.adjust, ad.dataset.slug);
  });

  window.addEventListener('hashchange', route);
  route();
})();
