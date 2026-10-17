---
description: Commit, push, open a PR (Vercel posts a preview URL), squash-merge after checks pass, and clean up
allowed-tools: Read, Bash(git:*), Bash(gh:*), Bash(npm test:*), Bash(npm run lint:*), Bash(npm run typecheck:*)
---

## 0. Guard rails
- `git branch --show-current`. If on `main`, STOP: "Ship from a feature branch."
- Run `npm run typecheck && npm run lint && npm test`. If anything fails, STOP and show the failures.
- `gh auth status` must succeed. If not: "Run `! gh auth login` first."

## 1. Commit
Read `git diff`, `git diff --staged`, `git log main..HEAD --oneline` and the matching spec in `.claude/specs/`.
Conventional commit (`feat:` `fix:` `chore:` `docs:` `test:`), lowercase, no period, ≤ 72 chars, describing what the **user** can now do.
Good: `feat: owners can mark messages as resolved from the inbox`. Bad: `feat: update page.tsx`.
`git add -A && git commit -m "<message>"` → report `✓ Committed`

## 2. Push
`git push -u origin <branch>` → report `✓ Pushed`

## 3. Pull request
`gh pr create --base main --title "<plain English title>" --body "<body>"` where body is:
```
## What this does
<spec overview, 2–3 sentences>

## Changes
<one line per file>

## Definition of done
<spec checklist, items verified marked [x]>

## How to test
<steps on the Vercel preview URL, including a demo phone + order ID if relevant>
```
Report the PR URL. Mention that Vercel will comment with a **Preview URL** in about a minute.

## 4. Wait for checks
`gh pr checks --watch` (CI: lint, typecheck, tests; plus Vercel). If a check fails, STOP and show it. Never merge red.

## 5. Merge and clean up
```
gh pr merge --squash --delete-branch
git switch main && git pull --ff-only
```
Report: `✓ Merged. Production deploy starting on Vercel.`

## Summary
```
/ship-feature complete
✓ Committed  <message>
✓ PR         <url>
✓ Checks     green
✓ Merged     → production
Next: /create-spec <next step>
```
