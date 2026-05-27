import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Star, Moon } from "lucide-react";
import { CosmicBg } from "@/components/cosmic-bg";
import { ZodiacWheel } from "@/components/zodiac-wheel";
import { createAstralChart } from "@/lib/astral.functions";

export const Route = createFileRoute("/_authenticated/mapa-astral/novo")({
  component: NovoMapaAstral,
});

function NovoMapaAstral() {
  const nav = useNavigate();
  const create = useServerFn(createAstralChart);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    birth_name: "",
    birth_date: "",
    birth_time: "",
    birth_place: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.birth_name || !form.birth_date || !form.birth_place) {
      toast.error("Preencha nome, data e local de nascimento.");
      return;
    }
    setLoading(true);
    try {
      const { id } = await create({
        data: {
          birth_name: form.birth_name,
          birth_date: form.birth_date,
          birth_time: form.birth_time || null,
          birth_place: form.birth_place,
        },
      });
      nav({ to: "/mapa-astral/$id", params: { id } });
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível gerar o mapa.");
      setLoading(false);
    }
  };

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

      <div className="mx-auto grid max-w-5xl gap-10 px-6 pb-24 md:grid-cols-[1fr_320px] md:items-center">
        <div>
          <span className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
            Mapa Astral
          </span>
          <h1 className="mt-3 font-serif text-4xl text-gold glow-gold md:text-5xl">
            Conte ao cosmos quem você é
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Quanto mais precisos os dados de nascimento, mais profunda a leitura
            do seu Sol, Lua e Ascendente.
          </p>

          <form onSubmit={submit} className="tarot-frame mt-8 space-y-5 bg-card/40 p-6 backdrop-blur md:p-8">
            <Field label="Seu nome">
              <input
                value={form.birth_name}
                onChange={(e) => setForm({ ...form, birth_name: e.target.value })}
                className="w-full rounded-xl border border-border/40 bg-input px-4 py-3 outline-none focus:ring-2 focus:ring-gold"
                placeholder="Como você é chamada(o)"
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Data de nascimento">
                <input
                  type="date"
                  value={form.birth_date}
                  onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                  className="w-full rounded-xl border border-border/40 bg-input px-4 py-3 outline-none focus:ring-2 focus:ring-gold"
                />
              </Field>
              <Field label="Hora (opcional)">
                <input
                  type="time"
                  value={form.birth_time}
                  onChange={(e) => setForm({ ...form, birth_time: e.target.value })}
                  className="w-full rounded-xl border border-border/40 bg-input px-4 py-3 outline-none focus:ring-2 focus:ring-gold"
                />
              </Field>
            </div>
            <Field label="Cidade e país de nascimento">
              <input
                value={form.birth_place}
                onChange={(e) => setForm({ ...form, birth_place: e.target.value })}
                className="w-full rounded-xl border border-border/40 bg-input px-4 py-3 outline-none focus:ring-2 focus:ring-gold"
                placeholder="Ex: São Paulo, Brasil"
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="bg-gold inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-3 font-medium shadow-aurora transition hover:scale-[1.02] disabled:opacity-60"
            >
              {loading ? "Consultando os astros..." : <><Star className="h-4 w-4" /> Gerar meu mapa</>}
            </button>
          </form>
        </div>

        <div className="hidden justify-self-center md:flex">
          <div className="spin-slow">
            <ZodiacWheel size={300} />
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}