/* Applies admin changes (price, discount, published) on top of the base catalogue.
   AURELLE_ALL has every product (used by the admin); AURELLE_PRODUCTS has only published ones. */
(() => {
  let ov = {};
  try { ov = JSON.parse(localStorage.getItem('aurelle_overrides') || '{}'); } catch (e) {}
  window.AURELLE_ALL = (window.AURELLE_PRODUCTS || []).map((p) => ({ ...p, published: true, ...(ov[p.slug] || {}) }));
  window.AURELLE_PRODUCTS = window.AURELLE_ALL.filter((p) => p.published);
})();
