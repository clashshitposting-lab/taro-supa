import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Sparkles,
  Star,
  Sun,
  Hash,
  HelpCircle,
  Moon as MoonIcon,
} from "lucide-react";
import { listHistory } from "@/lib/history.functions";
import { getMyEntitlements } from "@/lib/entitlements.functions";
import { CosmicBg } from "@/components/cosmic-bg";
import { ModuleCard } from "@/components/hub/ModuleCard";
import { OfferStatus } from "@/components/hub/OfferStatus";
import { HistoryTimeline } from "@/components/hub/HistoryTimeline";
import { supabase } from "@/integrations/db/client";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const LUNAR_HINTS = [
  "Lua Crescente em Escorpião",
  "Lua Cheia em Touro",
  "Lua Minguante em Peixes",
  "Lua Nova em Capricórnio",
];

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function Dashboard() {
  const nav = useNavigate();
  const fetchHistory = useServerFn(listHistory);
  const fetchEnts = useServerFn(getMyEntitlements);
  const [displayName, setDisplayName] = useState<string>("buscador(a)");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      const name =
        u?.user_metadata?.display_name ||
        u?.user_metadata?.full_name ||
        u?.email?.split("@")[0] ||
        "buscador(a)";
      setDisplayName(name);
    });
  }, []);

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ["history"],
    queryFn: () => fetchHistory(),
  });
  const { data: entResp } = useQuery({
    queryKey: ["entitlements"],
    queryFn: () => fetchEnts(),
  });

  const entitlements = entResp?.entitlements ?? [];
  const tarot = entitlements.find((e) => e.kind === "tarot_daily");
  const astral = entitlements.find((e) => e.kind === "astral_chart");
  const hasTarotAvailable = !!tarot?.available_today;
  const hasAstralAvailable = !!astral?.available_today;

  const startTarot = () => {
    if (hasTarotAvailable) {
      nav({ to: "/leitura/nova", search: { pkg: 1 } });
    } else if (tarot) {
      toast.info(
        "Sua leitura de hoje já foi feita. Volte amanhã ou adquira mais leituras.",
      );
    } else {
      nav({ to: "/oferta" });
    }
  };

  const startAstral = () => {
    if (hasAstralAvailable) nav({ to: "/mapa-astral/novo" });
    else nav({ to: "/oferta" });
  };

  const lunar = LUNAR_HINTS[new Date().getDate() % LUNAR_HINTS.length];

  return (
    <main className="relative min-h-screen overflow-hidden">
      <CosmicBg />
      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-10">
        {/* Header */}
        <header className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
            {lunar}
          </span>
          <h1 className="font-serif text-4xl text-gold glow-gold md:text-5xl">
            {greeting()}, {displayName}
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Bem-vindo(a) ao seu altar. Cada módulo abaixo é uma porta para se
            ouvir um pouco mais.
          </p>
        </header>

        {/* Offer status */}
        <div className="mt-8">
          <OfferStatus entitlements={entitlements} />
        </div>

        {/* Modules grid */}
        <section className="mt-12">
          <h2 className="mb-5 font-serif text-2xl text-foreground">
            Caminhos místicos
          </h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <ModuleCard
              icon={Sparkles}
              title="Tarô"
              description={
                hasTarotAvailable
                  ? "Sua leitura de hoje aguarda. Cruz Celta de 10 cartas, interpretada para você."
                  : tarot
                    ? "Volte amanhã para sua próxima tiragem."
                    : "Tiragem completa de Cruz Celta com leitura personalizada por IA."
              }
              onClick={startTarot}
              badge={
                hasTarotAvailable
                  ? { label: "Disponível", tone: "gold" }
                  : tarot
                    ? { label: "Volte amanhã", tone: "muted" }
                    : { label: "Pacote", tone: "mystic" }
              }
            />
            <ModuleCard
              icon={Star}
              title="Mapa Astral"
              description={
                hasAstralAvailable
                  ? "Sol, Lua e Ascendente interpretados a partir do seu nascimento."
                  : astral
                    ? "Você já tirou seu mapa — consulte no histórico."
                    : "Retrato astrológico a partir da sua data, hora e local de nascimento."
              }
              onClick={startAstral}
              badge={
                hasAstralAvailable
                  ? { label: "Incluso", tone: "gold" }
                  : astral
                    ? { label: "Já tirado", tone: "muted" }
                    : { label: "Pacote", tone: "mystic" }
              }
              disabled={!hasAstralAvailable && !!astral}
            />
            <ModuleCard
              icon={Sun}
              title="Horóscopo Diário"
              description="Mensagem curta do dia para o seu signo solar. Em breve."
              badge={{ label: "Em breve", tone: "muted" }}
              disabled
            />
            <ModuleCard
              icon={Hash}
              title="Numerologia"
              description="Número da sorte e caminho de vida calculados pela sua data de nascimento. Em breve."
              badge={{ label: "Em breve", tone: "muted" }}
              disabled
            />
            <ModuleCard
              icon={HelpCircle}
              title="Oráculo Sim/Não"
              description="Faça uma pergunta direta, receba uma carta direta. Em breve."
              badge={{ label: "Em breve", tone: "muted" }}
              disabled
            />
            <ModuleCard
              icon={MoonIcon}
              title="Diário Lunar"
              description="Acompanhe as fases da lua e registre suas intenções. Em breve."
              badge={{ label: "Em breve", tone: "muted" }}
              disabled
            />
          </div>
        </section>

        {/* History */}
        <section className="mt-16">
          <h2 className="font-serif text-2xl text-foreground">Sua jornada</h2>
          <p className="text-sm text-muted-foreground">
            Cada leitura é guardada — para você revisitar quando quiser.
          </p>
          {loadingHistory ? (
            <p className="mt-6 text-sm text-muted-foreground">Reunindo seus astros...</p>
          ) : (
            <HistoryTimeline items={history ?? []} />
          )}
        </section>
      </div>
    </main>
  );
}