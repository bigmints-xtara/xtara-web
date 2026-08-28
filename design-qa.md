# Dream Career editorial detail design QA

## Evidence

- Source visual truth: `/Users/pretheesh/.codex/generated_images/01a0496e-d982-7b03-a1d8-f127dc6b7280/exec-7fd2817e-cf2a-4108-b16e-0b82ffd717f0.png`
- Desktop implementation: `/Users/pretheesh/Projects/xtara-workspace/xtara-web/output/environmental-scientist-editorial-desktop-final.png`
- Focused reader implementation: `/Users/pretheesh/Projects/xtara-workspace/xtara-web/output/environmental-scientist-editorial-article-final.png`
- Compact implementation: `/Users/pretheesh/Projects/xtara-workspace/xtara-web/output/environmental-scientist-editorial-mobile-final.png`
- Forced dark-theme implementation: `/Users/pretheesh/Projects/xtara-workspace/xtara-web/output/environmental-scientist-editorial-mobile-dark-final.png`
- Source dimensions: 1536 x 1080 physical pixels.
- Desktop implementation dimensions: 1440 x 1024 physical pixels at a 1440 x 1024 CSS viewport and device scale factor 1.
- Compact implementation dimensions: 390 x 844 physical pixels at a 390 x 844 CSS viewport and device scale factor 1.
- State: English Environmental Scientist detail, reviewed API content loaded, default collapsed progressive lists.

## Full-view comparison

The source and browser render were inspected together. The implementation preserves the selected option's editorial hierarchy: restrained global navigation, oversized career title, paired action controls, wide lead image and caption, three numbered chapters, a readable central article, and a narrow source-backed utility rail. The Career Direction image intentionally replaces the reference's career-specific photograph so the pattern can serve all 229 careers from 11 reusable direction assets.

## Focused reader comparison

The source reader composition and the browser-rendered article viewport were inspected together because the chapter labels, typography, dividers, widgets, and paragraph rhythm are too small to judge reliably from the full hero view. The implementation keeps the same three-column editorial relationship while using the available API facts instead of inventing the reference's pay, outlook, or pathway content.

## Required fidelity surfaces

- Fonts and typography: the existing Inter family is retained; display, chapter, question, body, caption, and small-label weights and line heights form a clear hierarchy without clipped or truncated text.
- Spacing and layout rhythm: desktop hero and article align to the existing 7xl grid; the chapter rail, reader, and utility rail remain balanced; compact presentation becomes a single-column reader with widgets inserted after the first chapter. No horizontal overflow was detected at 1440 x 1024 or 390 x 844.
- Colors and tokens: the existing navy, amber, accent blue, muted surface, border, background, and foreground tokens match the selected direction and remain coherent in forced dark-theme inspection.
- Image quality and asset fidelity: the hero uses the sharp 1440 x 420 `science-and-discovery.webp` Career Direction image with a cover crop and source-backed caption. It is an intentional reusable-asset deviation from the career-specific source photograph.
- Copy and content: career identity, summary, actions, guide chapters, earnings, education route, skills, starter activity, relationships, sources, and missing states remain API-owned and honest.

## Findings

No actionable P0, P1, or P2 visual findings remain.

## Comparison history

- The initial browser pass found duplicate chapter IDs in the desktop navigation and reader. Navigation wrappers no longer own the destination IDs, and a regression assertion now verifies one destination per chapter.
- The initial chapter-link check changed the hash without reaching the article before hydration. The final hydrated browser check verified `#how-to-get-there`, one destination ID, focused target, and an approximately 96 px sticky-header offset.
- A full-page capture repeated sticky rails while stitching. DOM readback proved there was one desktop reader, zero compact readers, 19 question regions, and one footer; viewport captures were used for the final visual comparison.

## Interaction and browser verification

- Desktop: one editorial reader, three unique chapter destinations, visible utility widgets, `science-and-discovery.webp`, and zero horizontal overflow.
- Compact: one compact reader, no desktop navigator, one inserted widget block, the same direction image, and zero horizontal overflow.
- Dark theme: forced `.dark` state rendered token-based navy and white surfaces without overflow; the temporary browser override was removed after capture.
- Chapter link: `How to get there` updated the URL hash, focused the unique target, and scrolled it below the sticky header after hydration.
- Progressive disclosure: `See all` changed to `Show less` in the first question.
- Fresh console errors and warnings: none in final desktop, compact, dark-theme, and interaction reloads.

final result: passed
