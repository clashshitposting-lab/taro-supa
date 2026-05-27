import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, DollarSign, Users, Sparkles, Coins, LogOut, Moon } from "lucide-react";
import { supabase } from "@/integrations/db/client";
import {
  getAdminStats,
  getAdminUsers,
  getAdminReadings,
  checkIsAdmin,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/pagina-inicial-teste")({
  component: AdminGate,
});

type AuthState = "checking" | "login" | "ready";

function AdminGate() {
  const [state, setState] = useState<AuthState>("checking");

  const verify = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setState("login");
      return;
    }
    try {
      const res = await checkIsAdmin();
      if (res.isAdmin) setState("ready");
      else {
        await supabase.auth.signOut();
        setState("login");
        toast.error("Esta conta não tem acesso de administrador.");
      }
    } catch {
      await supabase.auth.signOut();
      setState("login");
    }
  };

  useEffect(() => {
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center text-muted-foreground">
        Verificando acesso...
      </main>
    );
  }
  if (state === "login") return <AdminLogin onSuccess={verify} />;
  return <AdminPanel onLogout={() => setState("login")} />;
}

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const email = user.includes("@") ? user : `${user.trim()}@admin.local`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }
    const res = await checkIsAdmin().catch(() => ({ isAdmin: false }));
    setLoading(false);
    if (!res.isAdmin) {
      await supabase.auth.signOut();
      return toast.error("Esta conta não tem acesso de administrador.");
    }
    onSuccess();
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-border/40 bg-card/60 p-8 backdrop-blur shadow-mystic">
        <h1 className="font-serif text-3xl text-gold glow-gold">Acesso administrativo</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Entre com suas credenciais de administrador.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            type="text"
            required
            placeholder="Usuário admin"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="w-full rounded-lg bg-input px-4 py-3 outline-none focus:ring-2 focus:ring-gold"
          />
          <input
            type="password"
            required
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-input px-4 py-3 outline-none focus:ring-2 focus:ring-gold"
          />
          <button
            disabled={loading}
            className="bg-gold w-full rounded-lg py-3 font-medium shadow-gold disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar no painel"}
          </button>
        </form>
      </div>
    </main>
  );
}

function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const router = useRouter();
  const statsFn = useServerFn(getAdminStats);
  const usersFn = useServerFn(getAdminUsers);
  const readingsFn = useServerFn(getAdminReadings);

  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: () => statsFn() });
  const users = useQuery({ queryKey: ["admin", "users"], queryFn: () => usersFn() });
  const readings = useQuery({ queryKey: ["admin", "readings"], queryFn: () => readingsFn() });

  const anyError = stats.error || users.error || readings.error;

  const logout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-2 font-serif text-xl text-gold glow-gold">
          <Moon className="h-5 w-5" /> Mystic Tarot · Admin
        </div>
        <button onClick={logout} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </nav>
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-serif text-4xl text-gold glow-gold">Painel admin</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Métricas dos últimos 30 dias e contas cadastradas.
            </p>
          </div>
          <button
            onClick={() => router.invalidate()}
            className="inline-flex items-center gap-2 self-start rounded-full border border-border/60 px-5 py-2 text-sm hover:bg-secondary/40"
          >
            <RefreshCw className="h-4 w-4" /> Atualizar
          </button>
        </div>

        {anyError && (
          <div className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive-foreground">
            {(anyError as Error).message}
          </div>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Users className="h-4 w-4" />}
            label="Usuários cadastrados"
            value={stats.data?.totalUsers ?? "—"}
          />
          <StatCard
            icon={<Sparkles className="h-4 w-4" />}
            label="Leituras (30d)"
            value={`${stats.data?.totalReadings ?? 0} (${stats.data?.unlockedReadings ?? 0} completas)`}
          />
          <StatCard
            icon={<DollarSign className="h-4 w-4" />}
            label="Custo OpenAI (30d)"
            value={`US$ ${(stats.data?.totalCostUsd ?? 0).toFixed(4)}`}
          />
          <StatCard
            icon={<Coins className="h-4 w-4" />}
            label="Tokens (30d)"
            value={`${(stats.data?.totalTokens ?? 0).toLocaleString("pt-BR")}`}
            sub={`in ${stats.data?.promptTokens ?? 0} / out ${stats.data?.completionTokens ?? 0}`}
          />
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-2xl">Usuários</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border/40 bg-card/40 backdrop-blur">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <Th>Email</Th>
                  <Th>Nome</Th>
                  <Th>Cadastro</Th>
                  <Th>Último login</Th>
                  <Th className="text-right">Leituras</Th>
                  <Th className="text-right">Tokens</Th>
                  <Th className="text-right">Custo</Th>
                </tr>
              </thead>
              <tbody>
                {users.isLoading && (
                  <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Carregando...</td></tr>
                )}
                {users.data?.map((u) => (
                  <tr key={u.id} className="border-t border-border/30">
                    <Td>{u.email ?? "—"}</Td>
                    <Td>{u.display_name ?? "—"}</Td>
                    <Td>{fmtDate(u.created_at)}</Td>
                    <Td>{u.last_sign_in_at ? fmtDate(u.last_sign_in_at) : "nunca"}</Td>
                    <Td className="text-right">{u.readings_total} ({u.readings_unlocked})</Td>
                    <Td className="text-right">{u.tokens.toLocaleString("pt-BR")}</Td>
                    <Td className="text-right">US$ {u.cost_usd.toFixed(4)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-2xl">Leituras recentes</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border/40 bg-card/40 backdrop-blur">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <Th>Data</Th>
                  <Th>Usuário</Th>
                  <Th>Resumo</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Tokens</Th>
                  <Th className="text-right">Custo</Th>
                </tr>
              </thead>
              <tbody>
                {readings.isLoading && (
                  <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Carregando...</td></tr>
                )}
                {readings.data?.map((r) => (
                  <tr key={r.id} className="border-t border-border/30">
                    <Td>{fmtDate(r.created_at)}</Td>
                    <Td>{r.email ?? r.user_id.slice(0, 8)}</Td>
                    <Td className="max-w-md truncate text-muted-foreground">{r.summary ?? "—"}</Td>
                    <Td>{r.is_unlocked ? "Completa" : "Preview"}</Td>
                    <Td className="text-right">{r.tokens.toLocaleString("pt-BR")}</Td>
                    <Td className="text-right">
                      <Link to="/leitura/$id" params={{ id: r.id }} className="text-gold hover:underline">
                        US$ {r.cost_usd.toFixed(4)}
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-5 backdrop-blur">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-3 font-serif text-2xl text-foreground">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 font-medium ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}