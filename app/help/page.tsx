import { HelpChat } from "@/components/help-chat";
import { PageHeading } from "@/components/ui";

export const metadata = { title: "Help" };

export default async function HelpPage({ searchParams }: PageProps<"/help">) {
  const { q } = await searchParams;
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <PageHeading eyebrow="Customer help" title="Ask about your dabba">
        Instant answers about your order: where it is, skipping a day, or reporting a problem.
      </PageHeading>
      <HelpChat initialQuestion={typeof q === "string" ? q : ""} />
    </div>
  );
}
