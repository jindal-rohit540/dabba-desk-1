export function LogoMark({ className = "size-9" }: { className?: string }) {
  // A stacked tiffin: three tiers and a handle.
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="12" className="fill-brand" />
      <path d="M14 11.5c0-3 12-3 12 0" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="10" y="13" width="20" height="5.5" rx="2" fill="white" />
      <rect x="10" y="20" width="20" height="5.5" rx="2" fill="white" opacity="0.85" />
      <rect x="10" y="27" width="20" height="5.5" rx="2" fill="white" opacity="0.7" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="leading-tight">
        <span className="block font-display text-lg font-bold tracking-tight">DabbaDesk</span>
        <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          by Dabba Express
        </span>
      </span>
    </span>
  );
}
