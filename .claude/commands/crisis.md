---
description: Incident playbook. Reproduce → regression test → fix → ship → explain to the owner.
argument-hint: "<what the owner/customers are seeing>"
---

🚨 Incident: **$ARGUMENTS**

Work through these steps in order and announce each one. Speed matters, but so does being right.

1. **Triage (2 min).** Use the dabba-data-analyst subagent to measure the impact in live data: how many customers, how much money, since when. State a one-line hypothesis.
2. **Locate.** Use the Explore subagent to find the code path. Check `git log -p --since="3 days ago"` for recent changes in that area. Recent merges are the usual suspect.
3. **Reproduce with a failing test** in `tests/` that encodes the correct business rule. Run it. It must fail for the right reason.
4. **Fix** with the smallest change that makes the test pass. Run the full suite.
5. **Branch + ship**: `git switch -c fix/<slug>`, then follow /ship-feature.
6. **Clean up data**: if bad rows were written (e.g. wrong refund amounts), write the corrective SQL as a NEW migration or a script for the human to run. Never edit data silently.
7. **Explain**: ask the owner-explainer subagent for the WhatsApp message to Meera.

Finish with a 5-line incident note: what happened, impact, root cause, fix, prevention.
