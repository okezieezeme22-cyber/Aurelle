/* Order storage and display helpers shared by the account page and the admin */
window.ORDERS = (() => {
  const STEPS = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
  const read = () => { try { return JSON.parse(localStorage.getItem('aurelle_orders') || '[]'); } catch (e) { return []; } };
  const write = (l) => { try { localStorage.setItem('aurelle_orders', JSON.stringify(l)); return true; } catch (e) { return false; } };
  const fmt = (iso) => new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtTime = (iso) => new Date(iso).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const payLabel = (o) => (o.paymentStatus === 'Unpaid' ? 'Pending payment' : o.paymentStatus);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hist = (o) => (o.history && o.history.length ? o.history : [{ status: 'Pending', at: o.createdAt, note: 'Order placed' }]);

  function timeline(o) {
    const h = hist(o);
    if (o.orderStatus === 'Cancelled') {
      const c = [...h].reverse().find((x) => x.status === 'Cancelled');
      return `<div class="tl-cancel"><strong>Order cancelled</strong><span>${c ? fmtTime(c.at) : ''}${c && c.note ? ' · ' + esc(c.note) : ''}</span></div>`;
    }
    const idx = STEPS.indexOf(o.orderStatus);
    return `<ol class="tl">${STEPS.map((s, i) => {
      const e = [...h].reverse().find((x) => x.status === s);
      const cls = i < idx ? 'is-done' : i === idx ? 'is-current' : '';
      return `<li class="${cls}"><span class="tl__dot" aria-hidden="true"></span><span class="tl__label">${s}${cls ? '<span class="sr-only"> (reached)</span>' : ''}</span><span class="tl__time">${e ? fmtTime(e.at) : ''}</span></li>`;
    }).join('')}</ol>`;
  }
  return { STEPS, read, write, fmt, fmtTime, payLabel, esc, hist, timeline };
})();
