(() => {
  const { card, esc, products } = window.AURELLE;
  const cats = window.AURELLE_CATEGORIES || [];
  const $ = (id) => document.getElementById(id);

  const fill = (id, list) => { const el = $(id); if (el) el.innerHTML = list.map(card).join(''); };
  fill('bestSellers', products.filter((p) => p.bestseller).slice(0, 4));
  fill('newArrivals', products.filter((p) => p.isNew).slice(0, 4));

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
        <img src="${category.image}" alt="" loading="lazy">
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
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = input.value.trim();
      msg.className = 'newsletter__msg';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        input.setAttribute('aria-invalid', 'true');
        msg.textContent = 'Enter a valid email address, like name@example.com.';
        msg.classList.add('is-error'); input.focus(); return;
      }
      input.removeAttribute('aria-invalid');
      try {
        const list = JSON.parse(localStorage.getItem('aurelle_newsletter') || '[]');
        if (!list.includes(email)) localStorage.setItem('aurelle_newsletter', JSON.stringify([...list, email]));
      } catch (err) {}
      form.reset();
      msg.textContent = 'You are subscribed. Check your inbox for your 10% code.';
      msg.classList.add('is-ok');
    });
  }
  const year = $('year'); if (year) year.textContent = new Date().getFullYear();
})();
