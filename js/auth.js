/* DEMO authentication, stored in this browser only.
   Passwords are salted and hashed, but anyone with access to the browser can still edit storage,
   so this is NOT real security. Real login and roles need a backend (for example Supabase). */
(() => {
  const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const salt = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
  const norm = (e) => String(e || '').trim().toLowerCase();
  async function hash(pw, s) {
    const data = s + ':' + pw;
    if (window.crypto && crypto.subtle) {
      const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
      return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    let h = 5381; for (const c of data) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return 'x' + h.toString(16);
  }
  const users = () => read('aurelle_users', []);
  const save = (l) => write('aurelle_users', l);
  const pub = (u) => u && { id: u.id, role: u.role, name: u.name, email: u.email, phone: u.phone, addresses: u.addresses || [], created: u.created, status: u.status };
  async function seed() {}
  const current = () => {
    const s = read('aurelle_session', null); if (!s) return null;
    const u = users().find((x) => x.id === s.id);
    return u && u.status !== 'suspended' ? pub(u) : null;
  };
  const pwError = (p) => (p.length < 8 ? 'Use at least 8 characters.' : !/[A-Za-z]/.test(p) || !/\d/.test(p) ? 'Include at least one letter and one number.' : '');

  async function register({ name, email, phone, password }) {
    await seed(); email = norm(email);
    if (users().some((u) => u.email === email)) return { ok: false, error: 'An account with this email already exists. Try logging in.' };
    const s = salt();
    const u = { id: 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), role: 'customer', name: name.trim(), email, phone: phone.trim(), salt: s, hash: await hash(password, s), created: new Date().toISOString(), createdAt: new Date().toISOString(), status: 'active', addresses: [] };
    const l = users(); l.push(u); save(l); write('aurelle_session', { id: u.id });
    return { ok: true, user: pub(u) };
  }
  const fails = {};
  async function login(email, password, needRole) {
    await seed(); email = norm(email);
    const f = fails[email] || { n: 0, until: 0 };
    if (Date.now() < f.until) return { ok: false, error: 'Too many attempts. Wait 30 seconds and try again.' };
    const u = users().find((x) => x.email === email);
    if (!u || u.hash !== await hash(password, u.salt)) {
      f.n++; if (f.n >= 5) { f.n = 0; f.until = Date.now() + 30000; } fails[email] = f;
      return { ok: false, error: 'Email or password is incorrect.' };
    }
    if (u.status === 'suspended') return { ok: false, error: 'This account is suspended.' };
    if (needRole && u.role !== needRole) return { ok: false, error: 'This account does not have administrator access.' };
    fails[email] = { n: 0, until: 0 }; write('aurelle_session', { id: u.id });
    return { ok: true, user: pub(u) };
  }
  const logout = () => { try { localStorage.removeItem('aurelle_session'); } catch (e) {} };
  function update(patch) {
    const me = current(); if (!me) return false;
    const l = users(), u = l.find((x) => x.id === me.id);
    ['name', 'phone', 'addresses'].forEach((k) => { if (patch[k] !== undefined) u[k] = patch[k]; });
    return save(l);
  }
  async function changePassword(oldPw, newPw) {
    const me = current(); if (!me) return { ok: false, error: 'Please log in again.' };
    const l = users(), u = l.find((x) => x.id === me.id);
    if (u.hash !== await hash(oldPw, u.salt)) return { ok: false, error: 'Your current password is incorrect.' };
    const e = pwError(newPw); if (e) return { ok: false, error: e };
    u.salt = salt(); u.hash = await hash(newPw, u.salt); save(l); return { ok: true };
  }
  /* Demo only: a real store would email a reset link instead of letting the visitor set a password directly */
  async function resetPassword(email, newPw) {
    await seed(); const l = users(), u = l.find((x) => x.email === norm(email));
    const e = pwError(newPw); if (e) return { ok: false, error: e };
    if (u && u.role === 'customer') { u.salt = salt(); u.hash = await hash(newPw, u.salt); save(l); }
    return { ok: true }; // same reply whether or not the email exists
  }
  window.AUTH = { current, register, login, logout, update, changePassword, resetPassword, pwError, users, save, seed };
  seed();
})();
