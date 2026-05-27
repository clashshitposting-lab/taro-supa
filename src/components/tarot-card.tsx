import { Sparkles } from "lucide-react";

interface TarotCardProps {
  name?: string;
  imageUrl?: string;
  reversed?: boolean;
  label?: string;
  faceDown?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function TarotCard({ name, imageUrl, reversed, label, faceDown, className, style }: TarotCardProps) {
  return (
    <div className={`group relative ${className ?? ""}`} style={style}>
      {label && (
        <div className="mb-2 text-center text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          {label}
        </div>
      )}
      <div className="tarot-frame relative mx-auto aspect-[2/3] w-full max-w-[200px] overflow-hidden bg-card/50 backdrop-blur transition-transform duration-500 group-hover:-translate-y-1">
        {faceDown ? (
          <div className="card-back flex h-full w-full items-center justify-center">
            <svg viewBox="0 0 100 100" className="h-16 w-16 text-gold opacity-90">
              <g fill="none" stroke="currentColor" strokeWidth="1">
                <circle cx="50" cy="50" r="34" />
                <circle cx="50" cy="50" r="22" />
                <polygon points="50,16 56,44 84,50 56,56 50,84 44,56 16,50 44,44" fill="currentColor" opacity="0.85" />
              </g>
            </svg>
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={name ?? "Carta"}
            loading="lazy"
            className={`h-full w-full object-cover ${reversed ? "rotate-180" : ""}`}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Sparkles className="h-10 w-10 text-gold/60" />
          </div>
        )}
      </div>
      {name && (
        <div className="mt-3 text-center font-serif text-base text-foreground">
          {name}
          {reversed && <span className="ml-1 text-[10px] uppercase tracking-widest text-muted-foreground">invertida</span>}
        </div>
      )}
    </div>
  );
}