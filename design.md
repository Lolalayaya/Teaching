# Design — 柔雅老師的資訊柑仔店

A locked design system for this site. Supersedes the earlier Hum-based
version — kept here for history: v1 was Hallmark's playful **Hum** theme
(cream + pear/cyan/coral multi-accent). This version (v2) was reached
through a full grilling session with the site owner and is a deliberate
pivot away from v1's playful multi-accent register toward something
quieter.

## Why the pivot

The owner's own priority ranking settled the direction: they judge this
site by their own taste first (it's their daily tool), with "usable in
class" as a real but secondary constraint. Across the grilling session
their answers pointed at Hallmark's **modern-minimal** genre — closest to
the catalog's **Coral** theme (single restrained accent on warm-neutral
paper, Stripe-docs register, motion optional) — rather than Hum's loud
multi-accent playfulness. The "corner store" (柑仔店) concept stays as the
site's *name* only; it's no longer a visual metaphor the design tries to
literally depict.

## Genre
Modern-minimal. Clean, restrained, Stripe-documentation register with a
small amount of personal/teacher-blog warmth (carried by the warm cream
paper and the single custom accent, not by decoration).

## Theme — v3: custom, anchored on Kraft paper + Mulberry

Revision history: v1 was Hum (playful multi-accent). v2 (the first pass of
this custom theme) was a warm-cream paper with a "Deep Plum" accent
(`#7A2E52`, itself a toned-down version of a magenta the owner liked,
`#CC00FF`). v3 — this version — came from two more rounds of research and
comparison:

- `ui-ux-pro-max`'s own colour database was queried for "education / course
  materials" palettes and returned only clichés — teal+amber (the generic
  LMS look), navy+blue (generic B2B), and a dark indigo+orange (close to the
  common "AI purple" register). This validated staying off that database's
  well-trodden paths rather than "solving" the brief.
- `frontend-design`'s own AI-cliché calibration flagged v2's plain warm-cream
  paper as uncomfortably close to look #1 in its list ("warm cream near
  #F4F1EA with a serif display and terracotta accent") — even though v2 used
  a sans display and a magenta-family accent rather than serif+terracotta,
  the cream-paper leg of that combination was still a generic default.
- The owner then proposed `#6e009a` as the accent. Converted, that's
  `hsl(283°, 100%, 30%)` — almost exactly Tailwind/shadcn's default
  violet-700 hue and saturation, i.e. squarely the "AI purple" this whole
  project has been steering away from, and cooler than the "warm" throughline
  every prior round converged on. Two toned adaptations (keeping the
  violet-family identity, dropping the saturation and warming the hue
  slightly) were offered instead; the owner picked "Mulberry" (`#6B245F`).
- For the paper, rather than a generic cream, the owner compared real kraft/
  ledger/grocery-bag paper tones — grounded in the site's own "corner store"
  (柑仔店) subject matter per `frontend-design`'s "ground it in the subject"
  principle — and picked "Deep Kraft" (`#E3CFA8`).

One accent, everything else neutral, per Hallmark's colour discipline
(`color.md`): the accent is a highlighter, not a colour block.

**Light**
- `--color-paper` oklch(87% 0.05 75) — Deep Kraft, `#E3CFA8`
- `--color-paper-2` oklch(83% 0.055 75)
- `--color-ink` oklch(20% 0.012 335) — near-black, tinted toward the accent hue
- `--color-border` oklch(78% 0.05 75)
- `--color-accent` (Mulberry) oklch(33% 0.11 335) — `#6B245F`
- `--color-accent-tint` oklch(91% 0.04 335) — pale mulberry, for tag/badge backgrounds only

**Dark**
- `--color-paper` oklch(16% 0.02 75)
- `--color-paper-2` oklch(20% 0.022 75)
- `--color-ink` oklch(94% 0.012 335)
- `--color-border` oklch(28% 0.02 75)
- `--color-accent` oklch(68% 0.13 335) — brightened, chroma reduced per dark-mode recipe
- `--color-accent-tint` oklch(28% 0.05 335)

