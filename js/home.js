(() => {
  const { card, esc, products, srcset } = window.AURELLE;
  const cats = window.AURELLE_CATEGORIES || [];
  const $ = (id) => document.getElementById(id);

  const fill = (id, list) => { const el = $(id); if (el) el.innerHTML = list.map(card).join(''); };
  fill('bestSellers', products.filter((p) => p.bestseller).slice(0, 4));
  const featuredArrivals = products.filter((p) => p.featured);
  const otherArrivals = products.filter((p) => p.isNew && !p.featured);
  fill('newArrivals', [...featuredArrivals, ...otherArrivals].slice(0, 4));

  const showcase = $('newCategoryProducts');
  if (showcase) {
    const liveSlugs = new Set(products.map((p) => p.slug));
    const categoryProducts = (window.AURELLE_LOCAL_PRODUCTS || []).filter((p) => p.homepage);
    showcase.innerHTML = categoryProducts.map((p) => {
      const live = liveSlugs.has(p.slug);
      const href = live ? `product.html?slug=${encodeURIComponent(p.slug)}` : `shop.html?category=${encodeURIComponent(p.category)}`;
      const action = live ? 'View product' : 'Shop category';
      return `
        <article class="card">
          <a class="card__media" href="${href}" aria-label="${esc(p.name)}">
            <img src="${p.image}" srcset="${srcset(p.image)}" sizes="(min-width: 900px) 25vw, 50vw" alt="${esc(p.name)}" loading="lazy" decoding="async" width="800" height="1067">
            <span class="badges"><span class="badge">New</span></span>
          </a>
          <div class="card__body">
            <span class="card__cat">${esc(window.AURELLE.catLabel[p.category] || p.category)}</span>
            <h3 class="card__name"><a href="${href}">${esc(p.name)}</a></h3>
            <p class="price" style="margin:0"><span>${window.AURELLE.naira(p.price)}</span></p>
            <a class="card__cta" href="${href}">${action}</a>
          </div>
        </article>`;
    }).join('');
    showcase.setAttribute('aria-busy', 'false');
  }

  const col = $('collections');
  const featuredCollections = [
    { key: 'women', label: "Women's Collection", description: 'Considered essentials, made to be lived in.' },
    { key: 'men', label: "Men's Collection", description: 'Modern tailoring and everyday refinement.' },
    { key: 'bags', label: 'Bags & Accessories', description: 'The finishing touches, thoughtfully chosen.', href: 'shop.html' },
    { key: 'footwear', label: 'Footwear', description: 'Grounded in comfort. Made to go further.' }
  ];
  if (col) col.innerHTML = featuredCollections.map((c) => {
    const category = cats.find((item) => item.key === c.key);
    if (!category) return '';
    return `
      <a class="collection" href="${c.href || `shop.html?category=${c.key}`}">
        <img src="${category.image}" srcset="${srcset(category.image, [400, 640, 800, 1100])}" sizes="(min-width: 900px) 25vw, 50vw" alt="" loading="lazy" decoding="async">
        <span class="collection__label">
          <strong>${esc(c.label)}</strong>
          <span>${esc(c.description)}</span>
          <span class="collection__link">Explore collection <span aria-hidden="true">→</span></span>
        </span>
      </a>`;
  }).join('');

  const form = $('newsletterForm');
  if (form) {
    const input = $('nlEmail'), msg = $('nlMsg');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = input.value.trim();
      msg.className = 'newsletter__msg';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        input.setAttribute('aria-invalid', 'true');
        msg.textContent = 'Enter a valid email address, like name@example.com.';
        msg.classList.add('is-error'); input.focus(); return;
      }
      input.removeAttribute('aria-invalid');
      const r = await window.DB.subscribe(email);
      if (!r.ok) { msg.textContent = 'Sign-up is not available right now. Please try again later.'; msg.classList.add('is-error'); return; }
      form.reset();
      msg.textContent = 'You are subscribed. Check your inbox for your 10% code.';
      msg.classList.add('is-ok');
    });
  }
  const year = $('year'); if (year) year.textContent = new Date().getFullYear();
})();
