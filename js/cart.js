(() => {
  const A = window.AURELLE, S = window.AURELLE_SHOP, $ = (id) => document.getElementById(id);
  const root = $('cartRoot');
  const bySlug = Object.fromEntries(A.products.map((p) => [p.slug, p]));
  const stockOf = (p, size, colour) => (A.variants(p).find((v) => v.size === size && v.colour === colour) || { stock: 0 }).stock;
  const year = $('year'); if (year) year.textContent = new Date().getFullYear();
  let notice = '';

  /* Rebuild the cart from the catalogue: drop unknown items, clamp to stock, merge duplicates */
  function cleaned() {
    const out = [];
    A.readCart().forEach((i) => {
      const p = bySlug[i.slug];
      if (!p) return;
      const stock = stockOf(p, i.size, i.colour);
      const qty = Math.min(Math.max(1, +i.quantity || 1), stock);
      if (stock === 0) { notice = `${p.name} (${i.colour}, ${i.size}) is no longer available and was removed.`; return; }
      if (qty < i.quantity) notice = `We lowered the quantity of ${p.name} to the ${stock} available.`;
      const hit = out.find((o) => o.slug === i.slug && o.size === i.size && o.colour === i.colour);
      if (hit) hit.quantity = Math.min(hit.quantity + qty, stock); else out.push({ slug: i.slug, size: i.size, colour: i.colour, quantity: qty });
    });
    return out;
  }
  const save = (items) => A.writeCart(items);
  const getState = () => { try { return localStorage.getItem('aurelle_state') || ''; } catch (e) { return ''; } };

  function render() {
    const items = cleaned();
    if (JSON.stringify(items) !== JSON.stringify(A.readCart())) save(items);

    if (!items.length) {
      root.innerHTML = `${notice ? `<p class="form-msg is-error">${A.esc(notice)}</p>` : ''}
        <div class="empty"><h2>Your cart is empty</h2><p>Add something you love and it will show up here.</p>
        <a class="btn btn--dark" href="shop.html">Continue shopping</a></div>`;
      return;
    }

    const lines = items.map((i) => {
      const p = bySlug[i.slug], o = A.optionsOf(p), max = stockOf(p, i.size, i.colour);
      const key = `${i.slug}|${i.size}|${i.colour}`;
      return `
      <li class="line" data-key="${A.esc(key)}">
        <a class="line__img" href="product.html?slug=${p.slug}" data-name="${A.esc(p.name)}"><img src="${p.image}" alt="${A.esc(p.name)}" width="120" height="160" loading="lazy"></a>
        <div class="line__main">
          <h2 class="line__name"><a href="product.html?slug=${p.slug}">${A.esc(p.name)}</a></h2>
          <p class="line__price">${A.naira(p.price)}</p>
          <div class="line__opts">
            <label>Colour
              <select class="field" data-act="colour" aria-label="Colour for ${A.esc(p.name)}">
                ${o.colours.map((c) => `<option value="${c}" ${c === i.colour ? 'selected' : ''} ${stockOf(p, i.size, c) === 0 && c !== i.colour ? 'disabled' : ''}>${c}</option>`).join('')}
              </select></label>
            <label>Size
              <select class="field" data-act="size" aria-label="Size for ${A.esc(p.name)}">
                ${o.sizes.map((s) => `<option value="${s}" ${s === i.size ? 'selected' : ''} ${stockOf(p, s, i.colour) === 0 && s !== i.size ? 'disabled' : ''}>${s}</option>`).join('')}
              </select></label>
          </div>
          <div class="line__row">
            <div class="qty" role="group" aria-label="Quantity for ${A.esc(p.name)}">
              <button type="button" data-act="minus" aria-label="Decrease quantity" ${i.quantity <= 1 ? 'disabled' : ''}>−</button>
              <input type="number" value="${i.quantity}" min="1" max="${max}" inputmode="numeric" data-act="qty" aria-label="Quantity">
              <button type="button" data-act="plus" aria-label="Increase quantity" ${i.quantity >= max ? 'disabled' : ''}>+</button>
            </div>
            <button class="text-link line__remove" type="button" data-act="remove">Remove</button>
          </div>
          ${max <= 5 ? `<p class="stock stock--low">Only ${max} available in this size and colour</p>` : ''}
        </div>
        <p class="line__total">${A.naira(p.price * i.quantity)}</p>
      </li>`;
    }).join('');

    root.innerHTML = `
      ${notice ? `<p class="form-msg is-error" role="alert">${A.esc(notice)}</p>` : ''}
      <div class="cart-layout">
        <ul class="lines" aria-label="Items in your cart">${lines}</ul>
        <aside class="summary" aria-label="Order summary">
          <h2 class="summary__title">Order summary</h2>
          <label class="summary__state">Delivery state
            <select class="field" id="stateSel"><option value="">Select your state</option>
              ${S.STATES.map((s) => `<option ${s === getState() ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
          <dl class="totals" id="totals"></dl>
          <a class="btn btn--brown btn--full" href="checkout.html">Proceed to checkout</a>
          <a class="text-link summary__back" href="shop.html">Continue shopping</a>
        </aside>
      </div>`;
    notice = '';
    totals();
  }

  function totals() {
    const items = A.readCart();
    const subtotal = items.reduce((n, i) => n + bySlug[i.slug].price * i.quantity, 0);
    const state = $('stateSel') ? $('stateSel').value : '';
    const fee = S.deliveryFee(state, subtotal);
    const hint = state === 'Enugu' && fee > 0 ? `<div class="totals__hint">Spend ${A.naira(S.FREE_ABOVE - subtotal)} more for free delivery in Enugu State.</div>` : '';
    $('totals').innerHTML = `
      <div><dt>Subtotal</dt><dd>${A.naira(subtotal)}</dd></div>
      <div><dt>Delivery</dt><dd>${fee === null ? 'Choose a state' : fee === 0 ? 'Free' : A.naira(fee)}</dd></div>
      ${hint}
      <div class="totals__sum"><dt>Total</dt><dd>${fee === null ? A.naira(subtotal) + '<small> + delivery</small>' : A.naira(subtotal + fee)}</dd></div>`;
  }

  /* ----- Events (one listener for all lines) ----- */
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b || b.tagName === 'SELECT' || b.tagName === 'INPUT') return;
    const li = b.closest('.line'); if (!li) return;
    const [slug, size, colour] = li.dataset.key.split('|');
    const items = A.readCart();
    const it = items.find((x) => x.slug === slug && x.size === size && x.colour === colour);
    if (!it) return;
    const max = stockOf(bySlug[slug], size, colour);
    if (b.dataset.act === 'plus') it.quantity = Math.min(it.quantity + 1, max);
    if (b.dataset.act === 'minus') it.quantity = Math.max(1, it.quantity - 1);
    if (b.dataset.act === 'remove') items.splice(items.indexOf(it), 1);
    save(items); render();
  });

  root.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'stateSel') { try { localStorage.setItem('aurelle_state', t.value); } catch (err) {} return totals(); }
    const li = t.closest('.line'); if (!li) return;
    const [slug, size, colour] = li.dataset.key.split('|');
    const items = A.readCart();
    const it = items.find((x) => x.slug === slug && x.size === size && x.colour === colour);
    if (!it) return;
    const p = bySlug[slug];
    if (t.dataset.act === 'qty') it.quantity = Math.min(Math.max(1, parseInt(t.value, 10) || 1), stockOf(p, size, colour));
    if (t.dataset.act === 'size' || t.dataset.act === 'colour') {
      const ns = t.dataset.act === 'size' ? t.value : size, nc = t.dataset.act === 'colour' ? t.value : colour;
      const stock = stockOf(p, ns, nc);
      if (stock === 0) { notice = 'That combination is sold out.'; return render(); }
      it.size = ns; it.colour = nc; it.quantity = Math.min(it.quantity, stock);
    }
    save(items); render();
  });

  render();
})();
