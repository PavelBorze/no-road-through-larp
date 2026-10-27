/* Buildless progressive enhancement. Native scrolling stays in control: one rAF per scroll/resize,
   geometry reads before writes, continuous loops only while their region is on screen. */
(() => {
  'use strict';
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const smooth = v => v * v * (3 - 2 * v);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const forcedColors = matchMedia('(forced-colors: active)');
  const narrow = matchMedia('(max-width: 1050px)');
  const cinematic = matchMedia('(min-width: 761px) and (min-height: 621px)');
  const effectsToggle = $('.effects-toggle');
  let effectsPaused = false;
  try { effectsPaused = localStorage.getItem('nrt-effects-paused') === 'true'; } catch { /* File mode may restrict storage. */ }
  const motionOK = () => !reduceMotion.matches && !effectsPaused && !document.hidden;
  const rich = () => motionOK() && finePointer.matches && !forcedColors.matches;
  root.classList.add('fx-live');

  /* ——— Effects preference ——— */
  const syncEffects = () => {
    root.classList.toggle('effects-paused', effectsPaused);
    effectsToggle.hidden = reduceMotion.matches;
    effectsToggle.setAttribute('aria-pressed', String(!effectsPaused));
    effectsToggle.title = effectsPaused ? 'הפעלת האפקטים' : 'השהיית האפקטים';
  };
  syncEffects();
  root.classList.toggle('page-paused', document.hidden);
  effectsToggle.addEventListener('click', () => {
    effectsPaused = !effectsPaused;
    try { localStorage.setItem('nrt-effects-paused', String(effectsPaused)); } catch { /* Works without storage. */ }
    syncEffects(); hidePointer(); syncLoops(); scheduleFrame();
  });

  /* ——— Opening curtain (once per visit) ——— */
  function playIntro() {
    if (!root.classList.contains('intro-pending')) return Promise.resolve();
    try { sessionStorage.setItem('nrt-intro', '1'); } catch { /* ignore */ }
    const intro = document.createElement('div');
    intro.className = 'intro';
    intro.setAttribute('aria-hidden', 'true');
    intro.innerHTML = '<div class="intro-half"></div><div class="intro-half"></div><div class="intro-core"><svg viewBox="0 0 26 30" fill="none"><path d="M3 24V10h5v14m2 0V4h6v20m2 0V10h5v14M2 28h22M13 0v2" stroke="currentColor" stroke-width="1.2"/></svg><span class="intro-line"></span><span class="intro-word" dir="ltr">NO ROAD THROUGH</span></div>';
    document.body.append(intro);
    root.classList.add('intro-playing');
    root.classList.remove('intro-pending');
    return new Promise(resolve => {
      let done = false;
      const leave = () => {
        if (done) return; done = true;
        intro.classList.add('is-leaving');
        root.classList.remove('intro-playing');
        resolve();
        setTimeout(() => intro.remove(), 1200);
      };
      intro.addEventListener('click', leave);
      addEventListener('keydown', leave, { once: true });
      setTimeout(leave, 1900);
    });
  }

  /* ——— Split headings into rising words (text nodes only; accents and bdi survive) ——— */
  function splitWords(el, wordClass, innerClass) {
    let i = 0;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (node.parentElement.closest('bdi')) return;
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.append(part); return; }
        const outer = document.createElement('span');
        outer.className = wordClass;
        if (innerClass) {
          const inner = document.createElement('span');
          inner.className = innerClass; inner.style.setProperty('--wd', i);
          inner.textContent = part; outer.append(inner);
        } else outer.textContent = part;
        i++; frag.append(outer);
      });
      node.replaceWith(frag);
    });
    // bdi runs count as one word each.
    $$('bdi', el).forEach(b => { const s = document.createElement('span'); s.className = wordClass; b.replaceWith(s); s.append(b); });
  }
  $$('[data-split-words]').forEach(h => splitWords(h, 'w', 'wi'));
  const scrubWords = $$('[data-scrub]').map(p => { splitWords(p, 'sw'); return $$('.sw', p); });

  /* ——— Reveal on entry ——— */
  const revealables = $$('[data-reveal],[data-split-words]');
  const parents = new Map();
  $$('[data-reveal]').forEach(el => {
    const n = parents.get(el.parentElement) ?? 0;
    el.style.setProperty('--rd', n); parents.set(el.parentElement, n + 1);
  });
  const hero = $('.hero');
  const heroReveals = $$('[data-reveal]', hero);
  const onReveal = new Map(); // element → callback when first revealed
  const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      target.classList.add('is-in');
      revealObserver.unobserve(target);
      onReveal.get(target)?.();
    });
  }, { threshold: .18, rootMargin: '0px 0px -6% 0px' }) : null;

  /* ——— Header, menu, nav glint ——— */
  const header = $('.site-header');
  const toggle = $('.menu-toggle');
  const nav = $('#primary-nav');
  const glint = $('.nav-glint');
  let menuOpen = false;
  const syncMenu = () => {
    toggle.hidden = !narrow.matches;
    nav.hidden = narrow.matches && !menuOpen;
    toggle.setAttribute('aria-expanded', String(narrow.matches && menuOpen));
    toggle.firstElementChild.textContent = menuOpen ? 'סגירה' : 'תפריט';
    if (menuOpen) header.classList.remove('is-tucked');
  };
  toggle.addEventListener('click', () => { menuOpen = !menuOpen; syncMenu(); });
  nav.addEventListener('click', e => { if (e.target.closest('a')) { menuOpen = false; syncMenu(); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) { menuOpen = false; syncMenu(); toggle.focus(); } });
  document.addEventListener('click', e => { if (menuOpen && !header.contains(e.target)) { menuOpen = false; syncMenu(); } });
  narrow.addEventListener('change', () => { menuOpen = false; syncMenu(); placeGlint(); });
  syncMenu();
  const navLinks = $$('a[href^="#"]', nav);
  let glintTarget = null;
  function placeGlint(link = glintTarget) {
    if (narrow.matches || !link) { glint.classList.remove('is-on'); return; }
    glint.style.setProperty('--gx', `${link.offsetLeft}px`);
    glint.style.setProperty('--gw', `${link.offsetWidth}px`);
    glint.classList.add('is-on');
  }
  navLinks.forEach(link => link.addEventListener('pointerenter', () => placeGlint(link)));
  nav.addEventListener('pointerleave', () => placeGlint());
  header.addEventListener('focusin', () => header.classList.remove('is-tucked'));

  /* ——— Countdown: unchanged source target, digits roll on change ——— */
  const eventDate = new Date('2026-11-21T10:00:00+02:00');
  const countdown = $('#countdown');
  const timeFields = $$('[data-time]', countdown);
  function updateCountdown() {
    const seconds = Math.max(0, Math.floor((eventDate.getTime() - Date.now()) / 1000));
    const values = { days: Math.floor(seconds / 86400), hours: Math.floor(seconds / 3600) % 24, minutes: Math.floor(seconds / 60) % 60, seconds: seconds % 60 };
    timeFields.forEach(field => {
      const value = String(values[field.dataset.time]).padStart(2, '0');
      if (field.textContent === value) return;
      const first = field.textContent === '—';
      field.textContent = value;
      if (!first && motionOK()) { field.classList.remove('tick'); void field.offsetWidth; field.classList.add('tick'); }
    });
    countdown.setAttribute('aria-label', seconds ? 'הזמן עד האירוע' : 'מועד האירוע הגיע');
  }
  updateCountdown();
  setInterval(() => { if (!document.hidden) updateCountdown(); }, 1000);

  /* ——— Ember particle layers: CSS loops run only while visible ——— */
  const emberLayers = $$('.scene-embers,.hero-atmosphere,.title-embers');
  if ('IntersectionObserver' in window) {
    const emberObserver = new IntersectionObserver(entries => entries.forEach(({ target, isIntersecting }) => {
      target.classList.toggle('is-visible', isIntersecting);
      if (isIntersecting && !reduceMotion.matches) target.classList.add('is-lit');
    }), { threshold: .05 });
    emberLayers.forEach(l => emberObserver.observe(l));
  }

  /* ——— Heavy loops (light rays) gated by visibility ——— */
  const visible = new Set();
  const loopObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => { isIntersecting ? visible.add(target) : visible.delete(target); });
    syncLoops();
  }, { rootMargin: '80px 0px' }) : null;
  const raysCanvas = $('.hero-rays');
  let rays = null;
  loopObserver?.observe(hero);
  function syncLoops() {
    const ok = motionOK() && !forcedColors.matches;
    if (ok && visible.has(hero) && !heroCovered && innerWidth > 760) {
      rays ??= window.nrtLightRays?.(raysCanvas) ?? null;
      rays?.start(); raysCanvas.classList.toggle('is-on', !!rays);
    } else rays?.stop();
  }



  /* ——— Pointer: fluid glow cursor, light pool, faction spotlight, hero parallax ——— */
  const pointerLight = document.createElement('div');
  pointerLight.className = 'pointer-light'; pointerLight.setAttribute('aria-hidden', 'true');
  pointerLight.innerHTML = '<span class="pointer-bloom"></span><span class="pointer-flare"></span>';
  document.body.append(pointerLight);
  const glowField = document.createElement('div');
  glowField.className = 'glow-cursor-field'; glowField.setAttribute('aria-hidden', 'true');
  const glowCanvas = document.createElement('canvas');
  glowField.append(glowCanvas); document.body.append(glowField);
  let glowCursor = null, glowAttempted = false;
  function mountGlowCursor() {
    if (glowAttempted) return; glowAttempted = true;
    try { glowCursor = window.createNrtGlowCursor?.(glowCanvas, glowField) ?? null; } catch { glowCursor = null; }
    root.classList.toggle('fluid-cursor-ready', !!glowCursor);
  }
  glowCanvas.addEventListener('webglcontextlost', e => { e.preventDefault(); glowCursor?.destroy(); glowCursor = null; root.classList.remove('fluid-cursor-ready'); });
  $$('.faction').forEach(card => {
    const light = document.createElement('span');
    light.className = 'faction-light'; light.setAttribute('aria-hidden', 'true');
    card.querySelector(':scope > summary').append(light);
  });
  let pFrame = 0, pActive = false, px = 0, py = 0, lx = 0, ly = 0, lastPT = 0, litFaction = null;
  let mx = 0, my = 0, smx = 0, smy = 0; // hero parallax, -1..1
  function hidePointer() {
    glowCursor?.reset(); pActive = false;
    pointerLight.classList.remove('is-visible', 'is-hovering');
    litFaction?.classList.remove('is-pointer-lit'); litFaction = null;
    if (pFrame) cancelAnimationFrame(pFrame); pFrame = 0;
  }
  function updatePointer(time) {
    pFrame = 0;
    if (!pActive || !rich()) { hidePointer(); return; }
    const k = 1 - Math.exp(-Math.min(64, time - lastPT) / 48); lastPT = time;
    lx += (px - lx) * k; ly += (py - ly) * k;
    smx += (mx - smx) * k * .5; smy += (my - smy) * k * .5;
    const target = document.elementFromPoint(px, py);
    const faction = target?.closest('.faction') ?? null;
    pointerLight.style.transform = `translate3d(${lx}px,${ly}px,0)`;
    pointerLight.classList.toggle('is-hovering', !!target?.closest('a,button,summary'));
    if (faction !== litFaction) { litFaction?.classList.remove('is-pointer-lit'); litFaction = faction; litFaction?.classList.add('is-pointer-lit'); }
    if (faction) { const r = faction.getBoundingClientRect(); faction.style.setProperty('--faction-light-x', `${lx - r.left}px`); faction.style.setProperty('--faction-light-y', `${ly - r.top}px`); }
    if (visible.has(hero) && !heroCovered) { rays?.pointer(px / innerWidth, py / innerHeight); scheduleFrame(); }
    if (Math.abs(px - lx) + Math.abs(py - ly) + Math.abs(mx - smx) * 40 > .1) pFrame = requestAnimationFrame(updatePointer);
  }
  const schedulePointer = () => { if (!pFrame && pActive) { lastPT = performance.now(); pFrame = requestAnimationFrame(updatePointer); } };
  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || !rich()) { hidePointer(); return; }
    mountGlowCursor(); glowCursor?.move(e);
    px = e.clientX; py = e.clientY;
    mx = px / innerWidth * 2 - 1; my = py / innerHeight * 2 - 1;
    if (!pActive) { lx = px; ly = py; }
    pActive = true; pointerLight.classList.add('is-visible'); schedulePointer();
  }, { passive: true });
  root.addEventListener('pointerleave', hidePointer);
  addEventListener('blur', hidePointer);
  document.addEventListener('keydown', e => { if (e.key === 'Tab') hidePointer(); });
  [finePointer, forcedColors].forEach(q => q.addEventListener('change', () => { hidePointer(); syncLoops(); }));

  /* ——— Click sparks on commands ——— */
  let sparks = null;
  document.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && rich()) { mountGlowCursor(); glowCursor?.click(e); }
    if (!motionOK() || forcedColors.matches) return;
    if (!e.target.closest('.button,.header-register,.faction summary,.rule-entry,.house,.faction-filters button,.location-disclosure > summary')) return;
    sparks ??= window.nrtClickSpark?.() ?? null;
    sparks?.burst(e.clientX, e.clientY);
  }, { passive: true });

  /* ——— Magnetic commands ——— */
  $$('[data-magnet]').forEach(el => {
    el.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || !rich()) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate3d(${dx * .22}px,${dy * .32}px,0)`;
    });
    el.addEventListener('pointerleave', () => el.style.removeProperty('transform'));
  });

  /* ——— Tomes: tilt + glare ——— */
  $$('[data-tilt]').forEach(card => {
    card.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || !rich()) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.classList.add('is-tilting');
      card.style.setProperty('--rx', `${(.5 - y) * 9}deg`);
      card.style.setProperty('--ry', `${(x - .5) * 11}deg`);
      card.style.setProperty('--gx', `${x * 100}%`);
      card.style.setProperty('--gy', `${y * 100}%`);
    });
    card.addEventListener('pointerleave', () => { card.classList.remove('is-tilting'); card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
  });

  /* ——— Count-up (decorative capacity figure only; real content is never altered) ——— */
  $$('.capacity [data-count]').forEach(el => {
    const target = Number(el.dataset.count);
    const run = () => {
      if (!motionOK()) return;
      const t0 = performance.now(), dur = 1700;
      const step = now => {
        const t = clamp((now - t0) / dur);
        el.textContent = String(Math.round(target * (1 - Math.pow(2, -10 * t))));
        if (t < 1) requestAnimationFrame(step); else el.textContent = String(target);
      };
      requestAnimationFrame(step);
    };
    const host = el.closest('.registration-heading');
    if (revealObserver && motionOK()) el.textContent = '0';
    onReveal.set(host, run);
    revealObserver?.observe(host);
  });

  /* ——— Gallery: drag to travel ——— */
  const gallery = $('.location-gallery');
  if (gallery) {
    let down = false, sx = 0, sl = 0, moved = false;
    gallery.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = gallery.scrollLeft; });
    addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 5) { moved = true; gallery.classList.add('is-dragging'); }
      if (moved) gallery.scrollLeft = sl - dx;
    });
    addEventListener('pointerup', () => { if (!down) return; down = false; requestAnimationFrame(() => gallery.classList.remove('is-dragging')); });
    gallery.addEventListener('click', e => { if (moved) { e.preventDefault(); moved = false; } }, true);
  }

  /* ——— Factions: filters with a sliding ember indicator ——— */
  const filters = $('.faction-filters');
  const indicator = $('.filter-indicator', filters);
  const filterButtons = $$('button', filters);
  const groups = $$('.faction-group');
  const feedback = $('#filter-feedback');
  function placeIndicator() {
    const active = filterButtons.find(b => b.getAttribute('aria-pressed') === 'true');
    if (!active || getComputedStyle(indicator).display === 'none') { filters.classList.remove('has-indicator'); return; }
    const fr = filters.getBoundingClientRect(), br = active.getBoundingClientRect();
    filters.style.setProperty('--fx', `${br.left - fr.left}px`);
    filters.style.setProperty('--fy', `${br.top - fr.top}px`);
    filters.style.setProperty('--fw', `${br.width}px`);
    filters.style.setProperty('--fh', `${br.height}px`);
    filters.classList.add('has-indicator');
  }
  const setFilter = (id, announce = true) => {
    let count = 0;
    groups.forEach(group => {
      group.hidden = id !== 'all' && group.id !== id;
      if (group.hidden) return;
      const cards = $$('.faction', group);
      count += cards.length;
      if (announce && motionOK()) {
        cards.forEach((c, i) => c.style.setProperty('--fi', i));
        group.classList.remove('is-dealt'); void group.offsetWidth; group.classList.add('is-dealt');
      }
    });
    filterButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === id)));
    if (announce) feedback.textContent = `מוצגות ${count} קבוצות`;
    placeIndicator(); hidePointer(); scheduleFrame();
  };
  filters.hidden = false;
  filters.addEventListener('click', e => { const b = e.target.closest('button[data-filter]'); if (b) setFilter(b.dataset.filter); });

  /* ——— Scroll-driven world ——— */
  const fuse = $('.scroll-fuse');
  const heroDepth = $('.hero-depth');
  const heroMist = $('.hero-mist');
  const heroContent = $('.hero-content');
  const sections = navLinks.map(a => document.querySelector(a.hash)).filter(Boolean);
  const journey = $('.story-journey');
  const panel = $('.scene-panel');
  const storyImages = $$('.story-image');
  const progressMarks = $$('.story-progress li');
  const steps = $$('.story-step');
  const stepCopies = steps.map(s => $('.story-copy', s));
  const ghosts = $$('.ghost-word');
  const dayArc = $('.day-arc');
  const compass = $('.location-symbol');
  const regBackdrop = $('.registration-backdrop img');
  const registration = $('.registration');
  let frame = 0, activeStep = -1, lastY = scrollY, heroCovered = false;

  function updateView() {
    frame = 0;
    if (document.hidden) return;
    const vh = innerHeight;
    const allowMotion = motionOK() && !forcedColors.matches;
    const copyFits = stepCopies.every(c => c.offsetHeight < vh - 220);
    const immersive = cinematic.matches && allowMotion && copyFits;
    if (journey.classList.contains('is-cinematic') !== immersive) {
      journey.classList.toggle('is-cinematic', immersive);
      scheduleFrame(); return;
    }
    // ——— Reads
    const y = scrollY;
    const docH = root.scrollHeight - vh;
    const heroH = hero.offsetHeight;
    const jRect = journey.getBoundingClientRect();
    const stepRects = steps.map(s => s.getBoundingClientRect());
    const copyRects = stepCopies.map(c => c.getBoundingClientRect());
    const secTops = sections.map(s => [s.id, s.getBoundingClientRect().top]);
    const ghostRects = ghosts.map(g => g.parentElement.getBoundingClientRect());
    const arcRect = dayArc.getBoundingClientRect();
    const compassTop = compass.getBoundingClientRect().top;
    const regRect = registration.getBoundingClientRect();

    // ——— Writes
    fuse.style.setProperty('--p', String(clamp(y / Math.max(1, docH))));
    header.classList.toggle('is-scrolled', y > 40);
    const dy = y - lastY; lastY = y;
    if (!menuOpen && !header.contains(document.activeElement)) {
      if (dy > 6 && y > vh * .9) header.classList.add('is-tucked');
      else if (dy < -6 || y < vh * .5) header.classList.remove('is-tucked');
    }
    let active = null;
    const line = Math.min(vh * .35, 280);
    secTops.forEach(([id, top]) => { if (top <= line) active = id; });
    navLinks.forEach(l => { l.hash === `#${active}` ? l.setAttribute('aria-current', 'location') : l.removeAttribute('aria-current'); });
    const current = navLinks.find(l => l.hasAttribute('aria-current')) ?? null;
    if (current !== glintTarget) { glintTarget = current; placeGlint(); }

    // Hero — holds in place while the story slides over it; it settles into shadow, never vanishes.
    const heroP = clamp(y / Math.max(1, heroH));
    hero.style.setProperty('--cover', (heroP * .7).toFixed(3));
    const covered = y > heroH + 2;
    if (covered !== heroCovered) { heroCovered = covered; hero.classList.toggle('is-covered', covered); syncLoops(); }
    if (allowMotion && !covered) {
      heroDepth.style.transform = `translate3d(${smx * -14}px,${smy * -8}px,0) scale(${1 + heroP * .06})`;
      heroMist.style.transform = `translate3d(${smx * 26}px,${heroP * -8}%,0)`;
      heroContent.style.transform = `scale(${1 - heroP * .05})`;
    } else if (!allowMotion) {
      [heroDepth, heroMist, heroContent].forEach(el => el.style.removeProperty('transform'));
    }

    // Story — the chapter index follows the reading line.
    let index = 0;
    stepRects.forEach(({ top }, i) => { if (top < vh * .55) index = i; });
    if (index !== activeStep) {
      activeStep = index;
      progressMarks.forEach((m, i) => m.classList.toggle('is-active', i === index));
      journey.dataset.activeStep = String(index + 1);
    }
    if (!immersive) {
      panel.style.removeProperty('--ci'); panel.style.removeProperty('--cr'); panel.style.removeProperty('--arc');
      storyImages.forEach(img => { img.style.removeProperty('transform'); img.style.removeProperty('opacity'); img.style.removeProperty('--burn'); });
      scrubWords.flat().forEach(w => w.style.removeProperty('--o'));
    } else if (jRect.bottom > 0 && jRect.top < vh) {
      const enter = smooth(clamp(1 - jRect.top / (vh * .9)));
      panel.style.setProperty('--ci', `${(1 - enter) * 9}%`);
      panel.style.setProperty('--cr', `${(1 - enter) * 40}px`);
      let lastReveal = 0;
      storyImages.forEach((img, i) => {
        const travel = clamp((vh - stepRects[i].top) / (vh + stepRects[i].height));
        img.style.transform = `scale(${1.1 - travel * .1})`;
        if (i === 0) return;
        // The next chapter burns through from the centre; the previous frame stays opaque beneath.
        const reveal = smooth(clamp((vh * 1.05 - stepRects[i].top) / (vh * .95)));
        img.style.opacity = String(clamp(reveal * 2.5));
        img.style.setProperty('--burn', String(-30 + reveal * 135));
        lastReveal = reveal;
      });
      panel.style.setProperty('--arc', String(lastReveal));
      // Words ignite as each chapter's copy crosses the reading line.
      scrubWords.forEach((words, i) => {
        const local = clamp((vh * .82 - copyRects[i].top) / (vh * .42));
        const n = words.length;
        words.forEach((w, k) => w.style.setProperty('--o', (.16 + .84 * clamp(local * n * 1.15 - k)).toFixed(3)));
      });
    }

    // Ghost engravings slide against the scroll.
    ghosts.forEach((g, i) => {
      const r = ghostRects[i];
      if (!allowMotion) { g.style.removeProperty('--shift'); return; }
      if (r.bottom < -200 || r.top > vh + 200) return;
      g.style.setProperty('--shift', `${((r.top + r.height / 2) - vh / 2) * .22}px`);
    });
    // The day burns along its arc from arrival to departure.
    dayArc.style.setProperty('--arc', String(allowMotion ? clamp((vh * .85 - arcRect.top) / (arcRect.height + vh * .3)) : 1));
    compass.style.setProperty('--spin', allowMotion ? `${compassTop * .18}deg` : '0deg');
    if (allowMotion && regRect.bottom > 0 && regRect.top < vh) regBackdrop.style.setProperty('--py', `${clamp(((regRect.top + regRect.height / 2) - vh / 2) * .14, -120, 120)}px`);
  }
  function scheduleFrame() { if (!frame) frame = requestAnimationFrame(updateView); }
  addEventListener('scroll', () => { scheduleFrame(); schedulePointer(); }, { passive: true });
  addEventListener('resize', () => { scheduleFrame(); placeIndicator(); placeGlint(); });
  reduceMotion.addEventListener('change', () => {
    syncEffects();
    if (reduceMotion.matches) document.getAnimations().forEach(a => a.cancel());
    else emberLayers.filter(l => l.classList.contains('is-visible')).forEach(l => l.classList.add('is-lit'));
    hidePointer(); syncLoops(); scheduleFrame();
  });
  cinematic.addEventListener('change', scheduleFrame);
  forcedColors.addEventListener('change', scheduleFrame);
  document.addEventListener('visibilitychange', () => {
    root.classList.toggle('page-paused', document.hidden);
    if (document.hidden) { if (frame) cancelAnimationFrame(frame); frame = 0; hidePointer(); }
    else { updateCountdown(); scheduleFrame(); }
    syncLoops();
  });
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(scheduleFrame);
    ro.observe(journey); stepCopies.forEach(c => ro.observe(c));
  }
  document.fonts?.ready.then(() => { scheduleFrame(); placeIndicator(); placeGlint(); });

  /* ——— Deep links reveal their faction ——— */
  function revealHash() {
    if (!location.hash) return;
    let target;
    try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch { return; }
    if (!target) return;
    const group = target.closest('.faction-group');
    if (group) setFilter(group.id, false);
    if (target instanceof HTMLDetailsElement) target.open = true;
    if (group) requestAnimationFrame(() => target.scrollIntoView({ block: 'start', behavior: motionOK() ? 'smooth' : 'instant' }));
  }
  addEventListener('hashchange', revealHash);
  $$('.house').forEach(h => h.addEventListener('click', () => { if (location.hash === h.hash) revealHash(); }));

  /* ——— Start ——— */
  setFilter('nobles', false);
  revealHash();
  scheduleFrame();
  syncLoops();
  playIntro().then(() => {
    heroReveals.forEach(el => el.classList.add('is-in'));
    revealables.filter(el => !hero.contains(el)).forEach(el => revealObserver ? revealObserver.observe(el) : el.classList.add('is-in'));
  });
})();
