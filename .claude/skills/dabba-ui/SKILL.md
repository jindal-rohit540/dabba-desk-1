---
name: dabba-ui
description: Design system for DabbaDesk pages and components (warm saffron + banana-leaf palette, Bricolage display font, rounded cards, WhatsApp-style chat). Use whenever creating or restyling any DabbaDesk page, card, table, form, badge, KPI tile or empty state, so the UI stays consistent.
---

# DabbaDesk UI

DabbaDesk should feel like a warm, trustworthy Indian consumer brand (think a polished Swiggy/Zomato support surface), not a generic admin template.

## Before designing
Open `app/globals.css` (tokens), `components/ui.tsx` (Badge, Card, ButtonLink, PageHeading, buttonStyles) and one existing page (`app/page.tsx` or `app/dashboard/page.tsx`). **Reuse these components** before writing new markup.

## Tokens (Tailwind classes)
| Purpose | Class |
|---|---|
| Page background | `bg-paper` |
| Card surface | `bg-card` + `border-line` + `shadow-card` + `rounded-[var(--radius-card)]` (use `<Card>`) |
| Primary text / secondary | `text-ink` / `text-muted` |
| Brand action | `bg-brand` `hover:bg-brand-dark`, soft fills `bg-brand-soft` |
| Success / delivered | `leaf`, `leaf-soft` |
| Info / categories | `sky`, `sky-soft` |
| Delayed / needs human | `warn`, `warn-soft` |
| Errors / refunds over limit | `danger`, `danger-soft` |
| Chat backdrop / own bubble | `bg-chat` / `bg-chat-mine` |

Never hard-code hex values in components. Add a token to `@theme` in `globals.css` if one is truly missing.

## Typography
- Headings use the display font automatically (`h1–h3`). Page title: `<PageHeading eyebrow title>`.
- Numbers in KPI tiles: `font-display text-3xl font-bold tabular-nums`.
- Labels: `text-xs font-semibold uppercase tracking-wider text-muted`.

## Patterns
- **KPI tile**: Card p-5 → label → big number → small delta/hint line (leaf for good, warn for attention).
- **Status badges**: map order status → tone: preparing=sky, out_for_delivery=brand, delayed=warn, delivered=leaf, skipped/cancelled=neutral.
- **Tables**: inside a Card, `divide-y divide-line`, header row `text-xs uppercase text-muted`, rows `hover:bg-paper`. On mobile, collapse to stacked cards (`sm:table` pattern or grid).
- **Empty states**: icon in a soft circle, one sentence, one action.
- **Icons**: `lucide-react`, `size-4` inline, `size-5` in tiles.
- Spacing: page `mx-auto max-w-6xl px-4 sm:px-6 py-10`, sections `space-y-8`, grids `gap-5`.

## Accessibility
Every icon-only button gets `aria-label`. Colour is never the only signal (pair badges with text). Focus styles come from `buttonStyles`.

## Mobile first
Meera checks the dashboard on her phone. Every new screen must work at 375px wide: no horizontal scroll, tap targets ≥ 40px.
