import { PageHeading } from "@/components/ui";

export const metadata = { title: "Help" };

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageHeading eyebrow="Customer help" title="Ask about your dabba">
        Coming soon: instant answers about your order.
      </PageHeading>
    </div>
  );
}
