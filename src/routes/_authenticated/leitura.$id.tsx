import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, ArrowLeft, Moon, Heart, Sun, Star } from "lucide-react";
import { getReading, unlockReading } from "@/lib/tarot.functions";
import { CosmicBg } from "@/components/cosmic-bg";
import { TarotCard } from "@/components/tarot-card";

export const Route = createFileRoute("/_authenticated/leitura/$id")({
  component: LeituraPage,
});

function LeituraPage() {
  const { id } = Route.useParams();
  const fetchReading = useServerFn(getReading);
  const unlock = useServerFn(unlockReading);
  const qc = useQueryClient();
  const [unlocking, setUnlocking] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["reading", id],
    queryFn: () => fetchReading({ data: { id } }),
  });

  const doUnlock = async () => {
    setUnlocking(true);
    try {
      await unlock({ data: { id } });
      await qc.invalidateQueries({ queryKey: ["reading", id] });
      await qc.invalidateQueries({ queryKey: ["readings"] });
      toast.success("Leitura completa desbloqueada ✨");
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível desbloquear.");
    } finally {
      setUnlocking(false);
    }
  };

  if (isLoading || !data) {
    return (
      <main className="relative min-h-screen overflow-hidden">
        <CosmicBg />
        <p className="mx-auto max-w-4xl px-6 pt-20 text-center text-muted-foreground">
          As cartas estão sendo lidas...
        </p>
      </main>
    );
  }

  const full = data.full_interpretation as any;
  const synthesisIcons = {
    pessoal: Moon,
    relacionamento: Heart,
    trabalho: Sun,
    espiritualidade: Star,
  } as const;

  return (
    <main className="relative min-h-screen overflow-hidden">
      <CosmicBg />

      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <Link to="/" className="flex items-center gap-2 font-serif text-xl text-gold glow-gold">
          <Moon className="h-5 w-5" /> Mystic Tarot
        </Link>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
      </nav>

      <div className="mx-auto max-w-5xl px-6 pb-24">
        {/* Header */}
        <header className="text-center">
          <span className="text-[11px] uppercase tracking-[0.3em] text-gold">
            {new Date(data.created_at).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </span>
          <h1 className="mt-3 font-serif text-5xl text-foreground md:text-6xl">
            Sua <span className="shimmer-gold">leitura</span>
          </h1>
          {data.summary && (
            <div className="tarot-frame relative mx-auto mt-8 max-w-2xl overflow-hidden bg-card/50 p-6 backdrop-blur md:p-8">
              <div
                className="absolute inset-0 -z-10 opacity-30"
                style={{ background: "var(--gradient-aurora)", filter: "blur(70px)" }}
              />
              <p className="font-serif text-lg italic leading-relaxed text-foreground/90 md:text-xl">
                "{data.summary}"
              </p>
            </div>
          )}
        </header>

        {/* Loading fallback se ainda não desbloqueou */}
        {!data.is_unlocked && (
          <section className="tarot-frame mt-16 bg-card/40 p-8 text-center backdrop-blur">
            <Sparkles className="mx-auto h-6 w-6 animate-pulse text-gold" />
            <h2 className="mt-3 font-serif text-2xl text-gold glow-gold">
              Preparando sua leitura completa
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              O oráculo está interpretando suas cartas. Se a página não atualizar sozinha em alguns
              segundos, clique abaixo.
            </p>
            <button
              onClick={doUnlock}
              disabled={unlocking}
              className="bg-gold mt-6 inline-flex items-center gap-2 rounded-full px-8 py-3 font-medium shadow-aurora transition hover:scale-105 disabled:opacity-60"
            >
              {unlocking ? "Consultando o oráculo..." : "Revelar leitura"}
            </button>
          </section>
        )}

        {/* Abertura */}
        {data.is_unlocked && full?.opening && (
          <section className="mt-20 text-center">
            <Ornament />
            <p className="mx-auto mt-6 max-w-3xl font-serif text-xl leading-relaxed text-foreground/90 md:text-2xl">
              {full.opening}
            </p>
            <Ornament />
          </section>
        )}

        {/* Carta a carta */}
        {data.is_unlocked && full?.cards && (
          <section className="mt-20">
            <header className="text-center">
              <span className="text-[11px] uppercase tracking-[0.3em] text-gold">Cruz Celta</span>
              <h2 className="mt-2 font-serif text-3xl text-foreground md:text-4xl">
                Carta a carta
              </h2>
            </header>

            <div className="mt-12 space-y-16">
              {full.cards.map((cInterp: any, i: number) => {
                const card = data.cards.find((x: any) => x.position === cInterp.position);
                const reverse = i % 2 === 1;
                return (
                  <article
                    key={cInterp.position}
                    className={`grid items-center gap-8 md:grid-cols-[260px_1fr] ${
                      reverse ? "md:[&>*:first-child]:order-2" : ""
                    }`}
                  >
                    <div className="float mx-auto" style={{ animationDelay: `${-i * 1.2}s` }}>
                      <TarotCard
                        name={card?.name}
                        imageUrl={card?.image_url}
                        reversed={card?.reversed}
                        label={`Carta ${cInterp.position}`}
                      />
                    </div>

                    <div className="tarot-frame relative overflow-hidden bg-card/40 p-6 backdrop-blur md:p-8">
                      <div
                        className="absolute inset-0 -z-10 opacity-20"
                        style={{ background: "var(--gradient-aurora)", filter: "blur(80px)" }}
                      />
                      <span className="text-[11px] uppercase tracking-[0.3em] text-gold">
                        Posição {cInterp.position} ·{" "}
                        {card?.position_label ?? ""}
                      </span>
                      <h3 className="mt-2 font-serif text-2xl text-foreground md:text-3xl">
                        {cInterp.title}
                      </h3>
                      <p className="mt-4 font-serif text-base leading-relaxed text-foreground/85 md:text-lg">
                        {cInterp.interpretation}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Síntese por área */}
        {data.is_unlocked && full?.synthesis && (
          <section className="mt-24">
            <Ornament />
            <header className="mt-6 text-center">
              <span className="text-[11px] uppercase tracking-[0.3em] text-gold">Visão geral</span>
              <h2 className="mt-2 font-serif text-3xl text-foreground md:text-4xl">
                Síntese por <span className="shimmer-gold">área</span>
              </h2>
            </header>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {(
                [
                  ["pessoal", "Vida pessoal"],
                  ["relacionamento", "Relacionamento"],
                  ["trabalho", "Trabalho"],
                  ["espiritualidade", "Espiritualidade"],
                ] as const
              ).map(([key, label]) => {
                const Icon = synthesisIcons[key];
                return (
                  <div
                    key={key}
                    className="tarot-frame relative overflow-hidden bg-card/40 p-6 backdrop-blur md:p-8"
                  >
                    <div
                      className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-25"
                      style={{ background: "var(--gradient-aurora)", filter: "blur(50px)" }}
                    />
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 bg-background/40">
                        <Icon className="h-5 w-5 text-gold" strokeWidth={1.4} />
                      </div>
                      <h3 className="font-serif text-xl text-gold glow-gold">{label}</h3>
                    </div>
                    <p className="mt-4 font-serif text-base leading-relaxed text-foreground/85">
                      {full.synthesis[key]}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Closing */}
        {data.is_unlocked && full?.closing && (
          <section className="tarot-frame relative mt-24 overflow-hidden bg-card/50 p-8 text-center backdrop-blur md:p-12">
            <div
              className="absolute inset-0 -z-10 opacity-40"
              style={{ background: "var(--gradient-aurora)", filter: "blur(70px)" }}
            />
            <Sparkles className="mx-auto h-6 w-6 text-gold" />
            <p className="mx-auto mt-4 max-w-2xl font-serif text-xl italic leading-relaxed text-foreground/95 md:text-2xl">
              {full.closing}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

function Ornament() {
  return (
    <div className="flex items-center justify-center gap-3 opacity-70">
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-gold/60" />
      <Star className="h-3 w-3 text-gold" fill="currentColor" />
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-gold/60" />
    </div>
  );
}