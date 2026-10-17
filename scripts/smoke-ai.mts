/**
 * One real OpenAI call with a fake order context. Proves OPENAI_API_KEY works before class.
 *   npm run smoke:ai
 */
import { buildTriageContext, triageMessage } from "../lib/triage";
import { verifiedCustomer } from "../tests/fixtures/customer";

const started = Date.now();
const context = buildTriageContext(verifiedCustomer(), new Date("2026-10-21T13:10:00+05:30"));
for (const body of ["bhai where is my dabba??", "pls skip tomorrow, WFH", "got veg instead of chicken. refund"]) {
  const t0 = Date.now();
  const result = await triageMessage(body, context);
  console.log(`\n> ${body}\n  [${result.category}${result.needs_human ? ", needs human" : ""}] ${result.reply}  (${Date.now() - t0} ms)`);
}
console.log(`\n✅ OpenAI API works (${Date.now() - started} ms total)\n`);
