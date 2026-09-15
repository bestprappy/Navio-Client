---
version: alpha
name: Navio
description: >-
  Visual identity for Navio, an EV trip planner. Calm blue-gray neutrals on
  Paper, navy text, one bright blue for action. Tokens mirror
  client/app/globals.css; that file is the source of truth when they differ.
colors:
  # Brand pair
  paper: "oklch(0.988 0.004 271)"
  navy: "oklch(0.157 0.049 271)"

  # Light theme (default)
  background: "{colors.paper}"
  foreground: "{colors.navy}"
  surface: "oklch(1 0 0)"
  sidebar: "oklch(0.965 0.006 265)"
  primary: "oklch(0.641 0.197 253)"
  on-primary: "{colors.paper}"
  secondary: "oklch(0.94 0.018 268)"
  on-secondary: "oklch(0.253 0.05 274)"
  muted: "oklch(0.955 0.006 265)"
  muted-foreground: "oklch(0.47 0.02 265)"
  accent: "oklch(0.46 0.055 80)"
  on-accent: "oklch(1 0 0)"
  border: "oklch(0.87 0.01 265)"
  input: "oklch(0.63 0.016 265)"
  destructive: "oklch(0.499 0.174 25.2)"
  success: "oklch(0.548 0.124 141.6)"
  warning: "oklch(0.49 0.105 65)"
  info: "oklch(0.514 0.141 261.2)"
  on-semantic: "oklch(1 0 0)"

  # Dark theme (.dark)
  background-dark: "oklch(0.19 0.018 265)"
  foreground-dark: "{colors.paper}"
  surface-dark: "oklch(0.235 0.02 265)"
  popover-dark: "oklch(0.265 0.022 265)"
  sidebar-dark: "oklch(0.165 0.016 265)"
  primary-dark: "oklch(0.737 0.158 235.9)"
  on-primary-dark: "{colors.navy}"
  secondary-dark: "oklch(0.3 0.02 265)"
  muted-dark: "oklch(0.28 0.02 265)"
  muted-foreground-dark: "oklch(0.76 0.015 265)"
  border-dark: "oklch(0.34 0.02 265)"
  destructive-dark: "oklch(0.638 0.208 25.1)"
  success-dark: "oklch(0.76 0.09 145)"
  warning-dark: "oklch(0.79 0.105 75)"

  # Feature tints (light values; used as text, or at 10% opacity as a surface)
  rating: "oklch(0.8 0.16 86)"
  note: "oklch(0.48 0.12 255)"
  checklist: "oklch(0.5 0.1 75)"
  charging: "oklch(0.5 0.12 150)"
  premade: "oklch(0.5 0.14 300)"
  tag: "oklch(0.48 0.13 275)"

  # Battery level ramp (graphic fills only, never text)
  battery-high: "oklch(0.7 0.19 150)"
  battery-mid: "oklch(0.82 0.17 92)"
  battery-low: "oklch(0.72 0.18 55)"
  battery-critical: "oklch(0.62 0.22 27)"
  battery-high-dark: "oklch(0.8 0.2 150)"
  battery-mid-dark: "oklch(0.89 0.17 98)"
  battery-low-dark: "oklch(0.79 0.17 60)"
  battery-critical-dark: "oklch(0.7 0.21 28)"

  # Theme-independent media and map chrome
  scrim: "oklch(0.16 0.02 260)"
  on-media: "oklch(1 0 0)"
  map-pin: "oklch(0.16 0.02 260)"
  map-pin-foreground: "oklch(1 0 0)"

typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 3rem
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: -0.025em
  h1:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.875rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.025em
  h2:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.5rem
    fontWeight: 700
    lineHeight: 1.25
  h3:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: 600
    lineHeight: 1.35
  title:
    fontFamily: Plus Jakarta Sans
    fontSize: 1rem
    fontWeight: 500
    lineHeight: 1.375
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1.43
  caption:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.33
  data-mono:
    fontFamily: IBM Plex Mono
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1.43
    fontFeature: '"tnum"'

rounded:
  xs: 0.25rem
  sm: 0.6rem
  md: 0.8rem
  lg: 1rem
  xl: 1.4rem
  pill: 9999px

