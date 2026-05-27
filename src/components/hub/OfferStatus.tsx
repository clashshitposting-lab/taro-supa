import { Link } from "@tanstack/react-router";
import { Sparkles, Clock, Gift } from "lucide-react";

interface Entitlement {
  kind: string;
  total_remaining: number | null;
  daily_quota: number | null;
  available_today: boolean;
  next_available_at: string | null;
  expires_at: string | null;
}

function hoursUntil(iso: string | null) {
  if (!iso) return null;
  const ms = +new Date(iso) - Date.now();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3_600_000);
  return h < 1 ? "menos de 1h" : `${h}h`;
}

export function OfferStatus({ entitlements }: { entitlements: Entitlement[] }) {
  const tarot = entitlements.find((e) => e.kind === "tarot_daily");
  const astral = entitlements.find((e) => e.kind === "astral_chart");
  const hasAny = !!(tarot || astral);

  if (!hasAny) {
    return (
      <Link
        to="/oferta"
        className="tarot-frame group flex items-center gap-4 bg-card/40 p-5 backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-gold"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold text-gold-foreground shadow-gold">
          <Gift className="h-6 w-6" strokeWidth={1.4} />
        </div>
        <div className="flex-1">
          <p className="font-serif text-lg text-foreground">Desperte sua jornada</p>
          <p className="text-xs text-muted-foreground">
            7 leituras de tarô + 1 mapa astral por R$ 49 — comece agora.
          </p>
        </div>
        <span className="hidden text-xs uppercase tracking-widest text-gold sm:inline">
          Ver oferta →
        </span>
      </Link>
    );
  }

  return (
    <div className="tarot-frame flex flex-col gap-3 bg-card/40 p-5 backdrop-blur sm:flex-row sm:items-center sm:gap-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold text-gold-foreground shadow-gold">
        <Sparkles className="h-6 w-6" strokeWidth={1.4} />
      </div>
      <div className="flex-1">
        <p className="font-serif text-lg text-foreground">Pacote Despertar ativo</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {tarot && (
            <span className="flex items-center gap-1.5">
              <span className="text-gold">●</span>
              {tarot.total_remaining ?? "—"} leituras de tarô restantes
              {tarot.daily_quota != null && !tarot.available_today && tarot.next_available_at && (
                <span className="inline-flex items-center gap-1 text-muted-foreground/80">
                  <Clock className="h-3 w-3" /> próxima em {hoursUntil(tarot.next_available_at) ?? "breve"}
                </span>
              )}
              {tarot.available_today && (
                <span className="text-gold">· disponível hoje</span>
              )}
            </span>
          )}
          {astral && (
            <span className="flex items-center gap-1.5">
              <span className="text-mystic">●</span>
              {astral.total_remaining ?? "—"} mapa astral
              {astral.available_today ? " disponível" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}