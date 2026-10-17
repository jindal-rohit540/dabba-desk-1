import { auth } from "@clerk/nextjs/server";
import { Bot, Clock3, HandCoins, MessagesSquare } from "lucide-react";
import { DataHealth } from "@/components/dashboard/data-health";
import { Deliveries } from "@/components/dashboard/deliveries";
import { Inbox } from "@/components/dashboard/inbox";
import { KpiTile } from "@/components/dashboard/kpi-tile";
import { RefundsQueue } from "@/components/dashboard/refunds-queue";
import { PageHeading } from "@/components/ui";
import { getKpis, listMessages, listRefunds, listTodaysDeliveries } from "@/lib/data/dashboard";
import { latestDataCheck } from "@/lib/data/data-checks";
import { formatDuration } from "@/lib/format";
import { formatDayIST, istDate } from "@/lib/time";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  await auth.protect(); // signed-out visitors are sent to /sign-in

  const view = (await searchParams).view === "human" ? "human" : "all";
  const [kpis, messages, refunds, deliveries, dataCheck] = await Promise.all([
    getKpis(),
    listMessages({ needsHumanOnly: view === "human" }),
    listRefunds(),
    listTodaysDeliveries(),
    latestDataCheck(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <PageHeading eyebrow={`Owner dashboard · ${formatDayIST(istDate())}`} title="Namaste, Meera 👋">
        What&apos;s coming in, what DabbaDesk handled, and what needs a person.
      </PageHeading>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          icon={MessagesSquare}
          label="Messages today"
          value={String(kpis.messagesToday)}
          hint={
            Object.entries(kpis.byCategory)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 2)
              .map(([k, v]) => `${v} ${k.replace("_", " ")}`)
              .join(" · ") || "No messages yet today"
          }
        />
        <KpiTile
          icon={Bot}
          label="Handled by DabbaDesk"
          value={`${Math.round(kpis.autoHandledRate * 100)}%`}
          hint="no human needed"
          tone="leaf"
        />
        <KpiTile
          icon={Clock3}
          label="Median reply time"
          value={kpis.medianReplyMsNow != null ? formatDuration(kpis.medianReplyMsNow) : "-"}
          hint={
            kpis.medianReplyMsBefore != null
              ? `was ${formatDuration(kpis.medianReplyMsBefore)} before DabbaDesk`
              : undefined
          }
          tone="leaf"
        />
        <KpiTile
          icon={HandCoins}
          label="Needs a person"
          value={String(kpis.needsHuman)}
          hint={`${kpis.pendingRefunds} refund${kpis.pendingRefunds === 1 ? "" : "s"} to approve`}
          tone={kpis.needsHuman + kpis.pendingRefunds > 0 ? "warn" : "muted"}
        />
      </section>

      <section className="grid items-start gap-5 lg:grid-cols-[1fr_380px]">
        <Inbox messages={messages} view={view} />
        <div className="space-y-5">
          <DataHealth run={dataCheck} />
          <RefundsQueue refunds={refunds} />
          <Deliveries orders={deliveries} />
        </div>
      </section>
    </div>
  );
}