spacing:
  unit: 0.27rem
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 2rem
  appbar: 3.5rem
  container-max: 72rem

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    height: 2rem
    padding: 0 0.625rem
  button-primary-dark:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.on-primary-dark}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    height: 2rem
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    height: 2rem
  button-outline-hover:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
  button-destructive:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.destructive}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xl}"
    padding: 1rem
  card-dark:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.foreground-dark}"
    rounded: "{rounded.xl}"
  card-description:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted-foreground}"
    typography: "{typography.body-sm}"
  card-description-dark:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.muted-foreground-dark}"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    height: 2.25rem
    padding: 0.25rem 0.75rem
  badge:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    height: 1.25rem
  badge-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
  sidebar:
    backgroundColor: "{colors.sidebar}"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
  page:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-sm}"
  page-dark:
    backgroundColor: "{colors.background-dark}"
    textColor: "{colors.foreground-dark}"
  sidebar-dark:
    backgroundColor: "{colors.sidebar-dark}"
    textColor: "{colors.foreground-dark}"
  popover-dark:
    backgroundColor: "{colors.popover-dark}"
    textColor: "{colors.foreground-dark}"
  muted-panel:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.muted-foreground}"
  muted-panel-dark:
    backgroundColor: "{colors.muted-dark}"
    textColor: "{colors.muted-foreground-dark}"
  secondary-panel-dark:
    backgroundColor: "{colors.secondary-dark}"
    textColor: "{colors.foreground-dark}"
  status-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.on-semantic}"
  status-warning:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.on-semantic}"
  status-info:
    backgroundColor: "{colors.info}"
    textColor: "{colors.on-semantic}"
  status-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.on-semantic}"
  status-success-dark:
    backgroundColor: "{colors.success-dark}"
    textColor: "{colors.navy}"
  status-warning-dark:
    backgroundColor: "{colors.warning-dark}"
    textColor: "{colors.navy}"
  status-destructive-dark:
    backgroundColor: "{colors.destructive-dark}"
    textColor: "{colors.on-semantic}"
  accent-chip:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
  divider:
    backgroundColor: "{colors.border}"
    height: 1px
  divider-dark:
    backgroundColor: "{colors.border-dark}"
    height: 1px
  field-outline:
    backgroundColor: "{colors.input}"
    width: 1px
  feature-rating:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.rating}"
  feature-note:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.note}"
  feature-checklist:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.checklist}"
  feature-charging:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.charging}"
  feature-premade:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.premade}"
  feature-tag:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.tag}"
  media-caption:
    backgroundColor: "{colors.scrim}"
    textColor: "{colors.on-media}"
  battery-fill-high:
    backgroundColor: "{colors.battery-high}"
    rounded: "{rounded.pill}"
  battery-fill-mid:
    backgroundColor: "{colors.battery-mid}"
    rounded: "{rounded.pill}"
  battery-fill-low:
    backgroundColor: "{colors.battery-low}"
    rounded: "{rounded.pill}"
  battery-fill-critical:
    backgroundColor: "{colors.battery-critical}"
    rounded: "{rounded.pill}"
  battery-fill-high-dark:
    backgroundColor: "{colors.battery-high-dark}"
  battery-fill-mid-dark:
    backgroundColor: "{colors.battery-mid-dark}"
  battery-fill-low-dark:
    backgroundColor: "{colors.battery-low-dark}"
  battery-fill-critical-dark:
    backgroundColor: "{colors.battery-critical-dark}"
  map-pin:
    backgroundColor: "{colors.map-pin}"
    textColor: "{colors.map-pin-foreground}"
    rounded: "{rounded.pill}"
---

## Overview

Navio plans electric-vehicle road trips: routes, charging stops, places, and
day-by-day itineraries. The interface should feel like a well-made travel
notebook laid over a map: quiet, legible, and trustworthy, so that photos,
maps, and the trip itself carry the color.

The identity is a **brand pair**: _Paper_ (a near-white with a faint blue
cast) and _Navy_ (a deep ink blue). Everything else is a low-chroma blue-gray
neutral at hue ~265, plus one bright blue that marks what the user can do.
There is one color theme, with light and dark modes. Dark mode follows the
system by default (`next-themes`, `class="dark"`).

The client is Next.js App Router with shadcn (`base-nova` style, Base UI
primitives), Tailwind v4, and lucide icons. Tokens live as CSS variables in
`client/app/globals.css` and are exposed to Tailwind through `@theme inline`,
so components use semantic utilities (`bg-card`, `text-muted-foreground`),
never raw values.

## Colors

All colors are authored in OKLCH. Neutrals hold chroma at or below 0.02 and
step lightness predictably; brand and semantic hues carry the chroma.

### Brand pair

- **Paper (`--brand-paper`):** the light page, and the text/primary-foreground
  color in dark mode.
