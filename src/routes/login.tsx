import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/db/client";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Permite login por "username" puro (sem @): completa com @admin.local
    const loginEmail = email.includes("@") ? email : `${email.trim()}@admin.local`;
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    const params = new URLSearchParams(window.location.search);
    const dest = params.get("redirect") || "/dashboard";
    window.location.href = dest;
  };

  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard" },
    });
    if (error) toast.error("Não foi possível entrar com Google");
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-border/40 bg-card/60 p-8 backdrop-blur shadow-mystic">
        <h1 className="font-serif text-3xl text-gold glow-gold">Bem-vinda(o) de volta</h1>
        <p className="mt-2 text-sm text-muted-foreground">As cartas estavam te esperando.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input type="text" required placeholder="Email ou usuário" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg bg-input px-4 py-3 outline-none focus:ring-2 focus:ring-gold" />
          <input type="password" required placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg bg-input px-4 py-3 outline-none focus:ring-2 focus:ring-gold" />
          <button disabled={loading} className="bg-gold w-full rounded-lg py-3 font-medium shadow-gold disabled:opacity-60">{loading ? "Entrando..." : "Entrar"}</button>
        </form>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div>
        <button onClick={google} className="w-full rounded-lg border border-border/60 py-3 hover:bg-secondary/40">Continuar com Google</button>
        <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
          <Link to="/reset-password" className="hover:text-foreground">Esqueci a senha</Link>
          <Link to="/signup" className="text-gold">Criar conta</Link>
        </div>
      </div>
    </main>
  );
}