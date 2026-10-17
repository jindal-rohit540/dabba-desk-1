import { PageHeading } from "@/components/ui";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeading eyebrow="Owner" title="Dashboard">
        Coming soon: what&apos;s coming in, what was handled, what needs a human.
      </PageHeading>
    </div>
  );
}