No second or third accent. Tags, nav active-state, links, and buttons all
share the one accent — rotating multiple hues (v1's pear/cyan/coral) is
gone.

## Theme toggle (manual override)

`prefers-color-scheme` alone made it hard for the owner to actually look at
the light version while their OS was in dark mode. Added a manual toggle
(`.theme-toggle` button in `Nav.astro`, `src/scripts/theme.js`) that stamps
`data-theme="light"`/`"dark"` on `<html>` and persists the choice in
`localStorage`. The three-state CSS pattern: bare `:root` is the light
default; `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }`
is system dark, yielding to an explicit light choice; `:root[data-theme="dark"]`
always wins. A blocking inline script in `BaseLayout.astro`'s `<head>` applies
any saved choice before first paint to avoid a flash of the wrong theme.

## Post-launch fixes (same session)

- **本堂課 box read as jarring.** It originally filled its entire surface with
  `--color-accent-tint` (pale mulberry) — a hue-family jump from the page's
  warm kraft that read as a sticker dropped on top, and also violated
  Hallmark's own colour discipline ("accent as background fill covering more
  than ~5% of a view" is banned). Fixed: the box surface is now
  `--color-paper-2` (one step deeper into the same neutral kraft family); the
  accent is carried only by the border and the price-tag label, which is what
  "highlighter, not a colour block" actually means in practice.
- **Dark mode read as "too black," then as "muddy coffee-brown."** First fix
  attempt raised the dark paper's lightness/chroma while keeping the kraft
  hue (75°) — but a warm hue at low lightness reads as dirty/muddy brown
  rather than a considered dark UI; carrying the light-mode hue straight into
  darkness was the wrong move. Replaced with **Radix Colors' Sand-dark scale**
  (`sand-2` `#191918` paper, `sand-4` `#2a2a28` paper-2, `sand-7` `#494844`
  border, `sand-12` `#eeeeec` ink) — a genuinely neutral dark gray, and
  **Plum-dark** for the accent (`plum-11` `#e796f3`, `plum-12` hover
  `#f4d4f4`, `plum-4` `#451d47` tint). The lesson: the warm kraft identity
  belongs to light mode; dark mode's job is a quiet neutral surface with the
  accent doing the work of connecting the two modes, not a literal low-
  lightness copy of the light palette.
- **Light `--color-paper-2` read as clashing with dark text.** Original was
  `oklch(83% 0.055 75)` — too big a lightness/chroma jump from paper's 87%,
  making the 本堂課 box feel like a competing dense block instead of a quiet
  nested surface. Narrowed to `oklch(85% 0.048 75)`, a much subtler step.

## Signature element

Per `frontend-design`'s "spend your boldness in one place" principle: a
single price-tag shape (`clip-path` notch + a faux punched-hole dot),
used exactly once, on the 本堂課/今日重點 eyebrow label. It's grounded in
the site's own subject matter (a corner store's hand-written price tags)
rather than a generic badge/pill, and appears nowhere else on the site.

## Typography
- **Manrope** (400/500/600/700) — a geometric sans with noticeably rounded
  terminals, layered in front of the existing CJK fallback stack (PingFang
  TC / Noto Sans TC / Microsoft JhengHei). This is the "clean sans-serif
  base with a bit of roundedness" the owner asked for — cleaner and less
  overtly playful than v1's Plus Jakarta Sans.
- Headings: weight 600, tracking -0.01em (lighter touch than v1's -0.025em
  — Manrope doesn't need as much tightening as Plus Jakarta Sans did).
- Body: weight 400.
- No mono family.

## Card & component physics — restrained, not playful
- Card radius 10px · pill radius 999px (tags, nav badge) · input radius 8px.
  Dialed back from v1's 16–20px "Hum" range to a quieter, more document-like
  scale.
- Shadows: a single subtle neutral-ink shadow (not accent-tinted, not
  layered contact+ambient) — `0 1px 2px` + `0 4px 12px` at low opacity.
  No spring/bounce easing anywhere.
- Buttons: flat plum fill, simple darken-on-hover, standard ease-out
  transition. v1's chunky "push" button (coloured edge + cast shadow +
  press-down) is retired — that was a Hum signature move, not a
  modern-minimal one.
- Cards: gentle `translateY(-2px)` lift on hover, no colour-shift, no
  border-left accent stripe.

## Device basis
Designed against a laptop/desktop viewport as the primary target (students
mostly view on their own device); classroom-projector legibility is a
secondary check (headings/contrast must hold up at a distance) rather than
a separate design pass.

## New: "本堂課 / 今日重點" homepage feature
A prominent block at the top of the homepage, above 最新公告, surfacing
whichever lecture(s)/announcement(s) are manually marked `current: true`
in frontmatter. **Manual, not automatic** — different classes progress at
different paces (holidays, exams), so "most recently published" isn't a
reliable proxy for "what's happening in this class right now." The field
lives in the shared `audienceFields` in `content.config.ts`, so it already
respects the existing grade/class filtering — a class only sees the
current item(s) relevant to it.

## What pages must share
Palette, type, card/button physics — all pulled from the single
`src/styles/global.css`.

## Exports
See `tokens.css` at the project root.
