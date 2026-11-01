/* No Road Through — the header menu, shared by every page.

   main.js drives the homepage and doc.js the rulebooks, and each used to carry
   its own copy of this. They drifted: doc.js toggled .is-open and .nav-open,
   classes styles.css never defines, so on the rulebooks the panel sat open over
   the top of the page and the button could not close it.

   Below NAV_BREAKPOINT the stylesheet turns the nav bar into a fixed panel under
   the header and relies on [hidden] { display: none !important } to take it off
   screen, so this is the one place that sets nav.hidden and toggle.hidden. A
   plain script rather than a module, so the pages still work opened from disk. */
(() => {
  'use strict';

  /* Must match the media query in styles.css that turns the nav into a panel.
     The build compares the two and fails if they drift. */
  const NAV_BREAKPOINT = 1050;

  const NRT = (window.NRT ||= {});

  /* onSync({ open, narrow }) runs after every state change, the first included:
     the homepage uses it to untuck the header and to move the nav glint. */
  NRT.initHeaderMenu = ({ onSync } = {}) => {
    const header = document.querySelector('.site-header');
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('#primary-nav');
    if (!header || !toggle || !nav) return null;

    const narrow = matchMedia(`(max-width: ${NAV_BREAKPOINT}px)`);
    let open = false;

    const sync = () => {
      toggle.hidden = !narrow.matches;
      nav.hidden = narrow.matches && !open;
      toggle.setAttribute('aria-expanded', String(narrow.matches && open));
      toggle.firstElementChild.textContent = open ? 'סגירה' : 'תפריט';
      onSync?.({ open, narrow: narrow.matches });
    };

    const close = ({ returnFocus = false } = {}) => {
      if (!open) return;
      open = false;
      sync();
      if (returnFocus) toggle.focus();
    };

    toggle.addEventListener('click', () => { open = !open; sync(); });
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });
    document.addEventListener('click', (e) => { if (!header.contains(e.target)) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close({ returnFocus: true }); });
    narrow.addEventListener('change', () => { open = false; sync(); });
    sync();

    return { isOpen: () => open, isNarrow: () => narrow.matches, close };
  };
})();
