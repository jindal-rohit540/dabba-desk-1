import "server-only";
import { findDataIssues, type Issue } from "@/lib/data-checks";
import { db } from "@/lib/supabase/server";
import { addDays, istDate } from "@/lib/time";

export type DataCheckRun = { id: number; ran_at: string; issue_count: number; issues: Issue[] };

/** Checks the last 7 days of orders plus all refunds, and stores the run. */
export async function runDataCheck(now = new Date()): Promise<DataCheckRun> {
  const sb = db();
  const since = addDays(istDate(now), -7);
  const [{ data: orders, error: e1 }, { data: refunds, error: e2 }] = await Promise.all([
    sb.from("orders").select("id, status, eta, delivered_at, amount_paise").gte("delivery_date", since),
    sb.from("refunds").select("order_id, amount_paise, status").gte("created_at", `${since}T00:00:00+05:30`),
  ]);
  if (e1 || e2) throw new Error((e1 ?? e2)!.message);

  const issues = findDataIssues({ orders: orders ?? [], refunds: refunds ?? [], now });
  const { data, error } = await sb
    .from("data_check_runs")
    .insert({ issue_count: issues.length, issues })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as DataCheckRun;
}

export async function latestDataCheck(): Promise<DataCheckRun | null> {
  const { data } = await db()
    .from("data_check_runs")
    .select("*")
    .order("ran_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as DataCheckRun) ?? null;
}
