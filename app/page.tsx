import { ArrowRight, Bike, CalendarX2, Clock3, LayoutDashboard, MessageCircle, ShieldCheck } from "lucide-react";
import { Badge, ButtonLink, Card } from "@/components/ui";

const steps = [
  {
    icon: MessageCircle,
    title: "Ask in your own words",
    body: "“Where’s my dabba?”, “skip tomorrow”, “roti missing”. Type it the way you'd WhatsApp us.",
  },
  {
    icon: ShieldCheck,
    title: "We check your real order",
    body: "Your phone + order ID unlock your order, rider and live ETA. Nobody else can see it.",
  },
  {
    icon: Clock3,
    title: "Answer in seconds",
    body: "Instant, correct replies. Tricky cases go straight to a human on our team.",
  },
];

export default function Home() {
  return (
    <>
      <section className="bg-dots">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div className="space-y-7">
            <Badge tone="brand">
              <Bike className="size-3.5" /> 1,500 dabbas delivered daily across Bengaluru
            </Badge>
            <h1 className="text-5xl font-extrabold leading-[1.02] sm:text-6xl">
              “Where’s my dabba?”
              <span className="block text-brand">Answered in seconds.</span>
            </h1>
            <p className="max-w-xl text-lg text-muted">
              DabbaDesk checks your live order, rider and ETA, and replies instantly. Skip a day, report a
              problem, or just ask. No waiting on WhatsApp for hours.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/help">
                Ask about my order <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink href="/dashboard" variant="secondary">
                <LayoutDashboard className="size-4" /> Owner dashboard
              </ButtonLink>
            </div>
          </div>

          <ChatPreview />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="p-6">
              <div className="mb-4 inline-flex size-11 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                <Icon className="size-5" />
              </div>
              <h3 className="mb-1.5 text-lg font-bold">{title}</h3>
              <p className="text-sm leading-relaxed text-muted">{body}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-5 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-leaf-soft text-leaf">
              <CalendarX2 className="size-5" />
            </div>
            <div>
              <h3 className="font-bold">Working from home tomorrow?</h3>
              <p className="text-sm text-muted">Skip before 9 pm the night before and we won’t cook it.</p>
            </div>
          </div>
          <ButtonLink href="/help?q=Please+skip+tomorrow" variant="secondary">
            Skip tomorrow
          </ButtonLink>
        </Card>
      </section>
    </>
  );
}

function ChatPreview() {
  return (
    <Card className="relative mx-auto w-full max-w-sm overflow-hidden p-0">
      <div className="flex items-center gap-3 border-b border-line bg-leaf px-5 py-4 text-white">
        <div className="flex size-9 items-center justify-center rounded-full bg-white/20 font-bold">D</div>
        <div>
          <p className="font-semibold leading-tight">Dabba Express</p>
          <p className="text-xs text-white/80">replies instantly</p>
        </div>
      </div>
      <div className="space-y-3 bg-chat p-5 text-sm">
        <p className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-tr-sm bg-chat-mine px-3.5 py-2 shadow-sm">
          bhai where is my dabba?? it&apos;s 1:15 😩
        </p>
        <div className="w-fit max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3.5 py-2 shadow-sm">
          <p>
            Hi Vivaan! Your <b>Rajma Chawal</b> (DX-10541) is out for delivery with <b>Prakash</b>. He&apos;s
            near Sony World Signal and should reach you by <b>1:22 pm</b>. 🛵
          </p>
          <p className="mt-1 text-right text-[11px] text-muted">1:15 pm · answered in 3s</p>
        </div>
        <p className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-tr-sm bg-chat-mine px-3.5 py-2 shadow-sm">
          also skip tomorrow, WFH
        </p>
        <div className="w-fit max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3.5 py-2 shadow-sm">
          <p>Done ✅ Tomorrow&apos;s dabba is skipped. You won&apos;t be charged.</p>
        </div>
      </div>
    </Card>
  );
}
