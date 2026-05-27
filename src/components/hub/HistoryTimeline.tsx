import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Lock, CheckCircle2, Sparkles, Search, Star } from "lucide-react";
import { MiniCardStack } from "./MiniCardStack";

export type TimelineItem = {
  id: string;
  kind: "tarot" | "astral";
  created_at: string;
  title: string;
  summary: string | null;
  thumbnails: Array<{ image_url: string; reversed: boolean; name?: string }>;
  is_unlocked: boolean;
};

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} · ${d.getFullYear()}`;
}

export function HistoryTimeline({ items }: { items: TimelineItem[] }) {
  const [filter, setFilter] = useState<"all" | "tarot" | "astral">("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (filter !== "all" && it.kind !== filter) return false;
      if (q.trim()) {
        const needle = q.toLowerCase();
        const hay = `${it.title} ${it.summary ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [items, filter, q]);

  const grouped = useMemo(() => {
    const map = new Map<string, TimelineItem[]>();
    for (const it of filtered) {
      const k = monthKey(it.created_at);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(it);
    }
    return Array.from(map.entries());
  }, [filtered]);

  if (items.length === 0) {
    return (
      <div className="tarot-frame mt-6 flex flex-col items-center gap-4 bg-card/30 p-12 text-center backdrop-blur">
        <Star className="h-10 w-10 text-gold opacity-60" strokeWidth={1} />
        <div>
          <p className="font-serif text-xl text-foreground">Seu altar ainda está em silêncio</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Tire sua primeira leitura e ela aparecerá aqui, eternizada na sua jornada.
          </p>
        </div>
        <Link
          to="/leitura/nova"
          className="bg-gold inline-flex items-center gap-2 rounded-full px-6 py-3 font-medium shadow-gold transition hover:scale-105"
        >
          <Sparkles className="h-4 w-4" /> Fazer minha primeira tiragem
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", "tarot", "astral"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={`rounded-full border px-4 py-1.5 text-xs uppercase tracking-widest transition ${
                filter === k
                  ? "border-gold/70 bg-gold/10 text-gold shadow-gold"
                  : "border-border/50 bg-card/30 text-muted-foreground hover:border-gold/40 hover:text-foreground"
              }`}
            >
              {k === "all" ? "Tudo" : k === "tarot" ? "Tarô" : "Mapa Astral"}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar no histórico..."
            className="w-full rounded-full border border-border/50 bg-card/30 py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground/70 backdrop-blur focus:border-gold/60 focus:outline-none sm:w-72"
          />
        </div>
      </div>

      <div className="relative mt-8 pl-6 sm:pl-10">
        <div
          aria-hidden
          className="absolute bottom-2 left-2 top-2 w-px sm:left-4"
          style={{
            background:
              "linear-gradient(to bottom, transparent, oklch(0.78 0.14 75 / 0.45) 10%, oklch(0.55 0.18 300 / 0.55) 50%, oklch(0.78 0.14 75 / 0.45) 90%, transparent)",
          }}
        />
        {grouped.map(([month, list]) => (
          <section key={month} className="mb-10">
            <div className="relative mb-4">
              <span
                aria-hidden
                className="absolute -left-[26px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-gold shadow-gold sm:-left-[34px]"
              />
              <h3 className="font-serif text-xs uppercase tracking-[0.3em] text-gold/90">
                {month}
              </h3>
            </div>
            <ul className="space-y-4">
              {list.map((it) => (
                <li key={`${it.kind}-${it.id}`} className="relative">
                  <span
                    aria-hidden
                    className="absolute -left-[22px] top-7 h-2 w-2 rounded-full border border-gold/70 bg-cosmos sm:-left-[30px]"
                  />
                  <Link
                    to={it.kind === "tarot" ? "/leitura/$id" : "/mapa-astral/$id"}
                    params={{ id: it.id }}
                    className="tarot-frame group flex items-stretch gap-4 bg-card/30 p-4 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-aurora sm:p-5"
                  >
                    <div className="hidden flex-shrink-0 items-center sm:flex">
                      {it.kind === "tarot" ? (
                        <MiniCardStack cards={it.thumbnails} size={48} />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-mystic/40 bg-mystic/10">
                          <Star className="h-8 w-8 text-mystic" strokeWidth={1.2} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                        <span>
                          {new Date(it.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "long",
                          })}
                          {" · "}
                          {it.kind === "tarot" ? "Tarô" : "Mapa Astral"}
                        </span>
                        {it.kind === "tarot" && (
                          it.is_unlocked ? (
                            <span className="flex items-center gap-1 text-gold">
                              <CheckCircle2 className="h-3 w-3" /> Completa
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Lock className="h-3 w-3" /> Preview
                            </span>
                          )
                        )}
                      </div>
                      <p className="mt-2 font-serif text-lg text-foreground">{it.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {it.summary || "Leitura em preparo..."}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {grouped.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nada encontrado com esse filtro.
          </p>
        )}
      </div>
    </div>
  );
}