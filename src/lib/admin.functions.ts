import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/db/auth-middleware";
import { supabaseAdmin } from "@/integrations/db/client.server";

async function assertAdmin(userId: string) {
  const { data, error } = await (supabaseAdmin.from as any)("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .limit(1);
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Acesso restrito ao administrador.");
}

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      await assertAdmin(context.userId);
      return { isAdmin: true };
    } catch {
      return { isAdmin: false };
    }
  });

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [readingsRes, usageRes, usersRes] = await Promise.all([
      (supabaseAdmin.from as any)("readings")
        .select("id, is_unlocked", { count: "exact" })
        .gte("created_at", since),
      (supabaseAdmin.from as any)("ai_usage_logs")
        .select("cost_usd, prompt_tokens, completion_tokens, total_tokens")
        .gte("created_at", since),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 }),
    ]);

    const totalReadings = readingsRes.count ?? readingsRes.data?.length ?? 0;
    const unlockedReadings = (readingsRes.data ?? []).filter((r: any) => r.is_unlocked).length;

    const usage = (usageRes.data ?? []) as any[];
    const totalCost = usage.reduce((s, r) => s + Number(r.cost_usd ?? 0), 0);
    const totalTokens = usage.reduce((s, r) => s + Number(r.total_tokens ?? 0), 0);
    const promptTokens = usage.reduce((s, r) => s + Number(r.prompt_tokens ?? 0), 0);
    const completionTokens = usage.reduce((s, r) => s + Number(r.completion_tokens ?? 0), 0);

    return {
      totalUsers: (usersRes as any).data?.total ?? null,
      totalReadings,
      unlockedReadings,
      totalCostUsd: Number(totalCost.toFixed(4)),
      totalTokens,
      promptTokens,
      completionTokens,
    };
  });

export const getAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);

    const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listErr) throw new Error(listErr.message);

    const userIds = list.users.map((u) => u.id);

    const [profilesRes, readingsRes, usageRes] = await Promise.all([
      (supabaseAdmin.from as any)("profiles").select("id, display_name").in("id", userIds),
      (supabaseAdmin.from as any)("readings").select("user_id, is_unlocked").in("user_id", userIds),
      (supabaseAdmin.from as any)("ai_usage_logs").select("user_id, cost_usd, total_tokens").in("user_id", userIds),
    ]);

    const profileMap = new Map<string, any>(
      ((profilesRes.data ?? []) as any[]).map((p) => [p.id, p]),
    );
    const readingMap = new Map<string, { total: number; unlocked: number }>();
    for (const r of (readingsRes.data ?? []) as any[]) {
      const cur = readingMap.get(r.user_id) ?? { total: 0, unlocked: 0 };
      cur.total++;
      if (r.is_unlocked) cur.unlocked++;
      readingMap.set(r.user_id, cur);
    }
    const usageMap = new Map<string, { cost: number; tokens: number }>();
    for (const u of (usageRes.data ?? []) as any[]) {
      const cur = usageMap.get(u.user_id) ?? { cost: 0, tokens: 0 };
      cur.cost += Number(u.cost_usd ?? 0);
      cur.tokens += Number(u.total_tokens ?? 0);
      usageMap.set(u.user_id, cur);
    }

    return list.users
      .map((u) => ({
        id: u.id,
        email: u.email,
        display_name: profileMap.get(u.id)?.display_name ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        readings_total: readingMap.get(u.id)?.total ?? 0,
        readings_unlocked: readingMap.get(u.id)?.unlocked ?? 0,
        cost_usd: Number((usageMap.get(u.id)?.cost ?? 0).toFixed(4)),
        tokens: usageMap.get(u.id)?.tokens ?? 0,
      }))
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  });

export const getAdminReadings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);

    const { data: readings, error: rErr } = await (supabaseAdmin.from as any)("readings")
      .select("id, user_id, summary, is_unlocked, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (rErr) throw new Error(rErr.message);

    const ids = ((readings ?? []) as any[]).map((r) => r.id);
    const userIds = Array.from(new Set(((readings ?? []) as any[]).map((r) => r.user_id)));

    const [usageRes, listRes] = await Promise.all([
      ids.length
        ? (supabaseAdmin.from as any)("ai_usage_logs")
            .select("reading_id, cost_usd, total_tokens")
            .in("reading_id", ids)
        : Promise.resolve({ data: [] as any[] }),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    ]);

    const emailMap = new Map<string, string | undefined>(
      (listRes as any).data?.users?.map((u: any) => [u.id, u.email]) ?? [],
    );
    const usageByReading = new Map<string, { cost: number; tokens: number }>();
    for (const u of (usageRes.data ?? []) as any[]) {
      const cur = usageByReading.get(u.reading_id) ?? { cost: 0, tokens: 0 };
      cur.cost += Number(u.cost_usd ?? 0);
      cur.tokens += Number(u.total_tokens ?? 0);
      usageByReading.set(u.reading_id, cur);
    }

    return ((readings ?? []) as any[]).map((r) => ({
      id: r.id,
      user_id: r.user_id,
      email: emailMap.get(r.user_id) ?? null,
      summary: r.summary,
      is_unlocked: r.is_unlocked,
      created_at: r.created_at,
      cost_usd: Number((usageByReading.get(r.id)?.cost ?? 0).toFixed(4)),
      tokens: usageByReading.get(r.id)?.tokens ?? 0,
    }));
    void userIds;
  });