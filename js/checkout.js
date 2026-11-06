(() => {
  const A = window.AURELLE, S = window.AURELLE_SHOP, $ = (id) => document.getElementById(id);
  const bySlug = Object.fromEntries(A.products.map((p) => [p.slug, p]));
  const stockOf = (p, size, colour) => (A.variants(p).find((v) => v.size === size && v.colour === colour) || { stock: 0 }).stock;
  const year = $('year'); if (year) year.textContent = new Date().getFullYear();
  const root = $('checkoutRoot');

  const cart = A.readCart().filter((i) => bySlug[i.slug]);
  if (!cart.length) {
    root.innerHTML = `<div class="empty"><h2>Your cart is empty</h2><p>Add products before checking out.</p><a class="btn btn--dark" href="shop.html">Go to shop</a></div>`;
    return;
  }

  const store = (k, v) => { try { v === undefined ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };
  const load = (k) => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } };
  const saved = (() => { try { return JSON.parse(load('aurelle_checkout')) || {}; } catch (e) { return {}; } })();
  const me = window.AUTH && AUTH.current();
  if (me) {
    const d = (me.addresses || []).find((a) => a.isDefault) || {};
    Object.assign(saved, { fullName: saved.fullName || me.name, email: me.email, phone: saved.phone || d.phone || me.phone, address: saved.address || d.address, city: saved.city || d.city, state: saved.state || d.state });
  }
  const state0 = load('aurelle_state') || saved.state || '';

  const summaryItems = cart.map((i) => {
    const p = bySlug[i.slug];
    return `<li class="osum__item">
      <span class="osum__img" data-name="${A.esc(p.name)}"><img src="${p.image}" alt="" width="64" height="85" loading="lazy"><b>${i.quantity}</b></span>
      <span class="osum__text"><strong>${A.esc(p.name)}</strong><small>${i.colour}, ${i.size}</small></span>
      <span>${A.naira(p.price * i.quantity)}</span></li>`;
  }).join('');

  const field = (id, label, extra = '') => `
    <div class="fgroup"><label for="${id}">${label}</label>
    <input class="field" id="${id}" name="${id}" ${extra} aria-describedby="${id}Err"><p class="ferr" id="${id}Err"></p></div>`;

  root.innerHTML = `
    <form class="checkout" id="coForm" novalidate>
      <div class="checkout__fields">
        <h2 class="block-title">Contact</h2>
        <div class="fgrid">
          ${field('fullName', 'Full name', 'autocomplete="name"')}
          ${field('email', 'Email address', 'type="email" autocomplete="email"')}
          ${field('phone', 'Phone number', 'type="tel" autocomplete="tel" placeholder="08012345678"')}
        </div>
        <h2 class="block-title">Delivery</h2>
        <div class="fgrid">
          <div class="fgroup fgroup--wide"><label for="address">Delivery address</label>
            <input class="field" id="address" name="address" autocomplete="street-address" aria-describedby="addressErr"><p class="ferr" id="addressErr"></p></div>
          <div class="fgroup"><label for="state">State</label>
            <select class="field" id="state" name="state" aria-describedby="stateErr"><option value="">Select a state</option>${S.STATES.map((s) => `<option>${s}</option>`).join('')}</select><p class="ferr" id="stateErr"></p></div>
          ${field('city', 'City or town', 'autocomplete="address-level2"')}
          <div class="fgroup fgroup--wide"><label for="notes">Delivery instructions <span class="opt-text">(optional)</span></label>
            <textarea class="field field--area" id="notes" name="notes" rows="3" maxlength="300" placeholder="Landmark, gate code, preferred time"></textarea></div>
        </div>
        <div class="paynote"><strong>Payment</strong>
          <p>Paystack test payments are connected in a later step. For now, placing your order creates a demo order that stays marked <em>Pending payment</em>. No money is charged.</p></div>
      </div>

      <aside class="summary" aria-label="Order summary">
        <h2 class="summary__title">Review your order</h2>
        <ul class="osum">${summaryItems}</ul>
        <dl class="totals" id="coTotals"></dl>
        <p class="form-msg" id="formMsg" role="alert"></p>
        <button class="btn btn--brown btn--full" type="submit" id="placeBtn">Place order</button>
        <a class="text-link summary__back" href="cart.html">Edit cart</a>
      </aside>
    </form>`;

  const f = $('coForm');
  ['fullName', 'email', 'phone', 'address', 'city', 'notes'].forEach((k) => { if (saved[k]) $(k).value = saved[k]; });
  $('state').value = state0;

  const subtotal = () => cart.reduce((n, i) => n + bySlug[i.slug].price * i.quantity, 0);
  function totals() {
    const st = $('state').value, sub = subtotal(), fee = S.deliveryFee(st, sub);
    $('coTotals').innerHTML = `
      <div><dt>Subtotal</dt><dd>${A.naira(sub)}</dd></div>
      <div><dt>Delivery</dt><dd>${fee === null ? 'Choose a state' : fee === 0 ? 'Free' : A.naira(fee)}</dd></div>
      <div class="totals__sum"><dt>Total</dt><dd>${fee === null ? A.naira(sub) + '<small> + delivery</small>' : A.naira(sub + fee)}</dd></div>`;
    return fee;
  }
  totals();
  $('state').addEventListener('change', () => { store('aurelle_state', $('state').value); totals(); });

  /* ----- Validation ----- */
  const rules = {
    fullName: (v) => (v.trim().split(/\s+/).filter(Boolean).length >= 2 ? '' : 'Enter your first and last name.'),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Enter a valid email, like name@example.com.'),
    phone: (v) => (/^(\+234|234|0)[789][01]\d{8}$/.test(v.replace(/[\s-]/g, '')) ? '' : 'Enter a valid Nigerian number, like 08012345678.'),
    address: (v) => (v.trim().length >= 8 ? '' : 'Enter your full delivery address.'),
    state: (v) => (v ? '' : 'Select your state.'),
    city: (v) => (v.trim().length >= 2 ? '' : 'Enter your city or town.')
  };
  function check(id) {
    const msg = rules[id]($(id).value);
    $(id + 'Err').textContent = msg;
    $(id).toggleAttribute('aria-invalid', !!msg);
    if (!msg) $(id).removeAttribute('aria-invalid');
    return !msg;
  }
  Object.keys(rules).forEach((id) => $(id).addEventListener('blur', () => check(id)));

  /* ----- Place demo order ----- */
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = $('formMsg'); msg.textContent = ''; msg.className = 'form-msg';
    const bad = Object.keys(rules).filter((id) => !check(id));
    if (bad.length) { $(bad[0]).focus(); msg.textContent = 'Please fix the highlighted fields.'; msg.classList.add('is-error'); return; }

    // Re-check prices and stock from the catalogue, never from what the cart stored
    const items = [];
    for (const i of cart) {
      const p = bySlug[i.slug], v = A.variants(p).find((x) => x.size === i.size && x.colour === i.colour);
      if (!v || v.stock < i.quantity) {
        msg.textContent = `${p.name} (${i.colour}, ${i.size}) is no longer available in that quantity. Please update your cart.`;
        msg.classList.add('is-error'); return;
      }
      items.push({ slug: p.slug, name: p.name, image: p.image, sku: v.sku, size: i.size, colour: i.colour, unitPrice: p.price, quantity: i.quantity, lineTotal: p.price * i.quantity });
    }
    const sub = items.reduce((n, i) => n + i.lineTotal, 0), fee = S.deliveryFee($('state').value, sub);
    const d = new Date(), pad = (n) => String(n).padStart(2, '0');
    const ref = `AUR-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const customer = { fullName: $('fullName').value.trim(), email: $('email').value.trim(), phone: $('phone').value.trim(), address: $('address').value.trim(), state: $('state').value, city: $('city').value.trim(), notes: $('notes').value.trim() };
    const order = { ref, items, subtotal: sub, deliveryFee: fee, total: sub + fee, customer, orderStatus: 'Pending', paymentStatus: 'Unpaid', createdAt: d.toISOString(), userEmail: me ? me.email : null, stockDeducted: true, history: [{ status: 'Pending', at: d.toISOString(), note: 'Order placed' }] };

    try {
      const orders = JSON.parse(load('aurelle_orders') || '[]');
      store('aurelle_orders', JSON.stringify([order, ...orders]));
      store('aurelle_checkout', JSON.stringify(customer));
    } catch (err) { msg.textContent = 'Could not save your order. Check that your browser allows site storage.'; msg.classList.add('is-error'); return; }
    items.forEach((i) => A.adjustStock(i.slug, i.sku, -i.quantity));
    A.writeCart([]);
    location.href = `order-success.html?ref=${encodeURIComponent(ref)}`;
  });
})();
