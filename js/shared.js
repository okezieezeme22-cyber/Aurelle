/* Shared helpers used by the homepage, shop and product pages */
(() => {
  const cats = window.AURELLE_CATEGORIES || [];
  const catLabel = Object.fromEntries(cats.map((c) => [c.key, c.label]));

  const naira = (kobo) => '₦' + (kobo / 100).toLocaleString('en-NG');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ----- Sizes and colours (demo rules by category) ----- */
  const SIZES = { women: ['S', 'M', 'L', 'XL'], men: ['S', 'M', 'L', 'XL'], footwear: ['39', '40', '41', '42', '43', '44'], bags: ['One size'], accessories: ['One size'] };
  const COLOURS = { women: ['Black', 'Cream'], men: ['Black', 'Navy'], bags: ['Black', 'Tan'], footwear: ['White', 'Black'], accessories: ['Black', 'Tan'] };
  const COLOUR_OVERRIDE = { 'steel-link-watch': ['Silver', 'Gold'], 'acetate-sunglasses': ['Black', 'Tortoise'], 'black-frame-sunglasses': ['Black', 'Tortoise'], 'gold-tone-watch': ['Gold', 'Silver'] };
  const HEX = { Black: '#171717', Cream: '#EFE6D6', Navy: '#1F2A44', White: '#FFFFFF', Tan: '#B98B5E', Silver: '#C4C7CA', Gold: '#C9A24B', Tortoise: '#7A4B2A' };

  /* Variants with a SKU and a stock count each. The product's total stock is
     split across variants. Real stock tracking arrives with a backend. */
  function variants(p) {
    if (p.dbVariants) return p.dbVariants.map((v) => ({ ...v }));          // real variants and stock from the database
    // Fallback used only when the database is not connected
    const sizes = SIZES[p.category], colours = COLOUR_OVERRIDE[p.slug] || COLOURS[p.category];
    const code = p.slug.split('-').map((w) => w[0]).join('').toUpperCase();
    const list = [];
    let i = 0;
    colours.forEach((colour) => sizes.forEach((size) => {
      const sku = `AUR-${p.category.slice(0, 3).toUpperCase()}-${code}-${colour.slice(0, 3).toUpperCase()}-${size.replace(' ', '')}`;
      list.push({ size, colour, sku, stock: p.stock === 0 ? 0 : Math.max(1, p.stock + ((i * 7) % 5) - 2) });
      i++;
    }));
    return list;
  }
  /* Smaller images for smaller screens (Unsplash resizes on request) */
  const srcset = (url, widths = [320, 480, 640, 800]) =>
    /images\.unsplash\.com/.test(url) ? widths.map((w) => `${url.replace(/([?&])w=\d+/, `$1w=${w}`)} ${w}w`).join(', ') : '';
  const totalStock = (p) => variants(p).reduce((n, v) => n + v.stock, 0);
  const optionsOf = (p) => {
    if (p.dbVariants) return { sizes: [...new Set(p.dbVariants.map((v) => v.size))], colours: [...new Set(p.dbVariants.map((v) => v.colour))] };
    return { sizes: SIZES[p.category], colours: COLOUR_OVERRIDE[p.slug] || COLOURS[p.category] };
  };

  /* ----- Wishlist ----- */
  const readWish = () => { try { return JSON.parse(localStorage.getItem('aurelle_wishlist') || '[]'); } catch (e) { return []; } };
  const writeWish = (l) => { try { localStorage.setItem('aurelle_wishlist', JSON.stringify(l)); } catch (e) {} };

  /* ----- Cart (same key the navbar badge reads) ----- */
  const readCart = () => { try { return JSON.parse(localStorage.getItem('aurelle_cart') || '[]'); } catch (e) { return []; } };
  function writeCart(items) {
    try { localStorage.setItem('aurelle_cart', JSON.stringify(items)); } catch (e) { return false; }
    window.dispatchEvent(new Event('aurelle:cart-changed'));
    return true;
  }
  const inCart = (slug, size, colour) =>
    readCart().filter((i) => i.slug === slug && i.size === size && i.colour === colour).reduce((n, i) => n + i.quantity, 0);
  function addToCart(slug, size, colour, quantity) {
    const items = readCart();
    const hit = items.find((i) => i.slug === slug && i.size === size && i.colour === colour);
    if (hit) hit.quantity += quantity; else items.push({ slug, size, colour, quantity });
    return writeCart(items);
  }

  function card(p) {
    const discount = p.compare ? Math.round((1 - p.price / p.compare) * 100) : 0;
    const st = totalStock(p), out = st === 0, low = st > 0 && st <= 5;
    const wished = readWish().includes(p.slug);
    const url = `product.html?slug=${encodeURIComponent(p.slug)}`;
    const { sizes, colours } = optionsOf(p), vs = variants(p), oneSize = sizes.length === 1;
    const inStock = (c) => vs.some((v) => v.colour === c && v.stock > 0);
    const first = colours.find(inStock) || colours[0];
    const swatches = out
      ? `<ul class="sw-list" aria-label="Available colours">${colours.map((c) => `<li class="sw-dot" style="--c:${HEX[c] || '#ccc'}" title="${esc(c)}"></li>`).join('')}</ul>`
      : `<div class="sw-list" role="group" aria-label="Colour">${colours.map((c) => `<button class="sw-dot" type="button" data-colour="${esc(c)}" style="--c:${HEX[c] || '#ccc'}" aria-label="${esc(c)}" aria-pressed="${c === first}" ${inStock(c) ? '' : 'disabled'}></button>`).join('')}</div>`;
    const cta = out ? `<a class="card__cta" href="${url}">View product</a>`
      : `<button class="card__cta card__add" type="button" data-slug="${p.slug}" data-size="${oneSize ? esc(sizes[0]) : ''}">Add to cart</button><div class="card__sizes" hidden></div>`;
    return `
      <article class="card">
        <a class="card__media" href="${url}" data-name="${esc(p.name)}" aria-label="${esc(p.name)}">
          <img src="${p.image}" srcset="${srcset(p.image)}" sizes="(min-width: 900px) 25vw, 50vw" alt="${esc(p.name)}" loading="lazy" decoding="async" width="800" height="1067">
          <span class="badges">
            ${discount ? `<span class="badge badge--sale">-${discount}%</span>` : ''}
            ${p.isNew && !discount ? '<span class="badge">New</span>' : ''}
            ${out ? '<span class="badge badge--out">Sold out</span>' : ''}
          </span>
        </a>
        <button class="wish" type="button" data-slug="${p.slug}" aria-pressed="${wished}" aria-label="Save ${esc(p.name)} to wishlist">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/></svg>
        </button>
        <div class="card__body">
          <span class="card__cat">${esc(catLabel[p.category] || p.category)}</span>
          <h3 class="card__name"><a href="${url}">${esc(p.name)}</a></h3>
          <p class="price" style="margin:0"><span>${naira(p.price)}</span>${p.compare ? `<s>${naira(p.compare)}</s>` : ''}</p>
          ${swatches}
          <span class="stock ${low ? 'stock--low' : ''}">${out ? 'Out of stock' : low ? `Only ${st} left` : 'In stock'}</span>
        </div>
        ${cta}
      </article>`;
  }

  /* Broken image links show the product name instead */
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (img.tagName !== 'IMG') return;
    const frame = img.closest('.card__media, .collection, .gallery__main');
    if (frame) { frame.classList.add('img-fail'); frame.dataset.name = frame.dataset.name || img.alt; img.remove(); }
  }, true);

  /* Card colour swatches and Add to cart (one-size items add straight away; others ask for a size first) */
  const cardState = (el) => {
    const card = el.closest('.card');
    const add = card.querySelector('.card__add');
    const p = (window.AURELLE_ALL || []).find((x) => x.slug === add.dataset.slug);
    const sel = card.querySelector('button.sw-dot[aria-pressed="true"]');
    return { card, add, p, colour: sel && sel.dataset.colour, box: card.querySelector('.card__sizes') };
  };
  const flash = (add, text) => {
    const label = add.dataset.label || (add.dataset.label = add.textContent);
    add.textContent = text; add.classList.add('is-done');
    clearTimeout(add._t); add._t = setTimeout(() => { add.textContent = label; add.classList.remove('is-done'); }, 2200);
  };
  function showSizes(st) {
    const { p, colour, box, add } = st;
    const opts = optionsOf(p).sizes;
    box.innerHTML = `<span class="sr-only">Choose a size</span>` + opts.map((s) => {
      const v = variants(p).find((x) => x.size === s && x.colour === colour);
      const left = v ? v.stock - inCart(p.slug, s, colour) : 0;
      return `<button class="size-btn" type="button" data-size="${esc(s)}" ${left > 0 ? '' : 'disabled'}>${esc(s)}</button>`;
    }).join('');
    box.hidden = false; add.setAttribute('aria-expanded', 'true');
  }
  document.addEventListener('click', (e) => {
    const dot = e.target.closest('button.sw-dot');
    if (dot && !dot.disabled) {
      dot.closest('.sw-list').querySelectorAll('button.sw-dot').forEach((b) => b.setAttribute('aria-pressed', String(b === dot)));
      const st = cardState(dot); if (st.box && !st.box.hidden) showSizes(st);
      return;
    }
    const size = e.target.closest('.size-btn');
    if (size && !size.disabled) {
      const st = cardState(size);
      if (st.p && st.colour && addToCart(st.p.slug, size.dataset.size, st.colour, 1)) { st.box.hidden = true; st.add.setAttribute('aria-expanded', 'false'); flash(st.add, 'Added to your cart'); }
      return;
    }
    const add = e.target.closest('.card__add');
    if (!add) return;
    const st = cardState(add);
    if (!st.p || !st.colour) return flash(add, 'Choose a colour');
    if (!add.dataset.size) {                              // several sizes: show them, then add on tap
      if (st.box.hidden) showSizes(st); else { st.box.hidden = true; add.setAttribute('aria-expanded', 'false'); }
      return;
    }
    const v = variants(st.p).find((x) => x.size === add.dataset.size && x.colour === st.colour);
    if (!v || v.stock - inCart(st.p.slug, add.dataset.size, st.colour) <= 0) return flash(add, 'No more available');
    addToCart(st.p.slug, add.dataset.size, st.colour, 1);
    flash(add, 'Added to your cart');
  });

  /* Wishlist toggle (works on any heart button) */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.wish');
    if (!btn) return;
    let list = readWish();
    const on = !list.includes(btn.dataset.slug);
    list = on ? [...list, btn.dataset.slug] : list.filter((s) => s !== btn.dataset.slug);
    writeWish(list);
    document.querySelectorAll(`.wish[data-slug="${btn.dataset.slug}"]`).forEach((b) => b.setAttribute('aria-pressed', String(on)));
  });

  const rd = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };

  window.AURELLE = { srcset, rd, wr, catLabel, naira, esc, variants, totalStock, optionsOf, HEX, readWish, readCart, writeCart, inCart, addToCart, card, products: window.AURELLE_PRODUCTS || [] };
})();
