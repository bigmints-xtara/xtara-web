# Indian-language web typography

Xtara uses Ek Type's **Anek Malayalam**, **Anek Devanagari** (Hindi), and
**Anek Tamil** at their normal width. These coordinated, contemporary script
designs provide genuine variable weights from 100–800, including the 650 weight
used by Xtara headings. They replace device-dependent script fallback without
replacing the existing Inter, Mona Sans, or Georgia Latin glyphs.

- Upstream: https://github.com/EkType/Anek
- Foundry and specimens: https://ektype.in/anek-family.html
- License: SIL Open Font License 1.1, redistributed in `OFL.txt`.
- `sources.json` records the exact unmodified WOFF2 download URLs, byte sizes,
  retrieval date, and SHA-256 hashes.

The three files are the Google Fonts script subsets at normal width, not the
Latin subsets. `src/app/indic-fonts.css` preserves their supplied Unicode ranges
and loads them with `font-display: swap`. They are served locally and fetched
only when text uses their script; no Google Fonts request is made by the browser
for these families. Do not preload all three on every page.

Every explicit presentation font stack must include `var(--font-indic)` before
its generic fallback. Script coverage handles mixed-language content even when
the page locale is English. Tamil precedes Malayalam because their upstream
subsets overlap at U+0B83. `:lang()` rules follow both the server-rendered locale
and client language changes, resetting Latin tracking and providing heading
space for vowel marks. English passages explicitly marked `lang="en"` retain
their normal spacing.

The Tailwind font token uses `@theme inline` so the Inter variable supplied on
`body` is resolved at the element using the utility, rather than on `:root`.

To verify an update, inspect home, assessment/auth, Explorer, and mixed-script
language menus at desktop and 375px width. Check wrapping, conjuncts, vowel marks,
weights, and network/font responses for all three scripts. Font changes do not
change translations or persisted language preferences. Flutter still uses its
existing native font fallback; this delivery is explicitly website-first.
