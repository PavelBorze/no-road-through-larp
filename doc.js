/* No Road Through — rulebook and lore pages.

   main.js is written for the homepage: it queries .hero, .story-journey,
   .faction, #countdown and about twenty other elements and uses them without
   guards, so loading it here would throw on the first null. These pages need
   almost none of it — the header, the mobile menu, reveal-on-scroll and the
   contents rail — so they get their own small script instead. */
(() => {
  const $ = (sel, scope = document) => scope.querySelector(sel);
  const $$ = (sel, scope = document) => [...scope.querySelectorAll(sel)];
  const motionOK = () => !matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.documentElement.classList.add('js');

  /* ——— Header: condense once the page has moved ——— */
  const header = $('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 24);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ——— Header menu ———
     Shared with the homepage — see nav.js. */
  window.NRT?.initHeaderMenu?.();

  /* ——— Reveal on entry ——— */
  const revealables = $$('[data-reveal]');
  if (!revealables.length) return;
  if (!('IntersectionObserver' in window) || !motionOK()) {
    revealables.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (!isIntersecting) return;
          target.classList.add('is-in');
          io.unobserve(target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -5% 0px' }
    );
    revealables.forEach((el) => io.observe(el));
  }

  /* ——— Contents rail: mark the section being read ———
     Measured against a line a third down the viewport rather than an
     IntersectionObserver threshold, which a section taller than the observer
     band can never reach. */
  const links = new Map();
  $$('.doc-toc-list a').forEach((a) => {
    const id = a.getAttribute('href').slice(1);
    const section = document.getElementById(id);
    if (section) links.set(section, a);
  });
  if (!links.size) return;

  let ticking = false;
  const mark = () => {
    ticking = false;
    const line = innerHeight * 0.33;
    let current = null;
    links.forEach((_, section) => {
      const r = section.getBoundingClientRect();
      if (r.top <= line && r.bottom > line) current = section;
    });
    links.forEach((a, section) => a.classList.toggle('is-current', section === current));
  };
  const schedule = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(mark);
  };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  mark();
})();
