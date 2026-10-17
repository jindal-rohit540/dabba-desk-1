import Link from "next/link";

type Tone = "brand" | "leaf" | "sky" | "warn" | "danger" | "neutral";

const toneClasses: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand-dark",
  leaf: "bg-leaf-soft text-leaf",
  sky: "bg-sky-soft text-sky",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-line/60 text-muted",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-[var(--radius-card)] border border-line bg-card shadow-card ${className}`}>
      {children}
    </div>
  );
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60";

export const buttonStyles = {
  primary: `${buttonBase} bg-brand text-white hover:bg-brand-dark`,
  secondary: `${buttonBase} border border-line bg-card text-ink hover:border-brand/40 hover:bg-brand-soft`,
  ghost: `${buttonBase} text-muted hover:bg-brand-soft hover:text-ink`,
};

export function ButtonLink({
  href,
  variant = "primary",
  children,
}: {
  href: string;
  variant?: keyof typeof buttonStyles;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={buttonStyles[variant]}>
      {children}
    </Link>
  );
}

export function PageHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">{eyebrow}</p>
      )}
      <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
      {children && <p className="max-w-2xl text-muted">{children}</p>}
    </div>
  );
}
