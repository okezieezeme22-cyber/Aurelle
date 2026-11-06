(() => {
  const A = window.AURELLE, $ = (id) => document.getElementById(id);
  const PAGE = 8;
  const cats = window.AURELLE_CATEGORIES;
  const PRICES = [
    { id: 'any', label: 'Any price', min: 0, max: Infinity },
    { id: 'u20', label: 'Under ₦20,000', min: 0, max: 2000000 },
    { id: '20-35', label: '₦20,000 to ₦35,000', min: 2000000, max: 3500000 },
    { id: '35-50', label: '₦35,000 to ₦50,000', min: 3500000, max: 5000000 },
    { id: 'o50', label: 'Over ₦50,000', min: 5000000, max: Infinity }
  ];
  const allSizes = [...new Set(Object.values(A.products).flatMap((p) => A.optionsOf(p).sizes))];
  const allColours = [...new Set(Object.values(A.products).flatMap((p) => A.optionsOf(p).colours))];

  const params = new URLSearchParams(location.search);
  const state = {
    q: params.get('q') || '',
    category: params.get('category') || '',
    price: params.get('price') || 'any',
    sizes: params.getAll('size'),
    colours: params.getAll('colour'),
    sale: params.get('sale') === '1',
    sort: params.get('sort') || 'newest',
    shown: PAGE
  };

  /* ----- Build the filter controls ----- */
  $('fCategory').innerHTML = [{ key: '', label: 'All products' }, ...cats].map((c) =>
    `<label class="check"><input type="radio" name="cat" value="${c.key}"><span>${A.esc(c.label)}</span></label>`).join('');
  $('fPrice').innerHTML = PRICES.map((p) =>
    `<label class="check"><input type="radio" name="price" value="${p.id}"><span>${p.label}</span></label>`).join('');
  $('fSize').innerHTML = allSizes.map((s) =>
    `<label class="chip"><input type="checkbox" name="size" value="${s}"><span>${s}</span></label>`).join('');
  $('fColour').innerHTML = allColours.map((c) =>
    `<label class="swatch" title="${c}"><input type="checkbox" name="colour" value="${c}"><span style="--c:${A.HEX[c]}"></span><b class="sr-only">${c}</b></label>`).join('');

  function syncControls() {
    $('q').value = state.q;
    document.querySelectorAll('input[name="cat"]').forEach((i) => (i.checked = i.value === state.category));
    document.querySelectorAll('input[name="price"]').forEach((i) => (i.checked = i.value === state.price));
    document.querySelectorAll('input[name="size"]').forEach((i) => (i.checked = state.sizes.includes(i.value)));
    document.querySelectorAll('input[name="colour"]').forEach((i) => (i.checked = state.colours.includes(i.value)));
    $('fSale').checked = state.sale;
    $('sort').value = state.sort;
  }

  /* ----- Filter, sort, render ----- */
  function matches(p) {
    const query = state.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (query.length) {
      const searchable = [p.name, p.slug, p.category, A.catLabel[p.category] || ''].join(' ').toLowerCase();
      if (!query.every((term) => searchable.includes(term))) return false;
    }
    if (state.category && p.category !== state.category) return false;
    const range = PRICES.find((r) => r.id === state.price) || PRICES[0];
    if (p.price < range.min || p.price >= range.max) return false;
    if (state.sale && !p.compare) return false;
    const o = A.optionsOf(p);
    if (state.sizes.length && !state.sizes.some((s) => o.sizes.includes(s))) return false;
    if (state.colours.length && !state.colours.some((c) => o.colours.includes(c))) return false;
    return true;
  }
  const sorters = {
    newest: (a, b) => b.created.localeCompare(a.created),
    popular: (a, b) => b.sold - a.sold,
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price
  };

  function render() {
    const list = A.products.filter(matches).sort(sorters[state.sort] || sorters.newest);
    const visible = list.slice(0, state.shown);
    $('grid').innerHTML = visible.map(A.card).join('');
    $('grid').hidden = !list.length;
    $('empty').hidden = !!list.length;
    $('loadMore').hidden = list.length <= state.shown;
    $('resultCount').textContent = `${list.length} ${list.length === 1 ? 'product' : 'products'}`;
    const cat = cats.find((c) => c.key === state.category);
    $('shopTitle').textContent = state.q ? `Results for “${state.q}”` : cat ? cat.label : state.sale ? 'Sale' : 'Shop';

    const next = new URLSearchParams();
    if (state.q) next.set('q', state.q);
    if (state.category) next.set('category', state.category);
    if (state.price !== 'any') next.set('price', state.price);
    state.sizes.forEach((s) => next.append('size', s));
    state.colours.forEach((c) => next.append('colour', c));
    if (state.sale) next.set('sale', '1');
    if (state.sort !== 'newest') next.set('sort', state.sort);
    history.replaceState(null, '', next.toString() ? `?${next}` : location.pathname);
  }
  const update = () => { state.shown = PAGE; render(); };

  /* ----- Events ----- */
  let t;
  $('q').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { state.q = e.target.value; update(); }, 200); });
  $('filters').addEventListener('change', (e) => {
    const i = e.target;
    if (i.name === 'cat') state.category = i.value;
    if (i.name === 'price') state.price = i.value;
    if (i.name === 'size') state.sizes = [...document.querySelectorAll('input[name="size"]:checked')].map((x) => x.value);
    if (i.name === 'colour') state.colours = [...document.querySelectorAll('input[name="colour"]:checked')].map((x) => x.value);
    if (i.id === 'fSale') state.sale = i.checked;
    update();
  });
  $('sort').addEventListener('change', (e) => { state.sort = e.target.value; update(); });
  $('loadMore').addEventListener('click', () => { state.shown += PAGE; render(); });
  const clear = () => { Object.assign(state, { q: '', category: '', price: 'any', sizes: [], colours: [], sale: false }); syncControls(); update(); };
  $('clearFilters').addEventListener('click', clear);
  $('emptyClear').addEventListener('click', clear);
  $('filterToggle').addEventListener('click', (e) => {
    const open = $('filters').classList.toggle('is-open');
    e.currentTarget.setAttribute('aria-expanded', String(open));
  });

  syncControls();
  render();
  const year = $('year'); if (year) year.textContent = new Date().getFullYear();
})();
