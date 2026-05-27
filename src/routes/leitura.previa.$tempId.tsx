import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Moon, Lock, ArrowRight } from "lucide-react";
import { getPreview } from "@/lib/tarot.functions";
import { CosmicBg } from "@/components/cosmic-bg";
import { TarotCard } from "@/components/tarot-card";

export const Route = createFileRoute("/leitura/previa/$tempId")({
  component: PreviaPage,
});

function PreviaPage() {
  const { tempId } = Route.useParams();
  const nav = useNavigate();
  const fetchPreview = useServerFn(getPreview);

  const { data, isLoading, error } = useQuery({
    queryKey: ["preview", tempId],
    queryFn: () => fetchPreview({ data: { id: tempId } }),
  });

  return (
    <main className="relative min-h-screen overflow-hidden">
      <CosmicBg />
      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <Link to="/" className="flex items-center gap-2 font-serif text-xl text-gold glow-gold">
          <Moon className="h-5 w-5" /> Mystic Tarot
        </Link>
      </nav>

      <div className="mx-auto max-w-5xl px-6 pb-24 text-center">
        {isLoading && (
          <p className="mt-20 text-muted-foreground">As cartas estão se revelando...</p>
        )}
        {error && (
          <p className="mt-20 text-destructive">Não foi possível carregar sua prévia.</p>
        )}

        {data && (
          <>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card/40 px-4 py-1.5 text-[11px] uppercase tracking-[0.3em] text-gold backdrop-blur">
              <Sparkles className="h-3 w-3" /> Sua prévia
            </span>
            <h1 className="mt-6 font-serif text-4xl text-foreground md:text-6xl">
              O oráculo <span className="shimmer-gold">tem algo</span> a dizer.
            </h1>

            {data.summary && (
              <p className="mx-auto mt-6 max-w-2xl font-serif text-xl leading-relaxed text-foreground/90">
                "{data.summary}"
              </p>
            )}

            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {data.cards.map((c, i) => (
                <div
                  key={c.position}
                  className="float"
                  style={{ animationDelay: `${-i * 1.5}s` }}
                >
                  <TarotCard
                    name={c.name}
                    imageUrl={c.image_url}
                    reversed={c.reversed}
                    label={`Carta ${c.position}`}
                  />
                </div>
              ))}
            </div>

            {/* CTA Desbloqueio */}
            <section className="tarot-frame relative mt-20 overflow-hidden bg-card/50 p-8 backdrop-blur md:p-12">
              <div
                className="absolute inset-0 -z-10 opacity-40"
                style={{ background: "var(--gradient-aurora)", filter: "blur(60px)" }}
              />
              <Lock className="mx-auto h-6 w-6 text-gold" />
              <h2 className="mt-3 font-serif text-3xl text-gold glow-gold md:text-4xl">
                Quer a leitura completa?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Veja as 10 cartas da Cruz Celta, interpretação personalizada de cada posição
                e a síntese para cada área da sua vida.
              </p>
              <button
                onClick={() => nav({ to: "/leitura/checkout/$tempId", params: { tempId } })}
                className="bg-gold mt-6 inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-medium shadow-aurora transition hover:scale-105"
              >
                Desbloquear leitura completa <ArrowRight className="h-4 w-4" />
              </button>
              <p className="mt-3 text-xs text-muted-foreground">R$ 19 · pagamento único</p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}