(() => {
  const { esc, srcset } = window.AURELLE;
  const cats = window.AURELLE_CATEGORIES || [];
  const $ = (id) => document.getElementById(id);

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
