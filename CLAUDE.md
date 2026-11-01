# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static promotional website for a Hebrew LARP (live-action role-play) event, **"No Road Through"** (Hebrew site content; the event name is English). Late-medieval fantasy theme, Sword Coast / Faerûn setting. Hand-written HTML/CSS/JS with **no framework, no bundler, and no runtime dependencies** (there is no `node_modules`). Deploy target is GitHub Pages (serve the repo root, or the `dist/` produced by the build).

The site is a one-page promo (`index.html`) **plus standalone long-form pages** — rulebooks under `rules/` and lore under `story/` — the rulesets are far too long to fit on the promo page. `rules/general.html`, `rules/combat.html`, `rules/magic.html`, `rules/thieves.html`, `rules/classes.html` and `rules/races.html` are the rulebooks so far (more are expected to follow); `story/background.html` is the full player-facing background, linked from the end of the `#premise` section. All pages share the single root `styles.css` and `nav.js`; the promo page then loads `main.js` and the long-form pages the smaller `doc.js` (referenced as `../styles.css`, `../nav.js`, `../doc.js` from inside those folders).

This is plain HTML/CSS/vanilla JS. Do **not** introduce React, Tailwind, a bundler, or npm UI packages unless the user explicitly asks.

## Commands

```bash
npm run build   # node scripts/build.mjs — validate + copy static files into dist/
npm run clean   # remove dist/
```

There is **no dev server, no test runner, and no linter**. To preview, open `index.html` directly or serve the folder statically (e.g. `npx serve .`). "Testing" means running `npm run build` — see below.

## The build script as validator

`scripts/build.mjs` is the closest thing to a test suite. It does three things, and **fails the build (exit 1)** on any problem:

1. **Existence check** — every path in its `REQUIRED` array must exist.
2. **HTML sanity check** — runs over **every `.html` entry in `REQUIRED`** (currently `index.html`, the six pages under `rules/`, and `story/background.html`): balanced `<section>` tags, every in-page `href="#id"` has a matching `id="…"` on that same page, `dir="rtl"`/`lang="he"` are present, `styles.css` is linked, and `nav.js` is linked **before** the page's own `main.js`/`doc.js` (either at the root or via `../`). Cross-page links like `href="../index.html#rules"` are deliberately skipped. **Add a new rules page to `REQUIRED` and it is validated automatically.**
3. **Breakpoint cross-check** — the menu breakpoint exists in two files that cannot see each other: the `@media (max-width: …)` in `styles.css` that turns the nav bar into a fixed panel, and `NAV_BREAKPOINT` in `nav.js` that decides when to hide it. The build compares them and fails on drift.
4. **Copy to `dist/`** — copies `index.html`, `styles.css`, `nav.js`, `main.js`, `doc.js`, `README.md`, `rules/`, `story/`, `assets/`.

Run `npm run build` after editing markup to catch broken nav anchors, unbalanced sections, or missing files. Build output and the script's own logs are in Hebrew.

## Architecture & the coupling that matters

The promo page renders from `index.html`; each rulebook is its own file under `rules/`. Scripts are plain IIFEs, not ES modules, so the files still work opened straight from disk. `main.js` drives the promo page and queries its elements without guards, so it must not be loaded anywhere else; the long-form pages load `doc.js` instead, which does only what they need (header scroll state, reveal-on-scroll, contents-rail tracking). `nav.js` runs on every page and owns the header menu for both — it is linked first, and `defer` keeps that order. `styles.css` holds a design-token system in `:root` and serves every page.

**The menu is split across CSS and JS and neither half works alone.** `styles.css` turns the nav bar into a fixed panel below the breakpoint but never hides it; `[hidden] { display: none !important }` does that, driven from `nav.js`. There is no `.is-open` class — inventing one gets you a panel permanently parked over the top of the page, which is exactly how this broke once. Change the breakpoint in both files or the build fails.

Active-nav-link highlighting measures each `<section id="…">` against a reference line 35% down the viewport on scroll (rAF-throttled) — **not** an IntersectionObserver threshold, which is unreachable for any section taller than the observer band. It reads the sections from the nav links themselves, so adding or renaming a section needs no JS change; just keep the `<section id="…">` and the nav `href="#…"` in step, which the build checks. Current sections: `premise`, `factions`, `practical`, `rules`, `register`, `location`.

**Adding a new rulebook page:** copy `rules/combat.html` as the shell (nav, footer, `../nav.js` + `../doc.js`, `../` asset paths, per-page og tags), add the path to `REQUIRED` in `scripts/build.mjs` so it gets validated and copied, and add a card to the `ספרי החוקים` list in the `#rules` section of `index.html`. Rules pages show their content **fully expanded** with a `.doc-toc` jump list at the top — no accordions.

`nav.js` responsibilities (every page):
- The header menu: `nav.hidden` / `toggle.hidden`, `aria-expanded`, the button label, and closing on nav link, Escape, outside click and breakpoint change. `initHeaderMenu({ onSync })` returns `{ isOpen, isNarrow, close }`; `onSync` is how the promo page hangs its own extras off the same state.

`main.js` responsibilities (promo page only):
- Reveal-on-scroll: elements marked `data-reveal` get `.is-in` when they enter the viewport (falls back to always-visible without IntersectionObserver).
- Header scroll state (`.is-scrolled`), the tucking header (`.is-tucked`, suppressed while the menu is open), active-section tracking and the nav glint.
- **All pages share the same top nav.** The sub-page copies are generated from the one in `index.html` with `href="#x"` rewritten to `href="../index.html#x"`; keep them in sync when nav items change.
- **Countdown timer** — the event datetime is hard-coded as `new Date("2026-11-21T10:00:00+02:00")`. Change it there.
- Location reveal toggle (the exact venue is intentionally hidden behind a button).

`styles.css` conventions:
- Design tokens (colors, fonts, widths) are CSS custom properties in `:root` — forest greens, old gold, blood red, parchment, ink. **Use these variables; don't hardcode hex values.**
- **One deliberate exception:** each page carries a small inline `<style>` in its `<head>`, above the stylesheet links, setting the body background and the three sigil sizes/colours as literal hex. Without it a cold-cache visitor gets a full-viewport link-blue sigil on white until `styles.css` arrives — the inline `<svg>`s have no `width`/`height` attributes and sit inside an `<a>`, so unstyled they fill the viewport and inherit the UA link colour. It cannot use `var(--…)` because those live in the stylesheet that has not loaded yet. Keep the values in sync with `styles.css`.
- Organized in labeled `/* ---------- section ---------- */` blocks. Responsive breakpoints at `880px` and `560px`, plus a `prefers-reduced-motion` block that disables reveal animations — preserve that when adding motion.

## Conventions

- **RTL Hebrew is the baseline.** All UI copy is Hebrew; layout assumes `dir="rtl"`. Keep it that way and mirror directionally-aware styles.
- **Self-contained is the goal, but not yet met.** The page pulls Google Fonts (Frank Ruhl Libre, Amatic SC) and some images from Pexels/CDN. Local assets live in `assets/` (`sigil.svg` is the favicon and the repeated heraldic sigil, inlined as SVG in several places).
- Keep the no-dependency, no-build-step-required nature intact — the raw files must work when opened directly.
