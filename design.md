# Design — Lola 的資訊柑仔店

A locked design system for this site, built with Hallmark's **Hum** catalog theme
(genre: *playful*) as the base, adapted for a small bilingual (Traditional
Chinese content, Latin-script brand name) junior-high course-materials site.
Every future redesign should read this file first — extend it rather than
inventing a new system per page.

## Genre
Playful — friendly, warm, approachable. Signals: 國中生 audience, "柑仔店"
(corner-store) branding, non-commercial course-materials site.

## Why Hum, and what was deliberately left out

Hum is the catalog's only playful/multi-accent theme, and its cream +
pear-yellow + sky-cyan + coral-red palette matches the "candy-shelf corner
store" brand concept far better than a generic single-accent SaaS palette
would. **This site is a content/course-materials site, not a marketing
landing page**, so several Hum signature moves were intentionally dropped:

- No hero section, no character mascot, no star-burst micro-celebration, no
  counters, no Lenis smooth-scroll. None of the existing pages have a hero —
  they're card lists (announcements/lectures/showcase) and detail pages.
- No mono type family — the site has no counters or stat labels that would
  use it.
- Card radius is tuned to the **quiet end** of Hum's allowed range (16px, not
  the toy-chunky 20–28px) — appropriate for a dense list of course materials,
  not a single hero product card.

What *was* kept: the cream paper, the three-accent role system (pear /
cyan / coral, each owning a distinct kind of surface), rounded-sans display
type, soft layered shadows, and the signature push-button recipe.

## Macrostructure family

One family: **content pages** (index → card-list pages → detail pages). No
per-page macrostructure variation — this is a small site, not a multi-shape
app. Structure/IA is unchanged from before this redesign; only the visual
layer (colour, type, component physics) changed.

## Theme — Hum, adapted

Light and dark variants both keep the same three anchor hues (pear 95 /
cyan 235 / coral 18) — only lightness and chroma shift between modes, per
Hallmark's colour rules. Hum's own spec is light-only; the dark variant here
is this project's extension so the existing `prefers-color-scheme: dark`
support isn't lost.

**Light**
- `--color-paper`   oklch(97% 0.012 95)
- `--color-paper-2` oklch(94% 0.016 95)
- `--color-ink`     oklch(20% 0.012 250)
- `--color-accent` (pear, primary/character) oklch(86% 0.18 95)
- `--color-accent-2` (cyan, decorative tint) oklch(66% 0.18 235)
- `--color-link` (cyan, deepened for text contrast) oklch(48% 0.16 235)
- `--color-accent-3` (coral, single pop moment — nav active state) oklch(68% 0.24 18)
- `--color-mint` oklch(80% 0.16 150) · `--color-lavender` oklch(74% 0.16 305)

**Dark** — paper darkened to 16–24% L, ink brightened to 94% L, accent
chroma reduced ~0.03 / lightness raised ~6–8% per accent, hues unchanged.

## Typography
- Display/body: **Plus Jakarta Sans** (400/500/600/700), layered in front of
  the existing CJK fallback stack (PingFang TC / Noto Sans TC / Microsoft
  JhengHei) — Latin glyphs (numerals, "Lola", "Scratch") get the rounded
  Jakarta feel; Chinese text renders via the system CJK stack as before.
- No mono family (see above).
- Headings: weight 600, tracking -0.025em. Body: weight 400.

## Card & button physics
- Card radius 16px (quiet end of Hum's range) · pill radius 999px · input
  radius 12px.
- Cards: paper surface, layered shadow (contact + ambient), lift 3px + accent
  left-edge on hover.
- Buttons: Hum's push recipe — solid colour edge + soft cast shadow, lifts on
  hover, presses down on `:active`. Pear face, ink text.

## Colour role assignment (site-specific)
- **Pear** — primary buttons, brand character touches.
- **Cyan** — links (deepened for contrast) and decorative tints.
- **Coral** — the one high-energy moment: the current-page nav underline.
- **Mint / lavender** — tag-pill rotation (category tags cycle pear-adjacent
  hues aren't used for tags; tags rotate cyan → mint → lavender by position so
  a card's tag row reads as a little "candy row" instead of one flat colour).

## What pages must share
Palette, type pairing, card/button physics, nav/footer voice. All pages pull
from the single `src/styles/global.css` — there is no per-page theme
divergence to guard against.

## What pages may differ on
Nothing structural at this scope — content differs, the system doesn't.

## Exports
See `tokens.css` at the project root for the drop-in CSS custom-property
form of this system.
