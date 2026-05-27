import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Star, Check, ArrowLeft, Moon } from "lucide-react";
import { CosmicBg } from "@/components/cosmic-bg";
import { listOffers, purchaseOffer } from "@/lib/entitlements.functions";

export const Route = createFileRoute("/_authenticated/oferta")({
  component: OfertaPage,
});

function formatPrice(cents: number, currency: string) {
  const v = cents / 100;
  if (currency === "BRL") return `R$ ${v.toFixed(2).replace(".", ",")}`;
  return `${currency} ${v.toFixed(2)}`;
}

function OfertaPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const fetchOffers = useServerFn(listOffers);
  const buy = useServerFn(purchaseOffer);
  const [loading, setLoading] = useState(false);

  const { data: offers } = useQuery({
    queryKey: ["offers"],
    queryFn: () => fetchOffers(),
  });

  const offer = offers?.[0];

  const onBuy = async () => {
    if (!offer) return;
    setLoading(true);
    try {
      await buy({ data: { offerId: offer.id } });
      toast.success("Bem-vindo(a) ao caminho. Seu pacote está ativo.");
      await qc.invalidateQueries({ queryKey: ["entitlements"] });
      nav({ to: "/dashboard" });
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível ativar o pacote.");
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <CosmicBg />

      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar ao altar
        </Link>
        <span className="flex items-center gap-2 font-serif text-xl text-gold glow-gold">
          <Moon className="h-5 w-5" /> Mystic
        </span>
      </nav>

      <div className="mx-auto max-w-3xl px-6 pb-24">
        <header className="text-center">
          <span className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
            Pacote de iniciação
          </span>
          <h1 className="mt-3 font-serif text-4xl text-gold glow-gold md:text-5xl">
            {offer?.title ?? "Pacote Despertar"}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            {offer?.subtitle ??
              "Sete dias para se ouvir profundamente — uma leitura de tarô por dia mais o seu mapa astral completo."}
          </p>
        </header>

        <div className="tarot-frame mt-10 bg-card/40 p-8 backdrop-blur md:p-12">
          <div className="flex flex-col items-center gap-1 text-center">
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Investimento único
            </div>
            <div className="font-serif text-5xl text-gold glow-gold">
              {offer ? formatPrice(offer.price_cents, offer.currency) : "—"}
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {(offer?.includes as Array<{ label: string }> | undefined)?.map(
              (item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-border/40 bg-cosmos/30 p-4"
                >
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gold text-gold-foreground">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </div>
                  <div className="flex-1">
                    <p className="font-serif text-lg text-foreground">
                      {item.label}
                    </p>
                  </div>
                  {i === 0 ? (
                    <Sparkles className="h-5 w-5 text-gold opacity-70" />
                  ) : (
                    <Star className="h-5 w-5 text-mystic opacity-80" />
                  )}
                </div>
              ),
            )}
          </div>

          <button
            onClick={onBuy}
            disabled={loading || !offer}
            className="bg-gold mt-8 w-full rounded-full px-8 py-4 font-medium shadow-aurora transition hover:scale-[1.02] disabled:opacity-60"
          >
            {loading ? "Abrindo o portal..." : "Quero despertar"}
          </button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Acesso imediato. Sem renovação automática.
          </p>
        </div>
      </div>
    </main>
  );
}