import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  to?: string;
  badge?: { label: string; tone: "gold" | "muted" | "mystic" };
  disabled?: boolean;
  onClick?: () => void;
}

export function ModuleCard({ icon: Icon, title, description, to, badge, disabled, onClick }: Props) {
  const inner = (
    <div
      className={`tarot-frame group relative flex h-full flex-col gap-4 bg-card/40 p-6 backdrop-blur transition-all duration-500 ${
        disabled ? "opacity-60" : "hover:-translate-y-1 hover:shadow-aurora"
      }`}
    >
      {badge && (
        <span
          className={`absolute right-4 top-4 rounded-full px-3 py-1 text-[10px] uppercase tracking-widest ${
            badge.tone === "gold"
              ? "bg-gold text-gold-foreground shadow-gold"
              : badge.tone === "mystic"
              ? "border border-mystic/40 bg-mystic/20 text-foreground"
              : "border border-border/50 bg-muted/40 text-muted-foreground"
          }`}
        >
          {badge.label}
        </span>
      )}
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 bg-cosmos/40 text-gold shadow-gold">
        <Icon className="h-6 w-6" strokeWidth={1.4} />
      </div>
      <div>
        <h3 className="font-serif text-2xl text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {!disabled && (
        <div className="mt-auto pt-2 text-xs uppercase tracking-[0.25em] text-gold/80">
          Abrir →
        </div>
      )}
    </div>
  );

  if (disabled) return <div>{inner}</div>;
  if (to) {
    return (
      <Link to={to} className="block h-full">
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className="block h-full w-full text-left">
      {inner}
    </button>
  );
}