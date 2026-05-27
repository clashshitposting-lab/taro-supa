import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/db/auth-middleware";

export type HistoryItem = {
  id: string;
  kind: "tarot" | "astral";
  created_at: string;
  title: string;
  summary: string | null;
  thumbnails: Array<{ image_url: string; reversed: boolean; name?: string }>;
  is_unlocked: boolean;
};

export const listHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [readingsRes, chartsRes] = await Promise.all([
      supabase
        .from("readings")
        .select("id, created_at, summary, is_unlocked, cards")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("astral_charts")
        .select("id, created_at, birth_name, interpretation")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    if (readingsRes.error) throw new Error(readingsRes.error.message);
    if (chartsRes.error) throw new Error(chartsRes.error.message);

    const items: HistoryItem[] = [];

    for (const r of readingsRes.data ?? []) {
      const cards = Array.isArray(r.cards) ? (r.cards as any[]) : [];
      items.push({
        id: r.id,
        kind: "tarot",
        created_at: r.created_at,
        title: "Leitura de Tarô",
        summary: r.summary ?? null,
        thumbnails: cards.slice(0, 3).map((c) => ({
          image_url: c.image_url,
          reversed: !!c.reversed,
          name: c.name,
        })),
        is_unlocked: !!r.is_unlocked,
      });
    }

    for (const c of chartsRes.data ?? []) {
      const interp = c.interpretation as any;
      const summary = interp?.opening ?? interp?.synthesis ?? null;
      items.push({
        id: c.id,
        kind: "astral",
        created_at: c.created_at,
        title: `Mapa Astral de ${c.birth_name}`,
        summary,
        thumbnails: [],
        is_unlocked: true,
      });
    }

    items.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return items;
  });