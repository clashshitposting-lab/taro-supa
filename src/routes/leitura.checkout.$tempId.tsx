import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Moon, Lock, CreditCard, Sparkles, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/db/client";
import { claimPreview } from "@/lib/tarot.functions";
import { CosmicBg } from "@/components/cosmic-bg";

export const Route = createFileRoute("/leitura/checkout/$tempId")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const { tempId } = Route.useParams();
  const nav = useNavigate();
  const claim = useServerFn(claimPreview);

  const [hasSession, setHasSession] = useState<boolean | null>(null);

  // Form mockado
  const [name, setName] = useState("");
  const [card, setCard] = useState("");

  // Mini signup quando não logado
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<"idle" | "paying" | "unlocking">("idle");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) =>
      setHasSession(!!s),
    );
    return () => subscription.unsubscribe();
  }, []);

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setStage("paying");

    try {
      // 1) Pagamento mockado (delay)
      await new Promise((r) => setTimeout(r, 1200));

      // 2) Garante conta
      let session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        if (!email || password.length < 6) {
          toast.error("Informe um e-mail válido e uma senha de pelo menos 6 caracteres.");
          setLoading(false);
          setStage("idle");
          return;
        }
        const { data: signUpData, error: suErr } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name || email.split("@")[0] } },
        });
        if (suErr) {
          // tenta login (talvez já exista)
          const { data: signInData, error: siErr } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (siErr || !signInData.session) {
            toast.error(suErr.message);
            setLoading(false);
            setStage("idle");
            return;
          }
          session = signInData.session;
        } else {
          session = signUpData.session;
          if (!session) {
            // email confirm desligado normalmente, mas se vier null:
            const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });
            session = signInData.session;
          }
        }
      }

      if (!session) {
        toast.error("Não foi possível criar a sessão. Tente fazer login.");
        setLoading(false);
        setStage("idle");
        return;
      }

      // 3) Reivindica preview e cria reading
      setStage("unlocking");
      const { id } = await claim({ data: { previewId: tempId } });
      nav({ to: "/leitura/$id", params: { id } });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Algo deu errado. Tente novamente.");
      setLoading(false);
      setStage("idle");
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <CosmicBg showMoon={false} />
      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <Link to="/" className="flex items-center gap-2 font-serif text-xl text-gold glow-gold">
          <Moon className="h-5 w-5" /> Mystic Tarot
        </Link>
        <Link
          to="/leitura/previa/$tempId"
          params={{ tempId }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar à prévia
        </Link>
      </nav>

      <div className="mx-auto grid max-w-4xl gap-8 px-6 pb-24 pt-6 md:grid-cols-[1.2fr_1fr]">
        {/* Card de checkout */}
        <section className="tarot-frame relative overflow-hidden bg-card/50 p-8 backdrop-blur">
          <div
            className="absolute inset-0 -z-10 opacity-30"
            style={{ background: "var(--gradient-aurora)", filter: "blur(80px)" }}
          />
          <span className="text-[11px] uppercase tracking-[0.3em] text-gold">Checkout</span>
          <h1 className="mt-2 font-serif text-3xl text-foreground md:text-4xl">
            Liberar leitura completa
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pagamento simulado — clique em "Pagar R$ 19" para liberar.
          </p>

          <form onSubmit={pay} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                Nome no cartão
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Seu nome"
                className="w-full rounded-lg border border-border/40 bg-input px-4 py-3 outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                Número do cartão
              </label>
              <div className="relative">
                <input
                  value={card}
                  onChange={(e) => setCard(e.target.value)}
                  required
                  inputMode="numeric"
                  placeholder="4242 4242 4242 4242"
                  className="w-full rounded-lg border border-border/40 bg-input px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-gold"
                />
                <CreditCard className="absolute right-3 top-3.5 h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="MM/AA"
                required
                defaultValue="12/29"
                className="rounded-lg border border-border/40 bg-input px-4 py-3 outline-none focus:ring-2 focus:ring-gold"
              />
              <input
                placeholder="CVV"
                required
                defaultValue="123"
                className="rounded-lg border border-border/40 bg-input px-4 py-3 outline-none focus:ring-2 focus:ring-gold"
              />
            </div>

            {hasSession === false && (
              <div className="mt-2 rounded-xl border border-gold/20 bg-background/40 p-4">
                <p className="mb-3 text-xs uppercase tracking-widest text-gold">
                  Criar conta para guardar sua leitura
                </p>
                <div className="space-y-3">
                  <input
                    type="email"
                    required
                    placeholder="Seu e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-border/40 bg-input px-4 py-3 outline-none focus:ring-2 focus:ring-gold"
                  />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Senha (mín. 6)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-border/40 bg-input px-4 py-3 outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>
              </div>
            )}

            <button
              disabled={loading}
              className="bg-gold mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-4 font-medium shadow-aurora transition hover:scale-[1.02] disabled:opacity-60"
            >
              {stage === "paying" && "Processando pagamento..."}
              {stage === "unlocking" && "Consultando o oráculo..."}
              {stage === "idle" && (
                <>
                  <Lock className="h-4 w-4" /> Pagar R$ 19 e liberar
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-muted-foreground">
              Pagamento mockado para demonstração — nenhum cartão é cobrado.
            </p>
          </form>
        </section>

        {/* Resumo */}
        <aside className="tarot-frame h-fit bg-card/40 p-6 backdrop-blur">
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold">Você vai receber</p>
          <h2 className="mt-2 font-serif text-2xl">Leitura Cruz Celta completa</h2>
          <ul className="mt-4 space-y-3 text-sm text-foreground/85">
            {[
              "10 cartas reais Rider-Waite",
              "Interpretação carta a carta",
              "Síntese para as 4 áreas",
              "Mensagem final personalizada",
              "Histórico salvo no seu perfil",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" />
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-baseline justify-between border-t border-border/40 pt-4">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-serif text-3xl text-gold glow-gold">R$ 19</span>
          </div>
        </aside>
      </div>
    </main>
  );
}