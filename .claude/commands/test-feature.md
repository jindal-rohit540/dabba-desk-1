---
description: Write tests from the spec (test-writer subagent), then run and diagnose them (test-runner subagent)
argument-hint: "<spec-name>  e.g. 03-owner-dashboard"
---

Testing pipeline for **$ARGUMENTS**.

If no argument: stop and print `Usage: /test-feature <spec-name>`.
If `.claude/specs/$ARGUMENTS.md` doesn't exist: stop and list the specs that do exist.

## Step 1: write (sequential)
Invoke the **dabba-test-writer** subagent with:
- Spec: `.claude/specs/$ARGUMENTS.md` (the ONLY source of expected behaviour)
- Output: `tests/<area>.test.ts` (choose a clear area name)
- Instruction: cover every row in "Tests to write" plus business rules; use dependency injection and fakes, never real Supabase or Claude.

Wait until it reports the file(s) written. If it couldn't write tests, stop and report why.

## Step 2: run
Invoke the **dabba-test-runner** subagent with the file(s) from step 1 and the spec path.

## Rules
- Do NOT fix any source code in this command, even if tests fail. Report only.
- Do NOT run the full suite.

## Final output
```
Testing Pipeline: $ARGUMENTS
Tests written: <list: test → spec rule>
Results: <runner summary table>
Verdict: ✅ ready for /code-review-feature | ❌ needs fixes (<failing tests + root causes>)
```
