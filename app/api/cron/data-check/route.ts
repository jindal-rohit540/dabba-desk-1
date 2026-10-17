import { NextResponse } from "next/server";
import { runDataCheck } from "@/lib/data/data-checks";
import { secretsMatch } from "@/lib/secrets";

export const dynamic = "force-dynamic";

// Called nightly by Vercel Cron (vercel.json). Vercel sends "Authorization: Bearer $CRON_SECRET".
export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!secretsMatch(token, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const run = await runDataCheck();
  return NextResponse.json(run);
}
