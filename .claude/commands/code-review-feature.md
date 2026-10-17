---
description: Parallel security + quality review of the current feature branch, merged into one action plan
argument-hint: "<spec-name>  e.g. 03-owner-dashboard"
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Bash(git log:*), Bash(git status:*)
---

Code review for **$ARGUMENTS**.

## Pre-flight
1. Usage check: argument required; `.claude/specs/$ARGUMENTS.md` must exist.
2. Collect the diff: `git diff main...HEAD` plus `git diff` (uncommitted). If both are empty, stop: "No changes to review."

## Step 1: launch BOTH reviewers in the SAME message (parallel)
- **dabba-security-reviewer**: diff + spec path. Security/privacy only.
- **dabba-quality-reviewer**: diff + spec path. Quality only.

## Step 2: unified report
De-duplicate overlapping findings (merge into one item showing both perspectives).
```
Code Review: $ARGUMENTS
Security: <summary>
Quality: <summary>

Action plan (ordered)
1. 🔴 security must-fix …
2. 💡 quality changes requested …
3. 🟡 security should-fix …
4. 🌱 polish …

Overall: APPROVED | APPROVED WITH SUGGESTIONS | CHANGES REQUESTED
```

## Step 3: ask
"Do you want me to implement the action plan now?" Do not edit any file until the user says yes.
If either reviewer failed or returned nothing, say so. Never present a partial review as complete.
