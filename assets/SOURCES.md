# Asset provenance

- `location/grove-1.webp` through `grove-5.webp`: the original event site's venue photographs, converted to WebP for this authorized redesign. No generated substitutes for the real venue.
- `mark.svg` and the inline large seal: original vector construction for the redesign. The large version preserves the intentional hidden narrative clue. The small mark excludes it.
- Fonts: self-hosted Google Sans (Hebrew), Heebo (Latin body fallback), Barlow Condensed and Cinzel from Google Fonts. All under the SIL Open Font License, supplied in the `fonts/` directory. Downloaded only Hebrew/Latin subsets used by the page. No remote runtime font requests.

- `oath-chain.webp`: generated through Magnific / Seedream 5 Pro, 10 October 2026, creation https://www.magnific.com/app/creation/dtxp2VwXSL . Blackened iron links, restrained silver rim light, dark field; a conceptual illustration of the oath, not a canonical object or functional UI icon. Optimized to 1200×1200 WebP. One generation, 100 credits.
- `icons/*.svg` and corresponding inline paths: Phosphor Icons, fill weight, downloaded from https://github.com/phosphor-icons/core/tree/main/assets/fill . MIT license included at `icons/LICENSE.txt`. Filled navigation, audio, rules and location symbols are from the same family, not AI-generated.
- Barlow Condensed 600 Latin: Google Fonts stylesheet and font repository, SIL Open Font License included at `fonts/Barlow-OFL.txt`. The previous Bodoni face was removed from this revision.
- `veyra-night.webp`, `veyra-night-mobile.webp`: new original midnight environment generated with Magnific / Seedream 5 Pro on 10 October 2026, https://www.magnific.com/app/creation/8alBMmWIrU . One generation, 100 credits. Direction: black river, dark wooded valley, layered wet rocks, remote island keep, subtle torchlight, no white sky/horizon/fog. 2560×1440 original and 1200px mobile derivative, WebP. Replaces both bright-horizon assets throughout the rendered site. Fictional atmosphere, not the real venue.
- `icons/*-regular.svg`: licensed Phosphor regular-weight arrows and chevrons from https://github.com/phosphor-icons/core/tree/main/assets/regular . These replace the solid triangular arrow shapes. Functional category icons remain fill weight; the MIT license covers both.

- `fonts/cinzel-latin.woff2`: Cinzel 500–600 Latin from the official Google Fonts CSS endpoint, 10 October 2026. SIL Open Font License included in `fonts/Cinzel-OFL.txt`, from https://github.com/google/fonts/tree/main/ofl/cinzel . Used for the English display, navigation and faction-name typography; Barlow Condensed is retained for numerals. All fonts are self-hosted.

## Revision 5 — game symbols

`game-icons/*.svg` are original downloaded sources from https://github.com/game-icons/icons (Game-icons.net), CC BY 3.0. Full contributors/license notice is included in `game-icons/LICENSE.txt`. Rendered inline versions remove the black square background and inherit the local metal/ember palette; geometry is unchanged. Footer credits name both authors, link Game-icons.net and CC BY 3.0, and disclose the adaptations.

Lorc: open-book, book-cover, book-aura, crossed-swords, cloak-dagger, crested-helmet, flying-flag, compass. Source path: https://github.com/game-icons/icons/tree/master/lorc .
Delapouite: elf-ear. Source: https://github.com/game-icons/icons/blob/master/delapouite/elf-ear.svg .

Phosphor regular pause/play icons remain functional controls under the existing MIT license. Game symbols are generic navigation/category illustrations, not new event heraldry or fictional factions.

- `fonts/google-sans-hebrew.woff2`: official Google Sans Hebrew subset, weights 400–700, obtained from https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&display=swap on 10 October 2026. Font family is officially named Google Sans. SIL Open Font License included in `fonts/GoogleSans-OFL.txt`, from https://github.com/google/fonts/tree/main/ofl/googlesans . Only Hebrew glyph coverage is replaced; English display and numeral faces are preserved.

- `glow-cursor.js`: adapted from [React Bits Glow Cursor](https://reactbits.dev/animations/glow-cursor), [source](https://github.com/DavidHDev/react-bits/tree/main/src/content/Animations/GlowCursor), Copyright 2026 David Haz. MIT + Commons Clause license included in `ReactBits-LICENSE.md`. Used as part of this event website. The original WebGL fluid, advection and bloom shaders are retained; React lifecycle is replaced with plain JavaScript, site color tokens, lazy desktop initialization, local quality limits and existing effects controls. No React or remote runtime requests.

- `river-current.webp` (2560×1440) and `river-current-mobile.webp` (1100px): original dark river scene generated through Magnific / Seedream 5 Pro, 10 October 2026, https://www.magnific.com/app/creation/rgzLvR2xtc . Existing midnight landscape used as style reference; low riverbank perspective, swirling water, black forest slopes, no white horizon. One generation, 100 credits. Fictional story atmosphere, not a depiction of the real venue.

## Revision 11 — complete photographic story scenes

- `oath-sanctuary.webp` and `oath-sanctuary-mobile.webp`: original complete sanctuary interior, https://www.magnific.com/app/creation/rgzLEEWxtc . Replaces the isolated chain image in the story.
- `island-keep.webp` and `island-keep-mobile.webp`: original close island-fortress view, https://www.magnific.com/app/creation/WDHTiMtcXe . Replaces reuse of the hero landscape in the second story chapter.
- Both generated with Magnific / Seedream 5 Pro, 10 October 2026. Desktop 2560×1440 and mobile 1100px WebP. Two initial generations were rejected for unwanted baked-in lettering, then regenerated; four total generations, 400 credits. Only the clean final images are shipped. These are atmospheric interpretations of the existing story locations, not new canonical lore or real venue photos.
- The third chapter retains `river-current.webp`. Each story chapter is one complete image; no separate chain, lock or cutout object is layered over any of the scenes.

## Revision 15 — light timer face and relocated seal

- `fonts/barlow-condensed-light-latin.woff2`: Barlow Condensed 300 Latin, official Google Fonts CSS endpoint https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300&display=swap, downloaded 10 October 2026. Covered by the included Barlow OFL. Used only for the hero countdown; schedule and price remain 600.
- The complete inline seal is now in the top navigation at the user’s request. Its paths, including the hidden narrative detail, are unchanged; a slightly stronger display stroke keeps it legible at navigation size. The simplified footer mark is unchanged.

## RPG edition

- All Hebrew text uses the existing self-hosted Google Sans Hebrew subset; no new font files.
- `fx.js`: adapted from React Bits — [Light Rays](https://reactbits.dev/backgrounds/light-rays), [Click Spark](https://reactbits.dev/animations/click-spark); the Scroll Velocity and Scroll Reveal patterns are reimplemented in `main.js`. Copyright David Haz, MIT + Commons Clause (`ReactBits-LICENSE.md`). React/ogl replaced with plain JavaScript and raw WebGL; colours, speeds and lifecycle adapted to the site.
- Game-icons.net and Phosphor icons are the same as in the original; they are now referenced through a single inline `<symbol>` sprite.