- **Navy (`--brand-pine`):** light-mode text, and the foreground on bright
  dark-mode fills. The CSS variable is still named `pine` for history; the
  value is navy.

### Roles

- **Primary:** the single action color. Light uses a vivid blue
  (`oklch(0.641 0.197 253)`) with Paper text; dark uses a lighter sky blue with
  Navy text. Also drives `--ring`, links, the sidebar primary, and chart 2.
- **Secondary:** a pale blue tint for secondary buttons, selected rows, and
  secondary badges.
- **Muted / muted-foreground:** hover fills, footers, placeholders, and
  supporting text (the second contrast tier).
- **Accent:** a restrained warm olive-gold. Use rarely; it is not a second
  brand color.
- **Border vs input:** `border` separates surfaces quietly; `input` is
  darker so form fields meet 3:1 non-text contrast.
- **Semantic:** `success` green, `warning` amber, `info` blue, `destructive`
  red. Light values are dark enough to read as text on white; dark values are
  brightened and take Navy text.

### Feature tints

One base color per planner feature: `rating`, `note`, `checklist`,
`charging`, `premade`, `tag`. Use the base as text or icon color and tint the
container with opacity (`bg-charging/10 text-charging`). Do not invent new
shades per component.

### Battery level

Battery is the one place Navio lets color pop. Fills follow a four-step ramp
by level: **green** at 50% and above, **yellow** 26–49%, **orange** from 25%
down to the planner's 12% reserve, **red** below it. Use the `.battery-fill`
utility with one `.battery-high|mid|low|critical` class (from
`getBatteryTone`): a same-hue gradient brightening toward the charge edge, a
top highlight, and a soft glow. `.battery-fill-up` turns the gradient
vertical for bar charts. Label low levels in text too (`text-warning` "Low",
`text-destructive` "Below reserve") so color is never the only cue.

Battery percentages may be colored by level with `.battery-text-high|mid|low|critical`
(`BATTERY_TONES[tone].valueText`). These use `--battery-*-text` tokens: deepened
shades that stay at least 4.5:1 on light surfaces, and the bright fill colors in dark
mode. Never use the fill tokens directly as text. A change reads red when battery is
used (`−9%`) and green when it is added (`+59%`).

### Theme-independent colors

`scrim` and `on-media` sit over photos and must not flip with the theme.
`map-pin` sits on light map tiles in both modes. The planner block palette
(`--planner-block-*`, 24 hues with white foreground) is user-selectable data
color for itinerary blocks, not UI chrome.

### Text tiers

1. `--text-primary` = foreground: headings, values, critical labels.
2. `--text-secondary` = muted-foreground: descriptions, metadata.
3. `--text-tertiary` = muted-foreground lifted 0.08 L: timestamps, hints.
   Never use it for anything a user must read to act.

## Typography

- **Plus Jakarta Sans** (400–800) for all UI and headings (`font-sans`,
  `font-heading`). Loaded through `next/font` as `--font-sans`.
- **IBM Plex Mono** (400–600) for numbers that are compared or scanned: range,
  kWh, state of charge, distances, prices, times. Prefer tabular figures.
- `font-serif` (Lora) is declared but **not loaded**; do not use it.

The base UI size is **0.875rem (14px)**: buttons, inputs, cards, and body text
inside the app all use `text-sm`. 1rem is for reading-length copy and card
titles; 1.125rem is the step up (`--text-lg`). Larger heading sizes are for
page titles and marketing surfaces only.

Build hierarchy with weight and contrast before size: a `font-medium`
foreground title over a `text-muted-foreground` description is the default
pairing (see `CardTitle` / `CardDescription`). Letter spacing is normal (0)
except for large display text, which tightens to `tracking-tight`.

## Layout

- **Spacing unit:** Tailwind's `--spacing` is **0.27rem**, not the default
  0.25rem, so `p-4` is ~1.08rem. Use scale utilities (`gap-2`, `p-4`) rather
  than arbitrary values so the whole UI scales together.
- **Named scale:** `--space-xs` 0.25 / `sm` 0.5 / `md` 1 / `lg` 1.5 /
  `xl` 2 rem. Items in a group sit 0.5rem apart; related controls and field
  stacks 1rem; distinct sections 1.5–2rem. Inner gaps stay smaller than outer
  padding.
- **Page shell:** app bar 3.5rem tall; marketing sections use
  `.section-padding` (fluid `clamp` inline and block padding) and
  `.container-max` (72rem).
- **Planner:** a sidebar plus a split itinerary/map view. Build mobile-first;
  collapse to a single column and compact navigation on phones. The page body
  must never scroll horizontally.
