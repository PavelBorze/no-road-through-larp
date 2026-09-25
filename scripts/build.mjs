#!/usr/bin/env node
/**
 * Static build for "No Road Through" — LARP promo site.
 *
 * No framework, no bundler, no dependencies. This script:
 *  1. Validates that every required source file exists.
 *  2. Sanity-checks the HTML for unclosed tags / missing anchors.
 *  3. Copies the static files into dist/ ready for GitHub Pages.
 *
 * Run with: npm run build
 */

import { existsSync, mkdirSync, readFileSync, rmSync, cpSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dist = join(root, "dist");

const REQUIRED = [
  "index.html",
  "rules/combat.html",
  "rules/magic.html",
  "rules/classes.html",
  "rules/races.html",
  "story/background.html",
  "styles.css",
  "main.js",
  "assets/sigil.svg",
];

let problems = 0;
const fail = (msg) => {
  console.error(`  ✗ ${msg}`);
  problems++;
};
const ok = (msg) => console.log(`  ✓ ${msg}`);

console.log("\n— בניית האתר: No Road Through —\n");

/* 1. Existence checks */
console.log("1) בודק קבצי מקור");
for (const rel of REQUIRED) {
  if (existsSync(join(root, rel))) {
    ok(rel);
  } else {
    fail(`חסר קובץ: ${rel}`);
  }
}

/* 2. HTML sanity checks — every page, not just index */
console.log("\n2) בודק תקינות HTML");
const PAGES = REQUIRED.filter((rel) => rel.endsWith(".html"));

for (const page of PAGES) {
  console.log(`  — ${page}`);
  const html = readFileSync(join(root, page), "utf8");

  const openTags = (html.match(/<section\b/g) || []).length;
  const closeTags = (html.match(/<\/section>/g) || []).length;
  if (openTags === closeTags) ok(`תגי section מאוזנים (${openTags}/${closeTags})`);
  else fail(`${page}: תגי section לא מאוזנים: ${openTags} פתיחה מול ${closeTags} סגירה`);

  // in-page anchors only; href="../index.html#x" is a cross-page link and is skipped
  const navIds = [...html.matchAll(/href="#([a-z][a-z0-9-]*)"/g)].map((m) => m[1]);
  const missing = navIds.filter((id) => !new RegExp(`id="${id}"`).test(html));
  if (missing.length === 0) ok(`כל ${navIds.length} עוגני הניווט קיימים`);
  else for (const id of missing) fail(`${page}: עוגן ניווט #${id} חסר id תואם`);

  if (html.includes('dir="rtl"') && html.includes('lang="he"')) {
    ok("פריסת RTL ושפה עברית מוגדרות");
  } else {
    fail(`${page}: חסרה הגדרת dir=rtl / lang=he`);
  }

  if (/href="(\.\.\/)?styles\.css"/.test(html)) ok("קישור ל-styles.css");
  else fail(`${page}: חסר קישור ל-styles.css`);
  if (/src="(\.\.\/)?main\.js"/.test(html)) ok("קישור ל-main.js");
  else fail(`${page}: חסר קישור ל-main.js`);
}

/* 3. Copy to dist/ */
console.log("\n3) בונה תיקיית dist/");
try {
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist, { recursive: true });

  for (const file of ["index.html", "styles.css", "main.js", "README.md"]) {
    cpSync(join(root, file), join(dist, file));
    ok(file);
  }
  cpSync(join(root, "rules"), join(dist, "rules"), { recursive: true });
  ok("rules/");
  cpSync(join(root, "story"), join(dist, "story"), { recursive: true });
  ok("story/");
  cpSync(join(root, "assets"), join(dist, "assets"), { recursive: true });
  ok("assets/");
} catch (err) {
  fail(`העתקה ל-dist נכשלה: ${err.message}`);
}

/* Result */
console.log("");
if (problems > 0) {
  console.error(`✗ הבנייה נכשלה — ${problems} בעיות נמצאו.\n`);
  process.exit(1);
}
console.log(`✓ הבנייה הושלמה. פלט בתיקיית dist/ — מוכן ל-GitHub Pages.\n`);
