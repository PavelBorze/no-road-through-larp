# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static promotional website for a Hebrew LARP (live-action role-play) event, **"No Road Through"** (Hebrew site content; the event name is English). Late-medieval fantasy theme, Sword Coast / Faerûn setting. Hand-written HTML/CSS/JS with **no framework, no bundler, and no runtime dependencies** (there is no `node_modules`). Deploy target is GitHub Pages (serve the repo root, or the `dist/` produced by the build).

The site is a one-page promo (`index.html`) **plus standalone rulebook pages under `rules/`** — the rulesets are far too long to fit on the promo page. `rules/combat.html` is the first; magic, thieves and others are expected to follow. All pages share the single root `styles.css` and `main.js` (referenced as `../styles.css` / `../main.js` from inside `rules/`).

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
2. **HTML sanity check** — runs over **every `.html` entry in `REQUIRED`** (currently `index.html` and `rules/combat.html`): balanced `<section>` tags, every in-page `href="#id"` has a matching `id="…"` on that same page, `dir="rtl"`/`lang="he"` are present, and `styles.css`/`main.js` are linked (either at the root or via `../`). Cross-page links like `href="../index.html#rules"` are deliberately skipped. **Add a new rules page to `REQUIRED` and it is validated automatically.**
3. **Copy to `dist/`** — copies `index.html`, `styles.css`, `main.js`, `README.md`, `rules/`, `assets/`.

Run `npm run build` after editing markup to catch broken nav anchors, unbalanced sections, or missing files. Build output and the script's own logs are in Hebrew.

## Architecture & the coupling that matters

The promo page renders from `index.html`; each rulebook is its own file under `rules/`. `main.js` is a single IIFE (vanilla ES5-style, no modules) that progressively enhances whatever page loads it — every block is guarded so missing elements no-op, which is why the same file is safe on both the promo page and the rules pages (there it only drives reveal-on-scroll and the mobile nav). `styles.css` holds a design-token system in `:root` and serves every page.

**Section IDs are the load-bearing contract, duplicated in three places that must stay in sync:**

- the `<section id="…">` in `index.html`,
- the nav `<a href="#…">` links, and
- the `sectionIds` array in `main.js` (used for active-nav-link highlighting via IntersectionObserver).

The build validates HTML ↔ nav, but **it does not check `main.js`** — if you add, remove, or rename a section, update `sectionIds` in `main.js` by hand or active-link tracking silently breaks. Current sections: `hero`, `premise`, `factions`, `practical`, `rules`, `register`, `location`. This applies to `index.html` only; rules pages have no entry in `sectionIds`.

**Adding a new rulebook page:** copy `rules/combat.html` as the shell (nav, footer, `../` asset paths, per-page og tags), add the path to `REQUIRED` in `scripts/build.mjs` so it gets validated and copied, and add a card to the `ספרי החוקים` list in the `#rules` section of `index.html`. Rules pages show their content **fully expanded** with a `.doc-toc` jump list at the top — no accordions.

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
