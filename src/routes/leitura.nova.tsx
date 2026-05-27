import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Sparkles, Heart, Sun, Moon, Eye } from "lucide-react";
import { THEMES, emptyAnswers, type Answers, type ThemeKey } from "@/lib/questionnaire";
import { createPreview, createReadingFromEntitlement } from "@/lib/tarot.functions";
import { CosmicBg } from "@/components/cosmic-bg";

export const Route = createFileRoute("/leitura/nova")({
  validateSearch: z.object({ pkg: z.coerce.number().optional() }),
  component: NovaLeituraPublica,
});

const THEME_ICONS: Record<ThemeKey, typeof Eye> = {
  pessoal: Eye,
  relacionamento: Heart,
  trabalho: Sun,
  espiritualidade: Moon,
};

function NovaLeituraPublica() {
  const nav = useNavigate();
  const { pkg } = Route.useSearch();
  const usingPackage = pkg === 1;
  const create = useServerFn(createPreview);
  const createWithPackage = useServerFn(createReadingFromEntitlement);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(emptyAnswers());
  const [loading, setLoading] = useState(false);

  const theme = THEMES[step];
  const total = THEMES.length;
  const progress = useMemo(() => ((step + 1) / total) * 100, [step, total]);

  const setAnswer = (qid: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [theme.key]: { ...prev[theme.key], [qid]: value },
    }));
  };

  const themeAnswers = answers[theme.key] || {};
  const allMcAnswered = theme.multipleChoice.every((q) => !!themeAnswers[q.id]);
  const openAnswered = (themeAnswers[theme.open.id] || "").trim().length > 3;
  const canNext = allMcAnswered && openAnswered;

  const next = async () => {
    if (!canNext) return toast.error("Responda todas as perguntas para seguir.");
    if (step < total - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setLoading(true);
    try {
      if (usingPackage) {
        const { id } = await createWithPackage({ data: { answers } });
        nav({ to: "/leitura/$id", params: { id } });
      } else {
        const { id } = await create({ data: { answers } });
        nav({ to: "/leitura/previa/$tempId", params: { tempId: id } });
      }
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível embaralhar as cartas.");
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <CosmicBg showAurora={false} showMoon={false} />

      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <Link to="/" className="flex items-center gap-2 font-serif text-xl text-gold glow-gold">
          <Moon className="h-5 w-5" /> Mystic Tarot
        </Link>
        <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {usingPackage ? "Leitura desbloqueada" : "Leitura gratuita"}
        </span>
      </nav>

      <div className="mx-auto max-w-3xl px-6 pb-24">
        {/* Stepper de 4 áreas */}
        <div className="mb-10 mt-4">
          <div className="grid grid-cols-4 gap-3">
            {THEMES.map((t, i) => {
              const Icon = THEME_ICONS[t.key];
              const done = i < step;
              const current = i === step;
              return (
                <div key={t.key} className="flex flex-col items-center text-center">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full border transition ${
                      current
                        ? "border-gold bg-gold/20 text-gold shadow-gold"
                        : done
                          ? "border-gold/60 bg-gold/10 text-gold"
                          : "border-border/50 bg-card/40 text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.4} />
                  </div>
                  <div
                    className={`mt-2 text-[10px] uppercase tracking-widest ${
                      current ? "text-gold" : "text-muted-foreground"
                    }`}
                  >
                    {i + 1}/4
                  </div>
                  <div
                    className={`hidden text-xs sm:block ${
                      current ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {t.label}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 h-1 overflow-hidden rounded-full bg-secondary/30">
            <div
              className="h-full transition-all"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, var(--gold), var(--mystic))",
              }}
            />
          </div>
        </div>

        <header className="mb-8 text-center">
          <span className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
            Área {step + 1} de {total}
          </span>
          <h1 className="mt-2 font-serif text-4xl text-gold glow-gold md:text-5xl">{theme.label}</h1>
          <p className="mt-3 text-muted-foreground">{theme.description}</p>
        </header>

        <div className="tarot-frame space-y-8 bg-card/40 p-6 backdrop-blur md:p-10">
          {theme.multipleChoice.map((q) => (
            <div key={q.id}>
              <p className="mb-3 font-serif text-lg">{q.question}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {q.options.map((opt) => {
                  const selected = themeAnswers[q.id] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswer(q.id, opt)}
                      className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                        selected
                          ? "border-gold bg-gold/10 text-foreground shadow-gold"
                          : "border-border/50 bg-background/40 text-muted-foreground hover:border-gold/40"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <p className="mb-3 font-serif text-lg">{theme.open.question}</p>
            <textarea
              value={themeAnswers[theme.open.id] || ""}
              onChange={(e) => setAnswer(theme.open.id, e.target.value)}
              placeholder={theme.open.placeholder}
              rows={4}
              className="w-full rounded-xl border border-border/40 bg-input px-4 py-3 outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0 || loading}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Voltar
          </button>
          <button
            onClick={next}
            disabled={loading}
            className="bg-gold inline-flex items-center gap-2 rounded-full px-8 py-3 font-medium shadow-aurora transition hover:scale-105 disabled:opacity-60"
          >
            {loading ? (
              "Embaralhando o cosmos..."
            ) : step === total - 1 ? (
              <>
                <Sparkles className="h-4 w-4" /> Revelar minhas cartas
              </>
            ) : (
              <>
                Próxima área <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}