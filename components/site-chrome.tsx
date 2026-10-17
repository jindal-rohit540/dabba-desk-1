import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteHeader({ right }: { right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="DabbaDesk home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium sm:gap-2">
          <Link href="/help" className="rounded-full px-3 py-2 text-muted hover:bg-brand-soft hover:text-ink">
            Help
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full px-3 py-2 text-muted hover:bg-brand-soft hover:text-ink"
          >
            Dashboard
          </Link>
          {right}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© Dabba Express, Bengaluru · Home-style lunch, on time.</p>
        <p>Dabba Express is fictional, built live with Claude Code.</p>
      </div>
    </footer>
  );
}
