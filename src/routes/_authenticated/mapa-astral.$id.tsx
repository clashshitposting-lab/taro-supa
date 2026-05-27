import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Moon, Sun, Star, Sparkles } from "lucide-react";
import { CosmicBg } from "@/components/cosmic-bg";
import { ZodiacWheel } from "@/components/zodiac-wheel";
import { getAstralChart } from "@/lib/astral.functions";

export const Route = createFileRoute("/_authenticated/mapa-astral/$id")({
  component: MapaAstralPage,
});

type Interpretation = {
  sun: { sign: string; reading: string };
  moon: { sign: string; reading: string };
  ascendant: { sign: string; estimated: boolean; reading: string };
  opening: string;
  synthesis: string;
  advice: string;
};

function MapaAstralPage() {
  const { id } = Route.useParams();
  const fetchChart = useServerFn(getAstralChart);
  const { data, isLoading } = useQuery({
    queryKey: ["astral", id],
    queryFn: () => fetchChart({ data: { id } }),
    refetchInterval: (q) => {
      const d = q.state.data as any;
      return d?.interpretation ? false : 3000;
    },
  });

  const interp = data?.interpretation as Interpretation | null | undefined;

  return (
    <main className="relative min-h-screen overflow-hidden">
      <CosmicBg />

      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Altar
        </Link>
        <span className="flex items-center gap-2 font-serif text-xl text-gold glow-gold">
          <Moon className="h-5 w-5" /> Mystic
        </span>
      </nav>

      <div className="mx-auto max-w-4xl px-6 pb-24">
        {isLoading && !data && (
          <p className="mt-12 text-center text-muted-foreground">Consultando os astros...</p>
        )}

        {data && (
          <>
            <header className="text-center">
              <span className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
                Mapa de {data.birth_name}
              </span>
              <h1 className="mt-3 font-serif text-4xl text-gold glow-gold md:text-5xl">
                Seu retrato celeste
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {new Date(data.birth_date).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
                {data.birth_time ? ` · ${data.birth_time.slice(0, 5)}` : ""}
                {" · "}
                {data.birth_place}
              </p>
            </header>

            <div className="mt-8 flex justify-center">
              <div className="spin-slow">
                <ZodiacWheel size={220} />
              </div>
            </div>

            {!interp ? (
              <div className="tarot-frame mt-10 bg-card/40 p-10 text-center backdrop-blur">
                <Sparkles className="mx-auto h-8 w-8 animate-pulse text-gold" />
                <p className="mt-4 font-serif text-lg text-foreground">
                  Tecendo sua leitura...
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Isso leva alguns segundos. A página atualiza sozinha.
                </p>
              </div>
            ) : (
              <>
                <div className="tarot-frame mt-10 bg-card/40 p-8 backdrop-blur md:p-10">
                  <p className="font-serif text-lg italic leading-relaxed text-foreground">
                    {interp.opening}
                  </p>
                </div>

                <section className="mt-8 grid gap-5 md:grid-cols-3">
                  <Pillar
                    icon={Sun}
                    title="Sol"
                    sign={interp.sun.sign}
                    reading={interp.sun.reading}
                  />
                  <Pillar
                    icon={Moon}
                    title="Lua"
                    sign={interp.moon.sign}
                    reading={interp.moon.reading}
                  />
                  <Pillar
                    icon={Star}
                    title={`Ascendente${interp.ascendant.estimated ? " (estimado)" : ""}`}
                    sign={interp.ascendant.sign}
                    reading={interp.ascendant.reading}
                  />
                </section>

                <section className="tarot-frame mt-10 bg-card/40 p-8 backdrop-blur md:p-10">
                  <h2 className="font-serif text-2xl text-gold glow-gold">Síntese</h2>
                  <p className="mt-4 leading-relaxed text-foreground/90 whitespace-pre-line">
                    {interp.synthesis}
                  </p>
                </section>

                <section className="mt-6 rounded-2xl border border-mystic/40 bg-mystic/10 p-6 backdrop-blur">
                  <div className="text-xs uppercase tracking-[0.3em] text-mystic">
                    Conselho dos astros
                  </div>
                  <p className="mt-2 font-serif text-lg italic text-foreground">
                    {interp.advice}
                  </p>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function Pillar({
  icon: Icon,
  title,
  sign,
  reading,
}: {
  icon: typeof Sun;
  title: string;
  sign: string;
  reading: string;
}) {
  return (
    <div className="tarot-frame flex h-full flex-col gap-3 bg-card/40 p-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/50 bg-cosmos/40 text-gold shadow-gold">
          <Icon className="h-5 w-5" strokeWidth={1.4} />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {title}
          </div>
          <div className="font-serif text-xl text-foreground">{sign}</div>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{reading}</p>
    </div>
  );
}