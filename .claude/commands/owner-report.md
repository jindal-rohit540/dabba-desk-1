---
description: Today's support metrics from the LIVE database, written as a WhatsApp update for the owner
---

1. Use the **dabba-data-analyst** subagent (Supabase MCP, read-only) to compute for **today in IST**:
   - Messages received, by category
   - % handled without a human (`handled_by='ai' and needs_human=false`)
   - Median `response_ms` for AI replies today vs median for human replies in the history (the "before" number)
   - Refund requests today: count and total ₹, and any refund larger than its order (flag!)
   - Orders today by status; orders still `out_for_delivery` more than 45 min after ETA
2. Pass the numbers to the **owner-explainer** subagent to write the WhatsApp message for Meera.
3. Print the numbers table, then the message in a code block ready to paste.

If the Supabase MCP server isn't connected, say: "Run /mcp and authenticate the supabase server first."
