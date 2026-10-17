# 🍱 DabbaDesk

Instant, correct answers for **Dabba Express** customers ("where's my dabba?"), plus an owner dashboard. Built live with **Claude Code** in the *Build & Ship with Claude Code* masterclass.

> Dabba Express is a fictional company created for the class.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase Postgres · Clerk · Claude API (`claude-opus-5-5`) · Vercel · GitHub Actions · Vitest

## What it does
| Who | Where | What |
|---|---|---|
| Customer | `/help` | Phone + order ID → ask anything → instant reply grounded in *their* order, with a live status card. Skip tomorrow. Pause subscription. |
| Customer | WhatsApp | Same pipeline via Twilio (`/api/whatsapp`) |
| Owner | `/dashboard` (Clerk) | KPIs (before vs after reply time), inbox, refund approvals, today's dabbas, data health |
| ZipRun (delivery partner) | `/api/partner/webhook` | Rider status/ETA updates (v1 + v2 payloads) |
| Vercel Cron | `/api/cron/data-check` | Nightly data-quality checks |

Architecture and diagrams: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Product: [`docs/PRD.md`](docs/PRD.md).

## Run it locally
```bash
npm install
cp .env.example .env.local          # fill in Supabase + Anthropic keys
npx clerk@latest init --accountless # temporary Clerk dev keys, no account needed
npx supabase link --project-ref <ref> && npx supabase db push   # create tables
npm run db:seed -- --reset --live   # load the messy CSVs (cleaning report printed)
npm run smoke:claude                # one real Claude call to check your key
npm run dev
```
The seed prints a demo phone + order ID to try on `/help`.

## Useful scripts
| Command | What |
|---|---|
| `npm test` | 80+ unit tests (Vitest), no network needed |
| `npm run db:seed -- --reset --live` | Wipe + reload demo data, with today's deliveries at "lunch rush" right now |
| `npm run partner:send -- v1-delayed DX-10563 [--url https://…]` | Pretend to be ZipRun and send a delivery update |
| `npm run smoke:claude` | Check the Claude API key and see three triaged sample messages |
| `npm run diwali:rush` | (branch `diwali-rush` only) triple today's orders for the crisis drill |

## Claude Code setup in this repo
| Thing | Where |
|---|---|
| Project memory | `CLAUDE.md` |
| Subagents | `.claude/agents/`: test writer/runner, security + quality reviewers, data analyst (Supabase MCP), owner explainer, reference scout |
| Slash commands | `.claude/commands/`: `/create-spec` `/test-feature` `/code-review-feature` `/ship-feature` `/owner-report` `/crisis` `/reseed` |
| Skills | `.claude/skills/`: `dabba-ui` (design system), `supabase-migration` (with a helper script) |
| Hooks | `.claude/settings.json` + `.claude/hooks/`: block secrets in prompts, guard dangerous bash, auto-format, session context, desktop notifications |
| MCP servers | `.mcp.json`: Supabase (read-only), Vercel, Playwright |
| Specs | `.claude/specs/`: one per feature, the source of truth for tests |

## Checkpoints
Each stage of the class is tagged: `cp-A` (plan) → `cp-B` (scaffold) → `cp-C` (database) → `cp-D` (help desk + AI) → `cp-E` (Claude Code toolkit) → `cp-F` (dashboard + auth) → `cp-G` (partner webhook + PII) → `cp-H` (CI + cron) → `cp-I` (pause) → `cp-J` (WhatsApp).
