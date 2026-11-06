(() => {
  const $ = (id) => document.getElementById(id);
  const year = $('year'); if (year) year.textContent = new Date().getFullYear();
  const next = new URLSearchParams(location.search).get('next');
  const dest = next && /^[a-z0-9\-_.\/?=&#]+$/i.test(next) && !next.startsWith('/') && !next.includes('//') ? next : 'account.html';
  const A = window.AUTH;
  const err = (id, m) => { $(id + 'Err').textContent = m || ''; $(id).toggleAttribute('aria-invalid', !!m); };
  const say = (el, m, kind) => { el.textContent = m; el.className = 'form-msg' + (kind ? ' is-' + kind : ''); };
  if (A.current() && ($('loginForm') || $('regForm'))) { location.replace(dest); return; }

  const login = $('loginForm');
  if (login) {
    login.addEventListener('submit', async (e) => {
      e.preventDefault(); const m = $('loginMsg'); say(m, '');
      const email = $('lEmail').value, pw = $('lPass').value;
      err('lEmail', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) ? '' : 'Enter a valid email.'); err('lPass', pw ? '' : 'Enter your password.');
      if ($('lEmailErr').textContent || $('lPassErr').textContent) return;
      $('loginBtn').disabled = true;
      const r = await A.login(email, pw);
      $('loginBtn').disabled = false;
      if (!r.ok) return say(m, r.error, 'error');
      location.href = dest;
    });
  }

  const find = $('findForm');
  if (find) {
    const reset = $('resetForm'), msg = $('formMsg'); let who = '';
    find.addEventListener('submit', (e) => {
      e.preventDefault(); say(msg, ''); const email = $('email').value.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { $('emailErr').textContent = 'Enter a valid email.'; return; }
      $('emailErr').textContent = '';
      if (!A.users().some((u) => u.email === email && u.role === 'customer')) return say(msg, 'No account with that email was made in this browser.', 'error');
      who = email; find.hidden = true; reset.hidden = false; $('newPassword').focus();
    });
    reset.addEventListener('submit', async (e) => {
      e.preventDefault(); say(msg, '');
      const pw = $('newPassword').value, bad = A.pwError(pw);
      $('newPasswordErr').textContent = bad; $('confirmErr').textContent = pw === $('confirm').value ? '' : 'Passwords do not match.';
      if (bad || pw !== $('confirm').value) return;
      const r = await A.resetPassword(who, pw);
      if (!r.ok) return say(msg, r.error, 'error');
      reset.hidden = true; say(msg, 'Your password has been changed.', 'ok'); $('doneLink').hidden = false;
    });
  }

  const reg = $('regForm');
  if (reg) {
    reg.addEventListener('submit', async (e) => {
      e.preventDefault(); const m = $('regMsg'); say(m, '');
      const v = { name: $('rName').value, email: $('rEmail').value, phone: $('rPhone').value, password: $('rPass').value };
      err('rName', v.name.trim().split(/\s+/).filter(Boolean).length >= 2 ? '' : 'Enter your first and last name.');
      err('rEmail', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim()) ? '' : 'Enter a valid email.');
      err('rPhone', /^(\+234|234|0)[789][01]\d{8}$/.test(v.phone.replace(/[\s-]/g, '')) ? '' : 'Enter a valid Nigerian number, like 08012345678.');
      err('rPass', A.pwError(v.password));
      if (v.password !== $('rPass2').value) err('rPass2', 'Passwords do not match.'); else err('rPass2', '');
      if (['rName', 'rEmail', 'rPhone', 'rPass', 'rPass2'].some((i) => $(i + 'Err').textContent)) return;
      const r = await A.register(v);
      if (!r.ok) return say(m, r.error, 'error');
      location.href = dest;
    });
  }
})();
