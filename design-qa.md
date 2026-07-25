# Product Design QA — Three-state entry flow

- Source visual truth: `/Users/macbook/.codex/generated_images/019f97d1-2c9e-74f1-8188-9a562e69b3ad/call_D4IU7u3vUF7jS5Cc1ybGfdAr.png`
- Implementation screenshot: `/Users/macbook/git/hzjhss.com/design-qa-entry-workspace.png`
- Side-by-side evidence: `/Users/macbook/git/hzjhss.com/design-qa-comparison.png`
- Supporting states: `design-qa-entry-checking.png`, `design-qa-entry-error.png`, `design-qa-entry-workspace-dark.png`, `design-qa-entry-mobile.png`
- Viewport: 1440 × 1024 CSS px, device density 1
- Source pixels: 1487 × 1058, normalized proportionally onto a 1440 × 1024 canvas
- Implementation pixels: 1440 × 1024
- State: authenticated, preparing workspace

## Full-view comparison

The implementation preserves the selected direction's split composition, restrained ivory/charcoal/gold palette, large editorial status headline, horizontal three-stage progress model, upper-corner brand/theme controls, bottom trust line, and right-side knowledge-network illustration. The implementation deliberately uses the product's existing semantic page color and actual logo asset.

## Focused comparisons

- Progress model: inspected at full resolution after changing the layout to place nodes above labels and connectors only between nodes.
- Authentication error: inspected in `design-qa-entry-error.png`; the name remains populated, access code is cleared, focus returns to the field, and the error is adjacent to the field.
- Responsive/error recovery: inspected at 390 × 844 in `design-qa-entry-mobile.png`.
- Dark theme: inspected in `design-qa-entry-workspace-dark.png` with the dedicated dark raster asset.

## Required fidelity surfaces

- Fonts and typography: existing SF Pro/PingFang system stack retained; display weight, tracking, line-height, and hierarchy closely match the source without adding a font dependency.
- Spacing and layout rhythm: header, centered main split, progress spacing, and footer baseline match the source after the second iteration.
- Colors and tokens: all UI colors come from the shared theme; generated raster assets match the existing light and dark page backgrounds.
- Image quality and asset fidelity: real logo and separately generated 900 px light/dark knowledge-network assets are used; no CSS/SVG network approximation or placeholder art remains.
- Copy and content: text is adapted to the real authentication state model; progress claims are event-driven and do not use fake percentages.

## Comparison history

1. Initial capture found the static preflight shell covering the Lit-rendered entry screen and progress connectors crossing label text.
   - Fixes: remove the preflight shell immediately after the first successful render; restructure progress items with nodes above labels.
   - Post-fix evidence: `design-qa-entry-workspace.png`.
2. First side-by-side comparison found the implementation headline too large and the whole main composition lower than the source.
   - Fixes: reduce the desktop headline ceiling to 64 px, move the main layout upward by 4vh, increase network scale, and align the footer baseline.
   - Post-fix evidence: `design-qa-comparison.png`.

## Findings

No actionable P0, P1, or P2 findings remain.

P3: the implementation omits the small capability labels embedded around the source network graphic. This is acceptable because those labels duplicate surrounding product messaging and the generated raster stays legible in both themes and at responsive sizes.

## Verification

- Primary interactions tested: unsigned session fallback, invalid login, successful login, workspace loading, retry after timeout, and theme toggle.
- Browser console errors: none.
- Mobile viewport confirmed at 390 × 844 CSS px.

final result: passed
