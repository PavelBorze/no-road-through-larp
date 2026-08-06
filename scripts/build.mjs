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
  "styles.css",
  "main.js",
  "assets/sigil.svg",
  "docs/eldhar-rulebook.pdf",
  "docs/eldhar-character-guide.pdf",
  "docs/eldhar-map.pdf",
  "docs/eldhar-registration.pdf",
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

/* 2. HTML sanity checks */
console.log("\n2) בודק תקינות HTML");
const html = readFileSync(join(root, "index.html"), "utf8");

const openTags = (html.match(/<section\b/g) || []).length;
const closeTags = (html.match(/<\/section>/g) || []).length;
if (openTags === closeTags) ok(`תגי section מאוזנים (${openTags}/${closeTags})`);
else fail(`תגי section לא מאוזנים: ${openTags} פתיחה מול ${closeTags} סגירה`);

const navIds = [...html.matchAll(/href="#([a-z]+)"/g)].map((m) => m[1]);
for (const id of navIds) {
  if (new RegExp(`id="${id}"`).test(html)) {
    ok(`עוגן ניווט #${id} קיים`);
  } else {
    fail(`עוגן ניווט #${id} חסר id תואם`);
  }
}

if (html.includes('dir="rtl"') && html.includes('lang="he"')) {
  ok("פריסת RTL ושפה עברית מוגדרות");
} else {
  fail("חסרה הגדרת dir=rtl / lang=he");
}

if (html.includes('href="styles.css"')) ok("קישור ל-styles.css");
else fail("חסר קישור ל-styles.css");
if (html.includes('src="main.js"')) ok("קישור ל-main.js");
else fail("חסר קישור ל-main.js");

/* 3. Copy to dist/ */
console.log("\n3) בונה תיקיית dist/");
try {
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist, { recursive: true });

  for (const file of ["index.html", "styles.css", "main.js", "README.md"]) {
    cpSync(join(root, file), join(dist, file));
    ok(file);
  }
  cpSync(join(root, "assets"), join(dist, "assets"), { recursive: true });
  ok("assets/");
  cpSync(join(root, "docs"), join(dist, "docs"), { recursive: true });
  ok("docs/");
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
