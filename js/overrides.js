/* Builds the product lists the pages use.
   AURELLE_ALL has every product the visitor is allowed to see (admins also see unpublished ones).
   AURELLE_PRODUCTS has only published ones. Both are filled from the database (see db.js);
   the list in products.js is only a fallback when the database is not connected. */
(() => {
  const seed = (window.AURELLE_PRODUCTS || []).map((p) => ({ ...p, published: true }));
  const ALL = [], PUB = [];
  function rebuild() {
    const src = window.AURELLE_DB ? window.AURELLE_DB.products : seed;
    ALL.splice(0, ALL.length, ...src);
    PUB.splice(0, PUB.length, ...src.filter((p) => p.published));
  }
  window.AURELLE_ALL = ALL;
  window.AURELLE_PRODUCTS = PUB;
  window.AURELLE_REBUILD = rebuild;
  rebuild();
})();
