# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, single-page promotional website for a Hebrew LARP (live-action role-play) event, **"No Road Through"** (Hebrew site content; the event name is English). Late-medieval fantasy theme. The entire site is three hand-written files — `index.html`, `styles.css`, `main.js` — with **no framework, no bundler, and no runtime dependencies** (there is no `node_modules`). Deploy target is GitHub Pages (serve the repo root, or the `dist/` produced by the build).

This is plain HTML/CSS/vanilla JS. Do **not** introduce React, Tailwind, a bundler, or npm UI packages unless the user explicitly asks.

## Commands

```bash
npm run build   # node scripts/build.mjs — validate + copy static files into dist/
npm run clean   # remove dist/
```

There is **no dev server, no test runner, and no linter**. To preview, open `index.html` directly or serve the folder statically (e.g. `npx serve .`). "Testing" means running `npm run build` — see below.

## The build script as validator

`scripts/build.mjs` is the closest thing to a test suite. It does three things, and **fails the build (exit 1)** on any problem:

1. **Existence check** — every path in its `REQUIRED` array must exist. This includes the four PDFs under `docs/` (`eldhar-rulebook.pdf`, `eldhar-character-guide.pdf`, `eldhar-map.pdf`, `eldhar-registration.pdf`). The committed PDFs are placeholders; the build only checks presence, not content.
2. **HTML sanity check** — balanced `<section>` tags, every nav `href="#id"` has a matching `id="…"` in the HTML, `dir="rtl"`/`lang="he"` are present, and `styles.css`/`main.js` are linked.
3. **Copy to `dist/`** — copies `index.html`, `styles.css`, `main.js`, `README.md`, `assets/`, `docs/`.

Run `npm run build` after editing markup to catch broken nav anchors, unbalanced sections, or missing files. Build output and the script's own logs are in Hebrew.

## Architecture & the coupling that matters

Everything renders from `index.html`. `main.js` is a single IIFE (vanilla ES5-style, no modules) that progressively enhances it; `styles.css` holds a design-token system in `:root`.

**Section IDs are the load-bearing contract, duplicated in three places that must stay in sync:**

- the `<section id="…">` in `index.html`,
- the nav `<a href="#…">` links, and
- the `sectionIds` array in `main.js` (used for active-nav-link highlighting via IntersectionObserver).

The build validates HTML ↔ nav, but **it does not check `main.js`** — if you add, remove, or rename a section, update `sectionIds` in `main.js` by hand or active-link tracking silently breaks. Current sections: `hero`, `premise`, `factions`, `practical`, `rules`, `register`, `location`.

`main.js` responsibilities (all guarded so missing elements no-op):
- Reveal-on-scroll: elements marked `data-reveal` get `.is-visible` when they enter the viewport (falls back to always-visible without IntersectionObserver).
- Nav scroll state (`.is-scrolled`), mobile nav toggle, active-section tracking.
- **Countdown timer** — the event datetime is hard-coded as `new Date("2026-11-21T10:00:00+02:00")`. Change it there.
- Location reveal toggle (the exact venue is intentionally hidden behind a button).

`styles.css` conventions:
- Design tokens (colors, fonts, widths) are CSS custom properties in `:root` — forest greens, old gold, blood red, parchment, ink. **Use these variables; don't hardcode hex values.**
- Organized in labeled `/* ---------- section ---------- */` blocks. Responsive breakpoints at `880px` and `560px`, plus a `prefers-reduced-motion` block that disables reveal animations — preserve that when adding motion.

## Conventions

- **RTL Hebrew is the baseline.** All UI copy is Hebrew; layout assumes `dir="rtl"`. Keep it that way and mirror directionally-aware styles.
- **Self-contained is the goal, but not yet met.** The page pulls Google Fonts (Frank Ruhl Libre, Amatic SC) and some images from Pexels/CDN. Local assets live in `assets/` (`sigil.svg` is the favicon and the repeated heraldic sigil, inlined as SVG in several places).
- Keep the no-dependency, no-build-step-required nature intact — the raw files must work when opened directly.
