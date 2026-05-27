import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { Moon, LogOut } from "lucide-react";
import { supabase } from "@/integrations/db/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    // No SSR não tem localStorage — sessão fica indefinida e dispara redirect indevido.
    // Deixa o check só no client; quem não estiver logado é redirecionado antes de renderizar.
    if (typeof window === "undefined") return;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const nav = useNavigate();
  const logout = async () => {
    await supabase.auth.signOut();
    nav({ to: "/" });
  };
  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <Link to="/dashboard" className="flex items-center gap-2 font-serif text-xl text-gold glow-gold">
          <Moon className="h-5 w-5" /> Mystic Tarot
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
            Meu perfil
          </Link>
          <button onClick={logout} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}