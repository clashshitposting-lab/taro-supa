import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/db/client";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
        data: { display_name: name },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (data.session) {
      nav({ to: "/dashboard" });
    } else {
      toast.success("Confirme seu email para entrar.");
    }
  };

  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard" },
    });
    if (error) toast.error("Não foi possível entrar com Google");
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border/40 bg-card/60 p-8 backdrop-blur shadow-mystic">
        <h1 className="font-serif text-3xl text-gold glow-gold">Crie sua conta</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Suas leituras ficam salvas no seu perfil.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            type="text"
            required
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg bg-input px-4 py-3 outline-none focus:ring-2 focus:ring-gold"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-input px-4 py-3 outline-none focus:ring-2 focus:ring-gold"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Senha (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-input px-4 py-3 outline-none focus:ring-2 focus:ring-gold"
          />
          <button
            disabled={loading}
            className="bg-gold w-full rounded-lg py-3 font-medium shadow-gold disabled:opacity-60"
          >
            {loading ? "Criando..." : "Criar conta"}
          </button>
        </form>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          ou
          <span className="h-px flex-1 bg-border" />
        </div>
        <button
          onClick={google}
          className="w-full rounded-lg border border-border/60 py-3 hover:bg-secondary/40"
        >
          Continuar com Google
        </button>
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="text-gold">
            Entrar
          </Link>
        </div>
      </div>
    </main>
  );
}