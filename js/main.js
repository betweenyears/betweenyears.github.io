// Between Years — small enhancements. The site works without this file.

// TODO: paste your TestFlight public link here; every "Join the beta" button uses it.
const BETA_URL = '';

(function () {
  if (BETA_URL) {
    document.querySelectorAll('[data-beta]').forEach((a) => {
      a.href = BETA_URL;
      a.target = '_blank';
      a.rel = 'noopener';
    });
  }

  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  // Header border once scrolled.
  const header = document.querySelector('.site-header');
  const onScroll = () => header && header.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Fade sections in as they arrive.
  const items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add('in'));
  }

  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Question marquee: a second copy of the list makes the loop seamless.
  const track = document.querySelector('.track');
  if (track) {
    const copy = track.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    track.parentNode.appendChild(copy);
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Hero phone: each year's card arrives and its answer is typed, as in the promo video.
  const home = document.querySelector('.phone-home');
  const years = home ? Array.from(home.querySelectorAll('.yr-item')) : [];
  const typers = years.map((item) => {
    const p = item.querySelector('[data-type]');
    if (!p || still) return () => Promise.resolve();
    const text = p.textContent;
    const shown = document.createElement('span');
    const caret = document.createElement('span');
    const rest = document.createElement('span');
    caret.className = 'caret';
    rest.className = 'rest';
    rest.textContent = text;
    p.textContent = '';
    p.append(shown, rest);
    return () => new Promise((done) => {
      p.insertBefore(caret, rest);
      let i = 0;
      const tick = setInterval(() => {
        i++;
        shown.textContent = text.slice(0, i);
        rest.textContent = text.slice(i);
        if (i >= text.length) { clearInterval(tick); caret.remove(); done(); }
      }, 26);
    });
  });
  const playHome = async () => {
    home.querySelectorAll('.prompt, .pill-nav').forEach((e) => e.classList.add('on'));
    if (still) {
      years.forEach((y) => { y.classList.add('on', 'out'); y.querySelector('.dot').classList.add('on'); });
      return;
    }
    await sleep(600);
    for (let i = 0; i < years.length; i++) {
      const item = years[i];
      item.classList.add('on');
      // The year before stops glowing once the next one arrives.
      if (i > 0) years[i - 1].querySelector('.dot').classList.add('dim');
      await sleep(650);
      await typers[i]();
      item.querySelector('.dot').classList.add('on');
      await sleep(450);
      // Room to write: its card slides out from under the year, then the next year comes.
      if (item.classList.contains('note-stack')) { item.classList.add('out'); await sleep(1000); }
    }
  };

  // Night sky: the colour bar sets the colour of today's star.
  const MOODS = [[0, '#A98BFF'], [0.17, '#7FA2FF'], [0.33, '#6FD3E6'], [0.5, '#F5EFE4'], [0.67, '#FF9A8A'], [0.83, '#FFAE52'], [1, '#FFD45C']];
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const mix = (a, b, t) => {
    const x = rgb(a), y = rgb(b);
    return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
  };
  const moodAt = (t) => {
    for (let i = 1; i < MOODS.length; i++) {
      if (t <= MOODS[i][0]) return mix(MOODS[i - 1][1], MOODS[i][1], (t - MOODS[i - 1][0]) / (MOODS[i][0] - MOODS[i - 1][0]));
    }
    return MOODS[MOODS.length - 1][1];
  };
  const night = document.querySelector('.night');
  const range = document.querySelector('.mood-range');
  let touched = false;
  const setMood = (v) => {
    const c = moodAt(Math.min(1, Math.max(0, v / 100)));
    night.style.setProperty('--today', c);
    night.style.setProperty('--today-core', mix('#FFFFFF', c, 0.65)); // pale core, like the app's stars
  };
  if (range) {
    range.addEventListener('input', () => setMood(+range.value));
    ['pointerdown', 'keydown', 'touchstart'].forEach((ev) =>
      range.addEventListener(ev, () => { touched = true; }, { passive: true }));
    setMood(+range.value);
  }
  // The knob appears, then slides left and right once to show it can be moved.
  const hintMood = async () => {
    if (!range) return;
    range.classList.add('ready');
    if (still) return;
    await sleep(700);
    const home0 = +range.value;
    const stops = [home0, 18, 94, home0];
    for (let k = 1; k < stops.length && !touched; k++) {
      await new Promise((done) => {
        const t0 = performance.now(), from = stops[k - 1], to = stops[k], dur = 1100;
        const step = (now) => {
          if (touched) return done();
          const u = Math.min(1, (now - t0) / dur);
          const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
          range.value = from + (to - from) * e;
          setMood(+range.value);
          if (u < 1) requestAnimationFrame(step); else done();
        };
        requestAnimationFrame(step);
      });
    }
  };

  // Hint once: after today's star has landed and while the bar is on screen.
  let landed = false, barSeen = false, hinted = false;
  const maybeHint = () => {
    if (landed && barSeen && !hinted) { hinted = true; hintMood(); }
  };
  if (range && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      barSeen = entries.some((e) => e.isIntersecting);
      maybeHint();
    }, { threshold: 1 }).observe(range);
  } else {
    barSeen = true;
  }

  // The sky phone shows today's date: the same date, across the years.
  const dateEl = document.querySelector('.c-date');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }).toUpperCase();
  }

  // Play each phone's sequence once, when it comes into view.
  const play = (el) => {
    el.classList.add('play');
    if (el.classList.contains('phone-home')) playHome();
    if (el.classList.contains('phone-sky')) {
      if (still) { landed = true; maybeHint(); return; }
      const motion = el.querySelector('animateMotion');
      if (motion && motion.beginElement) setTimeout(() => motion.beginElement(), 1000);
      setTimeout(() => { landed = true; maybeHint(); }, 3300);
    }
  };
  const phones = document.querySelectorAll('.phone-home, .phone-sky');
  if ('IntersectionObserver' in window) {
    const po = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { play(e.target); po.unobserve(e.target); }
      });
    }, { threshold: 0.35 });
    phones.forEach((el) => {
      // Already on screen at load: start now rather than wait for the observer.
      const r = el.getBoundingClientRect();
      const seen = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
      if (seen > r.height * 0.35) play(el); else po.observe(el);
    });
  } else {
    phones.forEach(play);
  }

  // A night sky in the app's mood colours.
  const sky = document.querySelector('.sky');
  if (sky) {
    const moods = ['#A98BFF', '#7FA2FF', '#6FD3E6', '#F5EFE4', '#FF9A8A', '#FFAE52', '#FFD45C'];
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 90; i++) {
      const s = document.createElement('i');
      const star = i < 36;
      const size = star ? 2 + Math.random() * 3 : 1 + Math.random() * 1.2;
      s.className = star ? '' : 'dust';
      s.style.cssText =
        `left:${Math.random() * 100}%;top:${Math.random() * 100}%;` +
        `width:${size}px;height:${size}px;` +
        `color:${star ? moods[Math.floor(Math.random() * moods.length)] : '#F5EFE4'};` +
        `animation-delay:${(Math.random() * 4).toFixed(2)}s;animation-duration:${(3 + Math.random() * 3).toFixed(2)}s`;
      frag.appendChild(s);
    }
    sky.appendChild(frag);
  }
})();
