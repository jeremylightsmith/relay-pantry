# Pantry style guide: Tomato & Charcoal

Bold and appetising: pure white, charcoal ink, one tomato-red accent. Manrope throughout. Food photos carry the colour.

The tokens live in [`public/styles.css`](../public/styles.css) as CSS variables. Use the variables, not raw hex values.

## Colour tokens and contrast

| Token | Hex | Use | Contrast |
| --- | --- | --- | --- |
| `--bg` | #FFFFFF | Page and card background (`--surface` is the same white) | — |
| `--ink` | #1F1F23 | Text, headings, icons | 16.4:1 on white |
| `--muted` | #62626B | Secondary text: time, counts, hints | 6.0:1 on white |
| `--accent` | #D7372B | Primary buttons, focus ring, selected state. Never body text. | 4.7:1 with white text (AA) |
| `--accent-soft` | #FCE9E7 | Tag chips, selected menu row, empty-state art | Ink on it: 14.0:1 |
| `--line` | #E7E7EA | Card borders, dividers, skeletons | Decorative |
| `--danger` | #B3261E | Errors. Always paired with an icon and words, because it sits close to the accent. | 6.5:1 on white |

Helper tokens: `--accent-ink` (#FFFFFF, text on the accent) and `--focus` (same as `--accent`).

## Type: Manrope

Manrope loads from Google Fonts (weights 400–800), with a system sans fallback.

| Role | Size / weight | Token |
| --- | --- | --- |
| Display (H1) | clamp(30–42px) / 800 | `--text-display` |
| Section (H2) | 26px / 800 | `--text-section` |
| Card title | 16px / 800, max 2 lines | `--text-card` |
| Body | 15px / 400, line-height 1.45 | `--text-body` |
| Meta | 13px / 500, muted | `--text-meta` |
| Chip | 11.5px / 600 | `--text-chip` |

## Shape, space and motion

| | |
| --- | --- |
| Spacing scale | 4 · 8 · 12 · 16 · 20 · 24 · 32 px (`--s1` … `--s7`); page gutter 16px (phone), 28px (720px+) (`--gutter`) |
| Radius | Cards 10px (`--r-card`) · menus 12px (`--r-menu`) · buttons, search, chips: full pill (`--r-pill`) |
| Elevation | Flat cards with a 1px line; shadow only on hover, menus and the floating button |
| Motion | 150ms ease (`--ease`); cards lift 2px on hover; no motion when `prefers-reduced-motion` is set |
| Grid | 2 columns under 720px · 3 from 720px · 4 from 1080px · max width 1180px (`.grid`, `.wrap`) |
| Touch | Every tap target is at least 42px (`--tap`); Add recipe is a floating button on phones |

## Components

- **Primary button** (`.btn.primary`): accent fill, white text, pill.
- **Secondary button** (`.btn`): white with a 1px line, pill.
- **Tag chip** (`.chip`): accent-soft fill, ink text, pill.
- **Focus ring**: 3px solid `--focus`, offset 2px, on `:focus-visible`.

## Rules

- **One accent, for actions only:** primary button, focus ring and selected state. Tags use the soft tint, never solid red.
- **One primary button per screen.** Everything else is secondary (white with a line).
- **Photo first:** the UI stays neutral so food photos carry the colour. Photos are 4:3 and cropped, never letterboxed.
- **Household:** each recipe shows an initial avatar for whoever added it. Avatar colours are a fixed set of muted tones, never red.
- **States use words:** empty, no results and errors each say what happened and offer one next step.
