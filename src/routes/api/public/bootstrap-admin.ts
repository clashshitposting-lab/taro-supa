import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/db/client.server";

// Endpoint idempotente: cria o usuário admin uma única vez.
// Se já existir um admin em public.user_roles, retorna { ok: true, already: true }.
// Email sintético usado: paulodebarrosgalletti@admin.local
const ADMIN_EMAIL = "paulodebarrosgalletti@admin.local";
const ADMIN_PASSWORD = "PauloDri2026@";

export const Route = createFileRoute("/api/public/bootstrap-admin")({
  server: {
    handlers: {
      GET: async () => {
        try {
          // 1) Já tem algum admin? Se sim, não faz nada.
          const { data: existingRoles, error: roleErr } = await supabaseAdmin
            .from("user_roles")
            .select("user_id")
            .eq("role", "admin")
            .limit(1);
          if (roleErr) throw new Error(`roles select: ${roleErr.message}`);
          if (existingRoles && existingRoles.length > 0) {
            return Response.json({ ok: true, already: true, message: "Admin já existe." });
          }

          // 2) Cria (ou recupera) o usuário admin
          let userId: string | null = null;
          const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            email_confirm: true,
            user_metadata: { display_name: "Paulo (admin)" },
          });
          if (createErr) {
            // Pode já existir; procura por email
            const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
            if (listErr) throw new Error(`list users: ${listErr.message}`);
            const found = list.users.find((u) => u.email === ADMIN_EMAIL);
            if (!found) throw new Error(`create user: ${createErr.message}`);
            userId = found.id;
          } else {
            userId = created.user?.id ?? null;
          }
          if (!userId) throw new Error("Sem userId após criar admin");

          // 3) Promove a admin
          const { error: insErr } = await supabaseAdmin
            .from("user_roles")
            .insert({ user_id: userId, role: "admin" });
          if (insErr && !insErr.message.includes("duplicate")) {
            throw new Error(`insert role: ${insErr.message}`);
          }

          return Response.json({
            ok: true,
            created: true,
            userId,
            login: { email: ADMIN_EMAIL, password_hint: "Use a senha que você definiu." },
          });
        } catch (e: any) {
          return Response.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
        }
      },
    },
  },
});