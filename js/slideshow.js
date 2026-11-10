/* Homepage slideshow: fades every 6 seconds. Pauses on hover, keyboard focus, when the tab is hidden,
   or when the visitor presses Pause. Starts paused for people who prefer reduced motion. */
(() => {
  const root = document.getElementById('slides');
  if (!root) return;
  const slides = [...root.querySelectorAll('.slide')], segs = [...root.querySelectorAll('.seg')];
  const pauseBtn = document.getElementById('slidesPause'), live = root.querySelector('.slides__live');
  const DUR = 6000, n = slides.length;
  root.style.setProperty('--dur', DUR + 'ms');
  let i = 0, timer = 0, remaining = DUR, started = 0, running = false;
  let userPaused = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches), hover = false, focused = false;

  const playing = () => !userPaused && !hover && !focused && !document.hidden;
  const syncContrast = () => root.classList.toggle('is-light-slide', slides[i].classList.contains('slide--campaign'));
  function load(k) {                                     // slides 2-4 download only after the first one is on screen
    const img = slides[((k % n) + n) % n].querySelector('img[data-src]');
    if (!img) return;
    img.srcset = img.dataset.srcset; img.src = img.dataset.src;
    img.removeAttribute('data-src'); img.removeAttribute('data-srcset');
  }
  function sync() {
    const p = playing();
    if (p && !running) { running = true; started = Date.now(); timer = setTimeout(() => show(i + 1), remaining); }
    else if (!p && running) { running = false; clearTimeout(timer); remaining -= Date.now() - started; }
    root.classList.toggle('is-paused', !p);
    root.classList.toggle('is-user-paused', userPaused);
    pauseBtn.setAttribute('aria-label', userPaused ? 'Play slideshow' : 'Pause slideshow');
  }
  function show(k, announce) {
    clearTimeout(timer); running = false; remaining = DUR;
    i = ((k % n) + n) % n;
    syncContrast();
    load(i); load(i + 1);
    slides.forEach((s, j) => {
      const on = j === i;
      s.classList.toggle('is-active', on);
      s.setAttribute('aria-hidden', String(!on));
      if (on) s.removeAttribute('inert'); else s.setAttribute('inert', '');
    });
    segs.forEach((b, j) => {
      b.classList.toggle('is-active', j === i);
      b.setAttribute('aria-current', String(j === i));
      const f = b.querySelector('.seg__fill'); f.style.animation = 'none'; void f.offsetWidth; f.style.animation = '';
    });
    if (announce) live.textContent = `Slide ${i + 1} of ${n}: ${segs[i].querySelector('.seg__title').textContent}`;
    sync();
  }

  segs.forEach((b, j) => b.addEventListener('click', () => show(j, true)));
  document.getElementById('slidesPrev').addEventListener('click', () => show(i - 1, true));
  document.getElementById('slidesNext').addEventListener('click', () => show(i + 1, true));
  pauseBtn.addEventListener('click', () => { userPaused = !userPaused; sync(); });
  root.addEventListener('mouseenter', () => { hover = true; sync(); });
  root.addEventListener('mouseleave', () => { hover = false; sync(); });
  root.addEventListener('focusin', (e) => { focused = e.target.matches(':focus-visible'); sync(); });
  root.addEventListener('focusout', () => { focused = false; sync(); });
  document.addEventListener('visibilitychange', sync);
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { show(i + 1, true); } else if (e.key === 'ArrowLeft') { show(i - 1, true); }
  });
  let x0 = null;                                          // swipe on touch screens
  root.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  root.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1), true);
  });

  (window.requestIdleCallback || ((f) => setTimeout(f, 1200)))(() => load(1));
  syncContrast();
  sync();
})();
