/* Delivery rules and states (demo rates, in kobo). Real rates will live in store settings later. */
window.AURELLE_SHOP = (() => {
  const STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT Abuja','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];
  const SOUTH_EAST = ['Abia', 'Anambra', 'Ebonyi', 'Imo'];
  let cfg = {}; try { cfg = JSON.parse(localStorage.getItem('aurelle_settings') || '{}'); } catch (e) {}
  const n = (v, d) => (Number.isFinite(+v) && v !== '' && v != null ? Math.round(+v * 100) : d);
  const FEES = { enugu: n(cfg.feeEnugu, 200000), southEast: n(cfg.feeSouthEast, 300000), other: n(cfg.feeOther, 450000) };
  const FREE_ABOVE = n(cfg.freeAbove, 5000000); // free delivery within Enugu State only
  function deliveryFee(state, subtotal) {
    if (!state) return null;
    if (state === 'Enugu') return subtotal >= FREE_ABOVE ? 0 : FEES.enugu;
    return SOUTH_EAST.includes(state) ? FEES.southEast : FEES.other;
  }
  return { STATES, FREE_ABOVE, FEES, deliveryFee };
})();
