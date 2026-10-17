---
description: Create a feature branch and a spec file for the next DabbaDesk feature
argument-hint: "<step-number> <feature name>  e.g. 03 owner dashboard"
allowed-tools: Read, Write, Glob, Grep, Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(git pull:*), Bash(git switch:*)
---

You are a senior engineer starting a new DabbaDesk feature. Follow CLAUDE.md.

User input: $ARGUMENTS

## 1. Clean working tree
Run `git status --porcelain`. If anything is uncommitted, STOP and tell the user to commit or stash first.

## 2. Parse arguments
- `step`: zero-padded 2 digits (3 → 03)
- `title`: Title Case
- `slug`: kebab-case, a–z 0–9 and -, max 40 chars
- `branch`: `feature/<slug>` (append -2, -3… if it already exists)
If you can't infer these, ask.

## 3. Branch
```
git switch main && git pull --ff-only origin main   # skip pull if there is no remote yet
git switch -c <branch>
```

## 4. Research before writing
- If a pre-written spec exists in `../00-instructor-kit/spec-bank/<step>-*.md`, read it and use it as the starting point.
- Read `CLAUDE.md`, `docs/PRD.md`, `supabase/migrations/`, `lib/types.ts`, and every file in `.claude/specs/` (avoid duplicates; respect dependencies).
- Use the Explore subagent for anything else you need to understand.

## 5. Write `.claude/specs/<step>-<slug>.md` with EXACTLY these sections
# Spec: <title>
## Overview: one paragraph: what and why (in business terms, tie to the PRD)
## Depends on: previous specs required
## User stories: "As a <customer|owner>, I want … so that …"
## Routes / entry points: `METHOD /path`, page, Server Action or Route Handler, with access level (public | owner | partner | cron)
## Database changes: new migration file name + SQL summary, or "None"
## Files to create / Files to change: one line each
## Business rules: numbered, testable (cut-offs, caps, who may see what)
## Rules for implementation: always include:
  - DB access only via `lib/data/*`; no Supabase in components
  - Money in integer paise; IST via `lib/time.ts`
  - zod on all external input; no `any`
  - No new dependencies unless listed in this spec
  - Phone numbers / addresses never sent to Claude
## Tests to write: table of function/route → input → expected (the test writer works ONLY from this)
## Definition of done: checklist, each item verifiable in the running app or by a test

## 6. Report
```
Branch:    <branch>
Spec file: .claude/specs/<step>-<slug>.md
```
Then say: "Review the spec, then Shift+Tab into Plan mode and say: implement @.claude/specs/<step>-<slug>.md"
Do not print the whole spec unless asked.
