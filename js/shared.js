/* Shared helpers used by the homepage, shop and product pages */
(() => {
  const cats = window.AURELLE_CATEGORIES || [];
  const catLabel = Object.fromEntries(cats.map((c) => [c.key, c.label]));

  const naira = (kobo) => '₦' + (kobo / 100).toLocaleString('en-NG');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ----- Sizes and colours (demo rules by category) ----- */
  const SIZES = { women: ['S', 'M', 'L', 'XL'], men: ['S', 'M', 'L', 'XL'], footwear: ['39', '40', '41', '42', '43', '44'], bags: ['One size'], accessories: ['One size'] };
  const COLOURS = { women: ['Black', 'Cream'], men: ['Black', 'Navy'], bags: ['Black', 'Tan'], footwear: ['White', 'Black'], accessories: ['Black', 'Tan'] };
  const COLOUR_OVERRIDE = { 'steel-link-watch': ['Silver', 'Gold'], 'acetate-sunglasses': ['Black', 'Tortoise'] };
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
    return `
      <article class="card">
        <a class="card__media" href="${url}" data-name="${esc(p.name)}" aria-label="${esc(p.name)}">
          <img src="${p.image}" alt="${esc(p.name)}" loading="lazy" width="800" height="1067">
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
          <span class="stock ${low ? 'stock--low' : ''}">${out ? 'Out of stock' : low ? `Only ${st} left` : 'In stock'}</span>
        </div>
        <a class="card__cta" href="${url}">${out ? 'View product' : 'Choose size and colour'}</a>
      </article>`;
  }

  /* Broken image links show the product name instead */
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (img.tagName !== 'IMG') return;
    const frame = img.closest('.card__media, .collection, .gallery__main');
    if (frame) { frame.classList.add('img-fail'); frame.dataset.name = frame.dataset.name || img.alt; img.remove(); }
  }, true);

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

  window.AURELLE = { rd, wr, catLabel, naira, esc, variants, totalStock, optionsOf, HEX, readWish, readCart, writeCart, inCart, addToCart, card, products: window.AURELLE_PRODUCTS || [] };
})();
