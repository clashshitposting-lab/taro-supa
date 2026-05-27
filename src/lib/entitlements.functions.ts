import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/db/auth-middleware";
import { supabaseAdmin } from "@/integrations/db/client.server";

const KINDS = ["tarot_daily", "astral_chart"] as const;
export type EntitlementKind = (typeof KINDS)[number];

function isSameUTCDay(a: Date, b: Date) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export const listOffers = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("offers")
    .select("*")
    .eq("is_active", true)
    .order("price_cents", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getMyEntitlements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_entitlements")
      .select("*")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    const now = new Date();
    const active = (data ?? []).filter(
      (e) => !e.expires_at || new Date(e.expires_at) > now,
    );
    const byKind: Record<string, {
      kind: string;
      total_remaining: number | null;
      daily_quota: number | null;
      available_today: boolean;
      next_available_at: string | null;
      expires_at: string | null;
    }> = {};
    for (const e of active) {
      const last = e.last_consumed_at ? new Date(e.last_consumed_at) : null;
      const usedToday = last ? isSameUTCDay(last, now) : false;
      const hasRemaining = e.total_remaining == null || e.total_remaining > 0;
      const available =
        hasRemaining && (e.daily_quota == null || !usedToday);
      const next =
        !available && hasRemaining && e.daily_quota != null
          ? new Date(Date.UTC(
              now.getUTCFullYear(),
              now.getUTCMonth(),
              now.getUTCDate() + 1,
            )).toISOString()
          : null;
      // prefer the most generous record per kind
      const prev = byKind[e.kind];
      if (!prev || (available && !prev.available_today)) {
        byKind[e.kind] = {
          kind: e.kind,
          total_remaining: e.total_remaining,
          daily_quota: e.daily_quota,
          available_today: available,
          next_available_at: next,
          expires_at: e.expires_at,
        };
      }
    }
    return { entitlements: Object.values(byKind) };
  });

/**
 * Consumes one unit of the given entitlement kind for the current user.
 * Throws a friendly error if there's nothing to consume.
 * Server-only — uses admin client to update.
 */
export const consumeEntitlement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ kind: z.enum(KINDS) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: rows, error } = await supabaseAdmin
      .from("user_entitlements")
      .select("*")
      .eq("user_id", userId)
      .eq("kind", data.kind)
      .order("granted_at", { ascending: true });
    if (error) throw new Error(error.message);

    const now = new Date();
    const candidate = (rows ?? []).find((e) => {
      if (e.expires_at && new Date(e.expires_at) <= now) return false;
      if (e.total_remaining != null && e.total_remaining <= 0) return false;
      if (e.daily_quota != null && e.last_consumed_at) {
        if (isSameUTCDay(new Date(e.last_consumed_at), now)) return false;
      }
      return true;
    });
    if (!candidate) {
      throw new Error(
        "Você não tem leituras disponíveis hoje. Adquira um pacote para continuar.",
      );
    }

    const next: {
      last_consumed_at: string;
      total_remaining?: number;
    } = { last_consumed_at: now.toISOString() };
    if (candidate.total_remaining != null) {
      next.total_remaining = Math.max(0, candidate.total_remaining - 1);
    }
    const { error: upErr } = await supabaseAdmin
      .from("user_entitlements")
      .update(next)
      .eq("id", candidate.id);
    if (upErr) throw new Error(upErr.message);
    return { ok: true as const };
  });

export const purchaseOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ offerId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: offer, error: oErr } = await supabaseAdmin
      .from("offers")
      .select("*")
      .eq("id", data.offerId)
      .single();
    if (oErr || !offer) throw new Error("Oferta não encontrada.");

    const { data: purchase, error: pErr } = await supabaseAdmin
      .from("purchases")
      .insert({
        user_id: userId,
        offer_id: offer.id,
        amount_cents: offer.price_cents,
        currency: offer.currency,
        status: "paid",
      })
      .select("id")
      .single();
    if (pErr) throw new Error(pErr.message);

    const includes = (offer.includes as Array<{
      kind: string;
      label?: string;
      quota?: number;
      days?: number;
    }>) ?? [];

    for (const item of includes) {
      const expires =
        item.days && item.days > 0
          ? new Date(Date.now() + item.days * 86_400_000).toISOString()
          : null;
      const isDaily = item.kind === "tarot_daily";
      await supabaseAdmin.from("user_entitlements").insert({
        user_id: userId,
        kind: item.kind,
        source_purchase_id: purchase.id,
        daily_quota: isDaily ? 1 : null,
        total_remaining: item.quota ?? null,
        expires_at: expires,
      });
    }

    return { ok: true as const, purchaseId: purchase.id };
  });