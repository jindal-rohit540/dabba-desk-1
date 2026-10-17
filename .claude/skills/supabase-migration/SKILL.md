---
name: supabase-migration
description: Safely add or change DabbaDesk database tables/columns. Use whenever a spec has "Database changes", or the user asks to add a column, table, index or constraint in Supabase.
---

# Adding a Supabase migration (DabbaDesk)

Applied migrations are history. **Never edit one.** Always add a new file.

## Steps
1. Create the file with the helper (it timestamps the name for you):
   ```bash
   bash .claude/skills/supabase-migration/scripts/new-migration.sh <short_snake_name>
   ```
2. Write idempotent-friendly SQL:
   - `add column if not exists …`, `create index if not exists …`
   - New columns on existing tables need a `default` or must be nullable
   - Money columns: `integer` paise with `check (… >= 0)`
   - Status columns: `text` + `check (status in (...))`
   - New tables: `enable row level security` (we access data only with the secret key from the server)
3. Update the matching types in `lib/types.ts`.
4. Update any `lib/data/*` functions that select or insert the changed table.
5. Apply it. Use the CLI, NOT the MCP server (which is read-only on purpose):
   ```bash
   npx supabase db push      # needs: npx supabase link --project-ref <ref> (once)
   ```
   Ask the human to run this command. It changes the shared database.
6. Verify with the Supabase MCP: `list_tables` / a `select` on the new column.
7. If the seed script should populate it, update `scripts/seed.ts`.

## Checklist before committing
- [ ] New file only; no edits to old migrations
- [ ] `lib/types.ts` updated
- [ ] `npm run typecheck` passes
- [ ] Spec "Database changes" section matches what you wrote
