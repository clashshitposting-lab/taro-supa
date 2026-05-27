import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/db/client";

export const Route = createFileRoute("/reset-password")({ component: ResetPage });

function ResetPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"request" | "set">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setMode("set");
    }
  }, []);

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Enviamos um link para o seu email.");
  };

  const setNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Senha atualizada!");
    nav({ to: "/dashboard" });
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-border/40 bg-card/60 p-8 backdrop-blur shadow-mystic">
        <h1 className="font-serif text-3xl text-gold glow-gold">
          {mode === "request" ? "Recuperar senha" : "Nova senha"}
        </h1>
        {mode === "request" ? (
          <form onSubmit={requestReset} className="mt-6 space-y-4">
            <input
              type="email"
              required
              placeholder="Seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-input px-4 py-3 outline-none focus:ring-2 focus:ring-gold"
            />
            <button disabled={loading} className="bg-gold w-full rounded-lg py-3 font-medium shadow-gold disabled:opacity-60">
              {loading ? "Enviando..." : "Enviar link"}
            </button>
          </form>
        ) : (
          <form onSubmit={setNew} className="mt-6 space-y-4">
            <input
              type="password"
              required
              minLength={6}
              placeholder="Nova senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-input px-4 py-3 outline-none focus:ring-2 focus:ring-gold"
            />
            <button disabled={loading} className="bg-gold w-full rounded-lg py-3 font-medium shadow-gold disabled:opacity-60">
              {loading ? "Salvando..." : "Definir nova senha"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}