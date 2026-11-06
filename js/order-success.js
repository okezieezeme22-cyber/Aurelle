(() => {
  const A = window.AURELLE, $ = (id) => document.getElementById(id);
  const year = $('year'); if (year) year.textContent = new Date().getFullYear();
  const ref = new URLSearchParams(location.search).get('ref');
  let order = null;
  try { order = JSON.parse(localStorage.getItem('aurelle_orders') || '[]').find((o) => o.ref === ref); } catch (e) {}
  const root = $('successRoot');
  if (!order) {
    root.innerHTML = `<div class="empty"><h1 class="page-title">Order not found</h1><p>We could not find that order in this browser.</p><a class="btn btn--dark" href="shop.html">Back to shop</a></div>`;
    return;
  }
  const c = order.customer;
  root.innerHTML = `
    <div class="success">
      <h1 class="page-title">Thank you, ${A.esc(c.fullName.split(' ')[0])}.</h1>
      <p class="page-sub">Your demo order has been created. Your reference is</p>
      <p class="ref">${A.esc(order.ref)}</p>
      <div class="status-row">
        <span class="pill">Order: ${order.orderStatus}</span>
        <span class="pill pill--warn">Payment: ${order.paymentStatus === 'Unpaid' ? 'Pending payment' : order.paymentStatus}</span>
      </div>
      <p class="note">This is a portfolio demo. No payment was taken. Real payment with Paystack test mode is added in a later step.</p>

      <ul class="osum osum--page">
        ${order.items.map((i) => `<li class="osum__item"><span class="osum__text"><strong>${A.esc(i.name)}</strong><small>${i.colour}, ${i.size} · Qty ${i.quantity} · ${A.esc(i.sku)}</small></span><span>${A.naira(i.lineTotal)}</span></li>`).join('')}
      </ul>
      <dl class="totals">
        <div><dt>Subtotal</dt><dd>${A.naira(order.subtotal)}</dd></div>
        <div><dt>Delivery</dt><dd>${order.deliveryFee === 0 ? 'Free' : A.naira(order.deliveryFee)}</dd></div>
        <div class="totals__sum"><dt>Total</dt><dd>${A.naira(order.total)}</dd></div>
      </dl>
      <div class="deliver"><strong>Delivering to</strong>
        <p>${A.esc(c.fullName)}<br>${A.esc(c.address)}, ${A.esc(c.city)}, ${A.esc(c.state)}<br>${A.esc(c.phone)} · ${A.esc(c.email)}</p></div>
      <a class="btn btn--dark" href="shop.html">Continue shopping</a>
    </div>`;
})();
