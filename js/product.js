(() => {
  const A = window.AURELLE, $ = (id) => document.getElementById(id);
  const root = $('pdp');
  const slug = new URLSearchParams(location.search).get('slug');
  const p = A.products.find((x) => x.slug === slug);
  const year = $('year'); if (year) year.textContent = new Date().getFullYear();

  if (!p) {
    document.title = 'Product not found | AURÉLLE';
    root.innerHTML = `<div class="empty"><h1 class="page-title">We could not find that product</h1>
      <p>The link may be out of date.</p><a class="btn btn--dark" href="shop.html">Back to shop</a></div>`;
    return;
  }

  document.title = `${p.name} | AURÉLLE`;
  const DESC = {
    women: 'Cut for a relaxed, flattering line and finished with clean seams. Easy to dress up or down, and made from fabric that keeps its shape.',
    men: 'A sharp, comfortable fit in a durable fabric that holds up to weekly wear. Designed to pair with the rest of your wardrobe.',
    bags: 'Roomy enough for the day and built with sturdy hardware and reinforced stitching. Fits a laptop, a bottle and your essentials.',
    footwear: 'Cushioned insole, grippy outsole and a clean silhouette that works from the office to the weekend.',
    accessories: 'The finishing detail. Light, well made and simple enough to wear every day.'
  };
  const vs = A.variants(p);
  const { sizes, colours } = A.optionsOf(p);
  const total = vs.reduce((n, v) => n + v.stock, 0);
  const discount = p.compare ? Math.round((1 - p.price / p.compare) * 100) : 0;
  const sel = { size: sizes.length === 1 ? sizes[0] : '', colour: '' };
  const stockOf = (size, colour) => (vs.find((v) => v.size === size && v.colour === colour) || { stock: 0 }).stock;
  const sizeAvail = (s) => colours.some((c) => stockOf(s, c) > 0);
  const colourAvail = (c) => sizes.some((s) => stockOf(s, c) > 0);

  $('crumbs').innerHTML = `<a href="index.html">Home</a> / <a href="shop.html?category=${p.category}">${A.esc(A.catLabel[p.category])}</a> / <span>${A.esc(p.name)}</span>`;

  const related = A.products.filter((x) => x.category === p.category && x.slug !== p.slug).slice(0, 4);
  const wished = A.readWish().includes(p.slug);

  root.insertAdjacentHTML('beforeend', `
    <div class="pdp__grid">
      <div class="gallery">
        <div class="gallery__main" data-name="${A.esc(p.name)}">
          <img src="${p.image}" alt="${A.esc(p.name)}" width="800" height="1067" fetchpriority="high">
          ${discount ? `<span class="badge badge--sale gallery__badge">-${discount}%</span>` : ''}
        </div>
      </div>

      <div class="pdp__info">
        <h1 class="pdp__title">${A.esc(p.name)}</h1>
        <p class="price price--lg"><span>${A.naira(p.price)}</span>${p.compare ? `<s>${A.naira(p.compare)}</s>` : ''}</p>
        <p class="pdp__desc">${DESC[p.category]}</p>

        <div class="opt">
          <p class="opt__label" id="colourLabel">Colour: <strong id="colourName">Select a colour</strong></p>
          <div class="swatches swatches--lg" role="radiogroup" aria-labelledby="colourLabel" id="colourOpts">
            ${colours.map((c) => `<label class="swatch ${colourAvail(c) ? '' : 'is-off'}" title="${c}">
              <input type="radio" name="pcolour" value="${c}" ${colourAvail(c) ? '' : 'disabled'}>
              <span style="--c:${A.HEX[c]}"></span><b class="sr-only">${c}</b></label>`).join('')}
          </div>
        </div>

        <div class="opt">
          <p class="opt__label" id="sizeLabel">Size</p>
          <div class="chips" role="radiogroup" aria-labelledby="sizeLabel" id="sizeOpts">
            ${sizes.map((s) => `<label class="chip ${sizeAvail(s) ? '' : 'is-off'}">
              <input type="radio" name="psize" value="${s}" ${sizeAvail(s) ? '' : 'disabled'} ${sel.size === s ? 'checked' : ''}><span>${s}</span></label>`).join('')}
          </div>
        </div>

        <p class="stock-line" id="stockLine" aria-live="polite">${total ? 'Select a size and colour to see availability.' : 'This product is currently out of stock.'}</p>

        <div class="buy">
          <div class="qty" role="group" aria-label="Quantity">
            <button type="button" id="qMinus" aria-label="Decrease quantity">−</button>
            <input id="qty" type="number" value="1" min="1" max="1" inputmode="numeric" aria-label="Quantity">
            <button type="button" id="qPlus" aria-label="Increase quantity">+</button>
          </div>
          <button class="btn btn--brown buy__add" id="addBtn" type="button" ${total ? '' : 'disabled'}>${total ? 'Add to cart' : 'Out of stock'}</button>
          <button class="wish wish--static" type="button" data-slug="${p.slug}" aria-pressed="${wished}" aria-label="Save ${A.esc(p.name)} to wishlist">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/></svg>
          </button>
        </div>
        <p class="form-msg" id="addMsg" role="status" aria-live="polite"></p>

        <dl class="meta">
          <div><dt>SKU</dt><dd id="skuText">Select options</dd></div>
          <div><dt>Category</dt><dd>${A.esc(A.catLabel[p.category])}</dd></div>
          <div><dt>Delivery</dt><dd>2 to 5 working days within Nigeria</dd></div>
        </dl>
      </div>
    </div>

    <section class="pdp__section" aria-labelledby="revTitle">
      <h2 class="section__title section__title--sm" id="revTitle">Reviews</h2>
      <div class="reviews">
        <figure class="review"><div class="stars" role="img" aria-label="5 out of 5 stars">★★★★★</div>
          <blockquote>Looks even better in person. Good quality for the price.</blockquote>
          <figcaption><strong>Adaeze N.</strong><span>Verified buyer</span></figcaption></figure>
        <figure class="review"><div class="stars" role="img" aria-label="4 out of 5 stars">★★★★☆</div>
          <blockquote>Fits as expected and arrived quickly. I would order again.</blockquote>
          <figcaption><strong>Emeka U.</strong><span>Verified buyer</span></figcaption></figure>
      </div>
      <p class="note">The first two reviews are samples written for this portfolio demo. Reviews from verified buyers appear above them.</p>
    </section>

    ${related.length ? `<section class="pdp__section" aria-labelledby="relTitle">
      <h2 class="section__title section__title--sm" id="relTitle">You may also like</h2>
      <div class="product-grid">${related.map(A.card).join('')}</div></section>` : ''}
  `);
  $('pdpLoading')?.remove();

  window.DB.loadReviews(p.slug).then((rv) => {
    if (!rv.length) return;
    root.querySelector('.pdp__section .reviews').insertAdjacentHTML('afterbegin', rv.map((r) => `<figure class="review"><div class="stars" role="img" aria-label="${r.rating} out of 5 stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div><blockquote>${A.esc(r.text)}</blockquote><figcaption><strong>${A.esc(r.name)}</strong><span>Verified buyer</span></figcaption></figure>`).join(''));
  });

  /* ----- Selection logic ----- */
  const qty = $('qty'), addBtn = $('addBtn'), msg = $('addMsg');
  const say = (text, kind) => { msg.textContent = text; msg.className = 'form-msg' + (kind ? ' is-' + kind : ''); };

  function remaining() {
    if (!sel.size || !sel.colour) return null;
    return Math.max(0, stockOf(sel.size, sel.colour) - A.inCart(p.slug, sel.size, sel.colour));
  }
  function refresh() {
    const v = vs.find((x) => x.size === sel.size && x.colour === sel.colour);
    $('colourName').textContent = sel.colour || 'Select a colour';
    $('skuText').textContent = v ? v.sku : 'Select options';
    // grey out sizes unavailable in the chosen colour
    document.querySelectorAll('input[name="psize"]').forEach((i) => {
      const off = sel.colour ? stockOf(i.value, sel.colour) === 0 : !sizeAvail(i.value);
      i.disabled = off; i.closest('.chip').classList.toggle('is-off', off);
      if (off && i.checked) { i.checked = false; sel.size = ''; }
    });
    const left = remaining();
    const line = $('stockLine');
    if (left === null) { line.textContent = total ? 'Select a size and colour to see availability.' : 'This product is currently out of stock.'; line.className = 'stock-line'; qty.max = 1; }
    else if (left === 0) { line.textContent = stockOf(sel.size, sel.colour) === 0 ? 'This size and colour is sold out.' : 'You already have all available units in your cart.'; line.className = 'stock-line is-low'; qty.max = 1; }
    else { line.textContent = left <= 5 ? `Only ${left} left in this size and colour.` : 'In stock.'; line.className = 'stock-line' + (left <= 5 ? ' is-low' : ''); qty.max = left; }
    if (+qty.value > (+qty.max || 1)) qty.value = qty.max || 1;
  }
  const clamp = () => { const max = +qty.max || 1; qty.value = Math.min(Math.max(1, parseInt(qty.value, 10) || 1), max); };

  $('colourOpts').addEventListener('change', (e) => { sel.colour = e.target.value; say(''); refresh(); });
  $('sizeOpts').addEventListener('change', (e) => { sel.size = e.target.value; say(''); refresh(); });
  $('qMinus').addEventListener('click', () => { qty.value = Math.max(1, (+qty.value || 1) - 1); });
  $('qPlus').addEventListener('click', () => { qty.value = Math.min(+qty.max || 1, (+qty.value || 1) + 1); });
  qty.addEventListener('change', clamp);

  addBtn.addEventListener('click', () => {
    if (!sel.colour) return say('Choose a colour first.', 'error');
    if (!sel.size) return say('Choose a size first.', 'error');
    clamp();
    const left = remaining(), n = +qty.value;
    if (left === 0) return say('No more units of this size and colour are available.', 'error');
    if (n > left) return say(`Only ${left} available. Lower the quantity.`, 'error');
    if (!A.addToCart(p.slug, sel.size, sel.colour, n)) return say('Could not save your cart. Check that your browser allows site storage.', 'error');
    say(`Added ${n} × ${p.name} (${sel.colour}, ${sel.size}) to your cart.`, 'ok');
    msg.insertAdjacentHTML('beforeend', ' <a class="text-link" href="cart.html">View cart</a>');
    qty.value = 1; refresh();
  });

  refresh();
})();
