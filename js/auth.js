/* Sign-in for customers and admins, using Supabase Auth.
   Passwords are handled by Supabase (never stored here). Roles live in the database (public.profiles),
   so a visitor cannot make themselves an admin by editing the page or their browser storage. */
(() => {
  const DB = window.DB;
  const norm = (e) => String(e || '').trim().toLowerCase();
  const pwError = (p) => (p.length < 8 ? 'Use at least 8 characters.' : !/[A-Za-z]/.test(p) || !/\d/.test(p) ? 'Include at least one letter and one number.' : '');
  const NOT_READY = { ok: false, error: 'The store database is not connected yet.' };
  const friendly = (e) => {
    const m = (e && e.message) || '';
    if (/rate limit|too many/i.test(m)) return 'Too many attempts. Please wait a few minutes and try again.';
    if (/invalid login/i.test(m)) return 'Email or password is incorrect.';
    if (/not confirmed/i.test(m)) return 'Please confirm your email first. Check your inbox for the link.';
    return m || 'Something went wrong. Please try again.';
  };

  const current = () => (DB.profile && DB.profile.status !== 'suspended' ? DB.profile : null);

  async function register({ name, email, phone, password }) {
    if (DB.offline) return NOT_READY;
    const { data, error } = await DB.sb.auth.signUp({ email: norm(email), password, options: { data: { name: name.trim(), phone: phone.trim() } } });
    if (error) return /already registered/i.test(error.message)
      ? { ok: false, error: 'An account with this email already exists. Try logging in.' } : { ok: false, error: friendly(error) };
    if (data.user && data.user.identities && data.user.identities.length === 0)
      return { ok: false, error: 'An account with this email already exists. Try logging in.' };
    if (!data.session) return { ok: true, needsConfirm: true };           // email confirmation is switched on in Supabase
    DB.setProfile(await DB.loadProfile(data.user.id));
    return { ok: true, user: current() };
  }

  const fails = {};
  async function login(email, password) {
    if (DB.offline) return NOT_READY;
    email = norm(email);
    const f = fails[email] || { n: 0, until: 0 };
    if (Date.now() < f.until) return { ok: false, error: 'Too many attempts. Wait 30 seconds and try again.' };
    const { data, error } = await DB.sb.auth.signInWithPassword({ email, password });
    if (error) {
      f.n++; if (f.n >= 5) { f.n = 0; f.until = Date.now() + 30000; } fails[email] = f;
      return { ok: false, error: friendly(error) };
    }
    fails[email] = { n: 0, until: 0 };
    const p = await DB.loadProfile(data.user.id);
    if (!p || p.status === 'suspended') { await DB.sb.auth.signOut(); DB.setProfile(null); return { ok: false, error: 'This account is suspended.' }; }
    DB.setProfile(p);
    return { ok: true, user: p };
  }

  async function logout() {
    DB.setProfile(null);
    try { sessionStorage.removeItem('aurelle_cat:anon'); } catch (e) {}
    if (DB.sb) await DB.sb.auth.signOut();
  }

  async function update(patch) {
    const me = current(); if (!me || DB.offline) return NOT_READY;
    const row = {};
    ['name', 'phone', 'addresses'].forEach((k) => { if (patch[k] !== undefined) row[k] = patch[k]; });
    const { error } = await DB.sb.from('profiles').update(row).eq('id', me.id);
    if (error) return { ok: false, error: friendly(error) };
    DB.setProfile({ ...me, ...row });
    return { ok: true };
  }

  async function changePassword(oldPw, newPw) {
    const me = current(); if (!me || DB.offline) return { ok: false, error: 'Please log in again.' };
    const e = pwError(newPw); if (e) return { ok: false, error: e };
    const check = await DB.sb.auth.signInWithPassword({ email: me.email, password: oldPw });
    if (check.error) return { ok: false, error: 'Your current password is incorrect.' };
    const { error } = await DB.sb.auth.updateUser({ password: newPw });
    return error ? { ok: false, error: friendly(error) } : { ok: true };
  }

  /* Password reset: Supabase emails a link that brings the person back to forgot.html */
  async function sendReset(email) {
    if (DB.offline) return NOT_READY;
    const redirectTo = location.origin + location.pathname.replace(/[^/]*$/, '') + 'forgot.html';
    const { error } = await DB.sb.auth.resetPasswordForEmail(norm(email), { redirectTo });
    return error && /rate limit/i.test(error.message) ? { ok: false, error: friendly(error) } : { ok: true };   // same reply whether or not the email exists
  }
  const isRecovery = () => DB.recovery || /type=recovery/.test(location.hash);
  async function setNewPassword(pw) {
    const e = pwError(pw); if (e) return { ok: false, error: e };
    const { error } = await DB.sb.auth.updateUser({ password: pw });
    if (error) return { ok: false, error: friendly(error) };
    await DB.sb.auth.signOut(); DB.setProfile(null);
    return { ok: true };
  }

  window.AUTH = { current, register, login, logout, update, changePassword, sendReset, setNewPassword, isRecovery, pwError };
})();
