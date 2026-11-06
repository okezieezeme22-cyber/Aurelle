(() => {
  const A = window.AURELLE, U = window.AUTH, S = window.AURELLE_SHOP, $ = (id) => document.getElementById(id);
  const year = $('year'); if (year) year.textContent = new Date().getFullYear();
  const me0 = U.current();
  if (!me0) { location.replace('login.html?next=account.html'); return; }
  const root = $('accRoot');
  const date = (iso) => new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  const say = (id, m, kind) => { const el = $(id); el.textContent = m; el.className = 'form-msg' + (kind ? ' is-' + kind : ''); };
  const STEPS = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
  const myOrders = () => A.rd('aurelle_orders', []).filter((o) => (o.userEmail || o.customer.email).toLowerCase() === me0.email);
  const payLabel = (s) => (s === 'Unpaid' ? 'Pending payment' : s);

  const NAV = [['profile', 'Profile'], ['addresses', 'Addresses'], ['orders', 'Orders']];
  function shell(view, inner) {
    const tab = view.startsWith('order/') ? 'orders' : view;
    root.innerHTML = `
      <div class="acc">
        <nav class="acc__nav" aria-label="Account">
          ${NAV.map(([k, l]) => `<a href="#${k}" ${k === tab ? 'aria-current="page"' : ''}>${l}</a>`).join('')}
          <button class="acc__out" id="logoutBtn" type="button">Log out</button>
        </nav>
        <div class="acc__body">${inner}</div>
      </div>`;
    $('logoutBtn').addEventListener('click', () => { U.logout(); location.href = 'index.html'; });
  }

  /* ----- Profile ----- */
  function profile() {
    const me = U.current();
    shell('profile', `
      <h2 class="block-title">Your profile</h2>
      <form class="stack" id="profForm" novalidate>
        <div class="fgroup"><label for="pName">Full name</label><input class="field" id="pName" value="${A.esc(me.name)}"></div>
        <div class="fgroup"><label for="pEmail">Email</label><input class="field" id="pEmail" value="${A.esc(me.email)}" disabled></div>
        <div class="fgroup"><label for="pPhone">Phone number</label><input class="field" id="pPhone" value="${A.esc(me.phone)}"></div>
        <button class="btn btn--dark" type="submit">Save changes</button>
        <p class="form-msg" id="profMsg" role="status"></p>
      </form>
      <h2 class="block-title">Change password</h2>
      <form class="stack" id="pwForm" novalidate>
        <div class="fgroup"><label for="pwOld">Current password</label><input class="field" id="pwOld" type="password" autocomplete="current-password"></div>
        <div class="fgroup"><label for="pwNew">New password</label><input class="field" id="pwNew" type="password" autocomplete="new-password"></div>
        <button class="btn btn--ghost" type="submit">Update password</button>
        <p class="form-msg" id="pwMsg" role="status"></p>
      </form>`);
    $('profForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('pName').value.trim(), phone = $('pPhone').value.trim();
      if (name.split(/\s+/).length < 2) return say('profMsg', 'Enter your first and last name.', 'error');
      if (!/^(\+234|234|0)[789][01]\d{8}$/.test(phone.replace(/[\s-]/g, ''))) return say('profMsg', 'Enter a valid Nigerian phone number.', 'error');
      U.update({ name, phone }); say('profMsg', 'Profile saved.', 'ok');
    });
    $('pwForm').addEventListener('submit', async (e) => {
      e.preventDefault(); const r = await U.changePassword($('pwOld').value, $('pwNew').value);
      if (!r.ok) return say('pwMsg', r.error, 'error');
      $('pwForm').reset(); say('pwMsg', 'Password updated.', 'ok');
    });
  }

  /* ----- Addresses ----- */
  function addresses() {
    const list = U.current().addresses;
    shell('addresses', `
      <h2 class="block-title">Delivery addresses</h2>
      ${list.length ? `<ul class="addr-list">${list.map((a, i) => `
        <li class="addr"><div><strong>${A.esc(a.label)}</strong>${a.isDefault ? '<span class="pill">Default</span>' : ''}
          <p>${A.esc(a.address)}, ${A.esc(a.city)}, ${A.esc(a.state)}</p></div>
          <div class="addr__act">${a.isDefault ? '' : `<button class="text-link" data-def="${i}" type="button">Make default</button>`}<button class="text-link" data-del="${i}" type="button">Remove</button></div></li>`).join('')}</ul>` : '<p class="page-sub">No saved addresses yet.</p>'}
      <h3 class="sub-title">Add an address</h3>
      <form class="fgrid" id="addrForm" novalidate>
        <div class="fgroup"><label for="aLabel">Label</label><input class="field" id="aLabel" placeholder="Home, Office"></div>
        <div class="fgroup"><label for="aState">State</label><select class="field" id="aState"><option value="">Select a state</option>${S.STATES.map((s) => `<option>${s}</option>`).join('')}</select></div>
        <div class="fgroup fgroup--wide"><label for="aAddr">Address</label><input class="field" id="aAddr"></div>
        <div class="fgroup"><label for="aCity">City or town</label><input class="field" id="aCity"></div>
        <div class="fgroup fgroup--wide"><button class="btn btn--dark" type="submit">Save address</button><p class="form-msg" id="addrMsg" role="alert"></p></div>
      </form>`);
    $('addrForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const a = { label: $('aLabel').value.trim(), address: $('aAddr').value.trim(), city: $('aCity').value.trim(), state: $('aState').value };
      if (!a.label || a.address.length < 8 || a.city.length < 2 || !a.state) return say('addrMsg', 'Fill in every field with a full address.', 'error');
      const l = [...list, { ...a, isDefault: !list.length }]; U.update({ addresses: l }); addresses();
    });
    root.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
      const l = list.filter((_, i) => i !== +b.dataset.del); if (l.length && !l.some((a) => a.isDefault)) l[0].isDefault = true;
      U.update({ addresses: l }); addresses();
    }));
    root.querySelectorAll('[data-def]').forEach((b) => b.addEventListener('click', () => {
      U.update({ addresses: list.map((a, i) => ({ ...a, isDefault: i === +b.dataset.def })) }); addresses();
    }));
  }

  /* ----- Orders ----- */
  function orders() {
    const l = myOrders();
    shell('orders', `
      <h2 class="block-title">Your orders</h2>
      ${l.length ? `<ul class="olist">${l.map((o) => `
        <li><a class="orow" href="#order/${encodeURIComponent(o.ref)}">
          <span><strong>${A.esc(o.ref)}</strong><small>${date(o.createdAt)} · ${o.items.reduce((n, i) => n + i.quantity, 0)} items</small></span>
          <span class="orow__right"><b>${A.naira(o.total)}</b><span class="pill">${o.orderStatus}</span><span class="pill ${o.paymentStatus === 'Paid' ? '' : 'pill--warn'}">${payLabel(o.paymentStatus)}</span></span></a></li>`).join('')}</ul>`
        : `<div class="empty empty--left"><p>You have not placed an order yet.</p><a class="btn btn--dark" href="shop.html">Start shopping</a></div>`}`);
  }

  function orderDetail(ref) {
    const o = myOrders().find((x) => x.ref === ref);
    if (!o) { shell('orders', `<h2 class="block-title">Order not found</h2><p class="page-sub">We could not find that order on your account.</p><a class="text-link" href="#orders">Back to orders</a>`); return; }
    const cancelled = o.orderStatus === 'Cancelled';
    const at = (s) => { const h = (o.history || []).find((x) => x.status === s); return h ? date(h.at) : ''; };
    const idx = STEPS.indexOf(o.orderStatus);
    const delivered = o.orderStatus === 'Delivered';
    const reviewed = new Set(A.rd('aurelle_reviews', []).filter((r) => r.email === me0.email).map((r) => r.slug));
    shell('order/' + ref, `
      <a class="text-link" href="#orders">All orders</a>
      <h2 class="block-title">${A.esc(o.ref)}</h2>
      <div class="status-row"><span class="pill">Order: ${o.orderStatus}</span><span class="pill ${o.paymentStatus === 'Paid' ? '' : 'pill--warn'}">Payment: ${payLabel(o.paymentStatus)}</span></div>
      ${cancelled ? `<p class="banner banner--bad">This order was cancelled${at('Cancelled') ? ' on ' + at('Cancelled') : ''}.</p>` : `
      <ol class="timeline" aria-label="Order progress">${STEPS.map((s, i) => `
        <li class="${i < idx ? 'is-done' : ''} ${i === idx ? 'is-now' : ''}"><span class="timeline__dot"></span><strong>${s}</strong><small>${at(s)}</small></li>`).join('')}</ol>`}
      <ul class="osum osum--page">${o.items.map((i) => `
        <li class="osum__item"><span class="osum__text"><strong>${A.esc(i.name)}</strong><small>${i.colour}, ${i.size} · Qty ${i.quantity}</small></span><span>${A.naira(i.lineTotal)}</span>
        ${delivered ? (reviewed.has(i.slug) ? '<small class="rv-done">Reviewed</small>' : `<form class="rv" data-slug="${i.slug}" data-name="${A.esc(i.name)}"><label class="sr-only" for="rt-${i.slug}">Rating</label>
          <select class="field" id="rt-${i.slug}" aria-label="Rating"><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select>
          <input class="field" placeholder="Write a short review" maxlength="200" aria-label="Review text"><button class="btn btn--ghost" type="submit">Post review</button></form>`) : ''}</li>`).join('')}</ul>
      <dl class="totals"><div><dt>Subtotal</dt><dd>${A.naira(o.subtotal)}</dd></div><div><dt>Delivery</dt><dd>${o.deliveryFee === 0 ? 'Free' : A.naira(o.deliveryFee)}</dd></div><div class="totals__sum"><dt>Total</dt><dd>${A.naira(o.total)}</dd></div></dl>
      <div class="deliver"><strong>Delivering to</strong><p>${A.esc(o.customer.fullName)}<br>${A.esc(o.customer.address)}, ${A.esc(o.customer.city)}, ${A.esc(o.customer.state)}<br>${A.esc(o.customer.phone)}</p></div>`);
    root.querySelectorAll('.rv').forEach((f) => f.addEventListener('submit', (e) => {
      e.preventDefault(); const text = f.querySelector('input').value.trim(); if (text.length < 5) return;
      const all = A.rd('aurelle_reviews', []); all.unshift({ slug: f.dataset.slug, email: me0.email, name: me0.name.split(' ')[0] + ' ' + (me0.name.split(' ')[1] || '')[0] + '.', rating: +f.querySelector('select').value, text, at: new Date().toISOString() });
      A.wr('aurelle_reviews', all); orderDetail(ref);
    }));
  }

  function route() {
    const h = decodeURIComponent(location.hash.slice(1)) || 'profile';
    if (h.startsWith('order/')) return orderDetail(h.slice(6));
    ({ profile, addresses, orders }[h] || profile)();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  route();
})();
