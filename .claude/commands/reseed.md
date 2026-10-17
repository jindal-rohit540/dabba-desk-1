---
description: Wipe and reload the demo data from data/raw/*.csv (moves dates so the data's "today" is real today)
allowed-tools: Bash(npm run db:seed:*)
---

This deletes ALL rows in the connected Supabase project and reloads the demo CSVs.

Ask the user to confirm: "This wipes the database for the project in .env.local. Type yes to continue."
Only after an explicit yes, run: `npm run db:seed -- --reset`
Then show the cleaning report and the demo customer line from the output.
