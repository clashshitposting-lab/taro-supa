import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Sparkles, Moon, Stars, Eye, Sun } from "lucide-react";
import { CosmicBg } from "@/components/cosmic-bg";
import { TarotCard } from "@/components/tarot-card";

export const Route = createFileRoute("/")({
  component: Index,
});

const HERO_CARDS = [
  { name: "The Star", img: "https://www.sacred-texts.com/tarot/pkt/img/ar17.jpg", rot: "-9deg", offset: "-translate-x-24", delay: "0s" },
  { name: "The Moon", img: "https://www.sacred-texts.com/tarot/pkt/img/ar18.jpg", rot: "0deg", offset: "translate-y-2", delay: "-2s" },
  { name: "The Sun", img: "https://www.sacred-texts.com/tarot/pkt/img/ar19.jpg", rot: "9deg", offset: "translate-x-24", delay: "-4s" },
];

function Index() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <CosmicBg />

      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <Link to="/" className="flex items-center gap-2 font-serif text-xl text-gold glow-gold">
          <Moon className="h-5 w-5" /> Mystic Tarot
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <Link to="/login" className="text-muted-foreground hover:text-foreground">Entrar</Link>
          <Link to="/leitura/nova" className="bg-gold rounded-full px-4 py-2 shadow-gold">Começar grátis</Link>
        </div>
      </nav>

      <section className="relative mx-auto flex max-w-5xl flex-col items-center px-6 pb-16 pt-10 text-center md:pt-16">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card/40 px-4 py-1.5 text-[11px] uppercase tracking-[0.3em] text-gold backdrop-blur">
          <Sparkles className="h-3 w-3" /> Rider-Waite · Cruz Celta
        </span>
        <h1 className="font-serif text-5xl leading-[1.05] text-foreground md:text-7xl">
          O tarô que <span className="shimmer-gold">escuta</span>
          <br /> você primeiro.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Quatro áreas da sua vida. Cartas reais embaralhadas pelo cosmos. Uma leitura tecida
          com a sua história — sem cadastro para começar.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/leitura/nova"
            className="bg-gold inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-medium shadow-aurora transition hover:scale-105"
          >
            <Sparkles className="h-4 w-4" /> Tirar minha leitura grátis
          </Link>
          <Link
            to="/login"
            className="rounded-full border border-border/60 px-8 py-4 text-base text-foreground/80 backdrop-blur hover:bg-secondary/40"
          >
            Já tenho conta
          </Link>
        </div>

        {/* Cartas flutuantes */}
        <div className="relative mt-20 flex h-[360px] w-full items-center justify-center md:mt-24 md:h-[420px]">
          <div
            className="absolute -z-10 rounded-full"
            style={{
              width: 520,
              height: 520,
              background: "radial-gradient(circle, oklch(0.45 0.20 310 / 0.35), transparent 70%)",
              filter: "blur(40px)",
            }}
          />
          {HERO_CARDS.map((c, i) => (
            <div
              key={c.name}
              className={`absolute ${c.offset} float`}
              style={{
                ["--rot" as any]: c.rot,
                transform: `rotate(${c.rot})`,
                animationDelay: c.delay,
                zIndex: i === 1 ? 2 : 1,
              }}
            >
              <TarotCard name={c.name} imageUrl={c.img} className="w-44 md:w-52" />
            </div>
          ))}
        </div>

        {/* 4 áreas */}
        <div className="mt-20 w-full">
          <p className="mb-8 text-xs uppercase tracking-[0.4em] text-muted-foreground">
            Quatro áreas · uma leitura
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { icon: Eye, label: "Vida pessoal" },
              { icon: Sparkles, label: "Relacionamento" },
              { icon: Sun, label: "Trabalho" },
              { icon: Moon, label: "Espiritualidade" },
            ].map((a) => (
              <div
                key={a.label}
                className="tarot-frame flex flex-col items-center gap-3 bg-card/40 px-4 py-6 backdrop-blur"
              >
                <a.icon className="h-6 w-6 text-gold" strokeWidth={1.2} />
                <span className="font-serif text-base">{a.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Como funciona */}
        <div className="mt-24 grid w-full grid-cols-1 gap-6 text-left md:grid-cols-3">
          {[
            { icon: Stars, title: "Responda em 4 etapas", text: "Conta o que está vivendo em cada área. Leva uns 3 minutos." },
            { icon: Sparkles, title: "Veja 3 cartas + resumo", text: "Receba uma prévia mística com 3 cartas reais e um conselho do oráculo." },
            { icon: Moon, title: "Desbloqueie tudo", text: "Se quiser ir fundo, libera as 10 cartas da Cruz Celta com interpretação completa." },
          ].map((f, i) => (
            <div key={f.title} className="relative rounded-2xl border border-border/40 bg-card/40 p-6 backdrop-blur">
              <div className="absolute -top-3 left-6 rounded-full border border-gold/40 bg-background px-3 py-0.5 text-[10px] uppercase tracking-widest text-gold">
                {String(i + 1).padStart(2, "0")}
              </div>
              <f.icon className="mb-3 h-5 w-5 text-gold" />
              <h3 className="font-serif text-xl">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 mb-8 text-xs text-muted-foreground">
          <span className="opacity-60">— sem cadastro para começar —</span>
        </div>
      </section>
    </main>
  );
}