- Flexbox by default; Grid for card galleries
  (`repeat(auto-fit, minmax(...))`) and strict two-dimensional layouts.

## Elevation & Depth

Depth comes from **tonal layering first**, shadow second.

| Layer | Light | Dark |
| --- | --- | --- |
| Sidebar (recessed) | 0.965 L, below page | 0.165 L, darkest |
| Page (`background`) | Paper, 0.988 L | 0.19 L |
| Card (`surface`) | white, 1.0 L | 0.235 L |
| Popover / menu | white, 1.0 L | 0.265 L, highest |

Elevation direction is physical in both modes: raised things get lighter.

Shadows are a single soft, black, low-opacity drop (2px y, 3px blur, 0.08–0.16
alpha); larger steps only lengthen the second layer. Cards use a hairline
`ring-1 ring-foreground/10` instead of a shadow; inputs use `shadow-xs`;
menus and dialogs use `shadow-md`–`shadow-lg`. Map markers use
`--map-marker-shadow` so pins read over any tile. Gradients
(`--brand-gradient`) are reserved for rare hero moments.

## Shapes

Generous, soft corners with a base `--radius` of **1rem**.

- `rounded-sm` 0.6rem, `rounded-md` 0.8rem: inputs, small buttons, menu items.
- `rounded-lg` 1rem: buttons.
- `rounded-xl` 1.4rem: cards and panels; images inside a card inherit the
  card's top or bottom radius.
- Pills (`rounded-4xl` / full): badges, tags, chips, map pins, avatars.
- `--radius-xs` 0.25rem only for tiny indicators.

Nested shapes use a smaller radius than their container. Icons are lucide at
1rem inside controls (0.75rem in `xs` controls); never emoji.

## Components

Use the shadcn primitives in `client/components/ui` before building anything.
Extend by composition and `cva` variants; never overwrite a customized
primitive.

- **Button:** height 2rem (`h-8`), `text-sm font-medium`, `rounded-lg`, 1rem
  icons. Variants: `default` (primary fill), `secondary`, `outline`, `ghost`,
  `destructive` (red text on a 10% red tint, not a solid red fill), `link`.
  Sizes `xs` 1.5rem, `sm` 1.75rem, `lg` 2.25rem, plus square `icon-*`. Press
  nudges down 1px. One primary button per view region.
- **Input:** height 2.25rem, `rounded-md`, `border-input`, transparent fill
  (`input/30` in dark), `shadow-xs`, placeholder in muted-foreground.
- **Card:** `bg-card`, `rounded-xl`, 1rem padding and gap (`size="sm"`:
  0.75rem), hairline ring, optional footer on `bg-muted/50` with a top border.
- **Badge:** height 1.25rem, pill, `text-xs font-medium`.
- **Sidebar:** recessed `bg-sidebar`; hover `bg-muted`; the active item uses
  `bg-sidebar-accent` (neutral gray), not primary or secondary.
- **Focus:** every interactive element shows `border-ring` plus a 3px
  `ring-ring/50`. Invalid fields swap to the destructive border and ring.
- **Disabled:** 50% opacity and no pointer events.
- **Feature chips:** `bg-<feature>/10 text-<feature>` with a lucide icon.

## Do's and Don'ts

**Do**

- Use semantic token utilities (`bg-primary`, `text-muted-foreground`,
  `border-border`, `bg-charging/10`) everywhere.
- Add a new CSS variable in `globals.css` (light and `.dark`) when a color is
  truly new, then expose it in `@theme inline`.
- Pair every status color with an icon or label; color is never the only cue.
- Keep numbers and EV metrics in IBM Plex Mono with tabular figures.
- Check both light and dark modes, and keyboard focus, for every change.

**Don't**

- Don't use Tailwind's default palette (`bg-blue-500`, `text-gray-600`) or
  hex/arbitrary colors in components.
- Don't put small Paper/white text on the light-mode primary blue for long
  labels: at `oklch(0.641 0.197 253)` it is 3.3:1, below 4.5:1. Keep
  primary-filled text short and medium weight, or darken the primary.
- Don't put white text on a solid dark-mode `destructive` fill (3.8:1). Use
  the tinted destructive button, or Navy text on the solid fill.
- Don't use `accent` as a second brand color, or the planner block palette
  for UI chrome.
- Don't flip `scrim`, `on-media`, or map-pin colors with the theme.
- Don't add borders where tonal layering already separates surfaces.
- Don't use Lora/`font-serif`, emoji icons, or arbitrary spacing values.
