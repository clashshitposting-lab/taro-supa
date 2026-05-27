import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/db/auth-middleware";
import { supabaseAdmin } from "@/integrations/db/client.server";

const POSITIONS = [
  "Situação atual",
  "Desafio",
  "Passado recente",
  "Futuro próximo",
  "Consciente / Objetivo",
  "Inconsciente / Base",
  "Você mesmo(a)",
  "Ambiente / Influências externas",
  "Esperanças e medos",
  "Resultado provável",
];

interface RawCard {
  name: string;
  name_short: string;
  value: string;
  type: string;
  meaning_up: string;
  meaning_rev: string;
  desc: string;
}

interface StoredCard {
  name: string;
  name_short: string;
  image_url: string;
  reversed: boolean;
  position: number;
  position_label: string;
  meaning_up: string;
  meaning_rev: string;
}

function cardImageUrl(name_short: string) {
  // Sacred-texts hosts Rider-Waite via the same shorthand convention used by tarotapi.dev
  return `https://www.sacred-texts.com/tarot/pkt/img/${name_short}.jpg`;
}

async function drawCards(): Promise<StoredCard[]> {
  const res = await fetch("https://tarotapi.dev/api/v1/cards/random?n=10");
  if (!res.ok) throw new Error("Não foi possível embaralhar as cartas. Tente novamente.");
  const json = (await res.json()) as { cards: RawCard[] };
  return json.cards.map((c, i) => ({
    name: c.name,
    name_short: c.name_short,
    image_url: cardImageUrl(c.name_short),
    reversed: Math.random() < 0.35,
    position: i + 1,
    position_label: POSITIONS[i],
    meaning_up: c.meaning_up,
    meaning_rev: c.meaning_rev,
  }));
}

async function callOpenAI(payload: object) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY não configurada");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 429) throw new Error("Muitas leituras seguidas. Aguarde um instante.");
  if (res.status === 401) throw new Error("OPENAI_API_KEY inválida.");
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Falha na OpenAI: ${res.status} ${t.slice(0, 200)}`);
  }
  return res.json();
}

// Preço em US$ por 1M de tokens (input / output)
const PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
};

async function logUsage(args: {
  userId: string;
  readingId: string | null;
  model: string;
  kind: "summary" | "full";
  aiResponse: any;
}) {
  try {
    const usage = args.aiResponse?.usage ?? {};
    const prompt_tokens = Number(usage.prompt_tokens ?? 0);
    const completion_tokens = Number(usage.completion_tokens ?? 0);
    const total_tokens = Number(usage.total_tokens ?? prompt_tokens + completion_tokens);
    const price = PRICING[args.model] ?? { input: 0, output: 0 };
    const cost_usd =
      (prompt_tokens * price.input) / 1_000_000 +
      (completion_tokens * price.output) / 1_000_000;

    console.log(
      `[ai_usage] kind=${args.kind} model=${args.model} prompt=${prompt_tokens} completion=${completion_tokens} cost=US$${cost_usd.toFixed(6)} user=${args.userId}`,
    );

    await (supabaseAdmin.from as any)("ai_usage_logs").insert({
      user_id: args.userId,
      reading_id: args.readingId,
      model: args.model,
      kind: args.kind,
      prompt_tokens,
      completion_tokens,
      total_tokens,
      cost_usd: Number(cost_usd.toFixed(6)),
    });
  } catch (e) {
    console.error("[ai_usage] log failed:", e);
  }
}

function extractToolJson(aiResponse: any): any {
  const msg = aiResponse?.choices?.[0]?.message;
  const tc = msg?.tool_calls?.[0]?.function?.arguments;
  if (tc) {
    try { return JSON.parse(tc); } catch { /* fallthrough */ }
  }
  const content = msg?.content;
  if (typeof content === "string") {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) { try { return JSON.parse(match[0]); } catch { /* nada */ } }
  }
  return null;
}

const answersSchema = z.object({
  pessoal: z.record(z.string()).default({}),
  relacionamento: z.record(z.string()).default({}),
  trabalho: z.record(z.string()).default({}),
  espiritualidade: z.record(z.string()).default({}),
});

// ============================================================
// Fluxo público (sem login) — prévia com 3 cartas + mini resumo
// ============================================================

export const createPreview = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ answers: answersSchema }).parse(input))
  .handler(async ({ data }) => {
    const all = await drawCards();
    const cards = all.slice(0, 3).map((c, i) => ({ ...c, position: i + 1 }));

    const summaryPrompt = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é uma tarólogo(a) experiente, baseada em AE Waite (Rider-Waite). Escreva em português brasileiro, com tom acolhedor, místico e específico, sem clichês esotéricos genéricos.",
        },
        {
          role: "user",
          content:
            "Com base nas respostas e nas 3 cartas a seguir, escreva um MINI RESUMO (máx. 380 caracteres, 3 a 4 linhas) que dê uma direção geral, instigando a pessoa a querer a leitura completa. Não revele tudo, mas seja específico e tocar nos temas trazidos.\n\n" +
            `Respostas: ${JSON.stringify(data.answers)}\n\nCartas: ${JSON.stringify(
              cards.map((c) => ({ pos: c.position, name: c.name, reversed: c.reversed }))
            )}`,
        },
      ],
    };

    let summary = "Suas cartas trazem um chamado importante para este momento.";
    try {
      const res = await callOpenAI(summaryPrompt);
      summary = res?.choices?.[0]?.message?.content?.trim?.() ?? summary;
    } catch (e) {
      console.error("[createPreview] OpenAI falhou, usando fallback:", e);
    }

    const { data: row, error } = await supabaseAdmin
      .from("reading_previews")
      .insert({ answers: data.answers, cards: cards as any, summary })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    return { id: row.id as string };
  });

export const getPreview = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("reading_previews")
      .select("id, answers, cards, summary, created_at, claimed_reading_id")
      .eq("id", data.id)
      .single();
    if (error || !row) throw new Error("Prévia não encontrada.");
    return {
      id: row.id as string,
      summary: row.summary as string | null,
      cards: row.cards as unknown as StoredCard[],
      created_at: row.created_at as string,
      claimed_reading_id: row.claimed_reading_id as string | null,
    };
  });

export const claimPreview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ previewId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: prev, error: pErr } = await supabaseAdmin
      .from("reading_previews")
      .select("*")
      .eq("id", data.previewId)
      .single();
    if (pErr || !prev) throw new Error("Prévia não encontrada.");

    if (prev.claimed_reading_id) {
      return { id: prev.claimed_reading_id as string };
    }

    const answers = prev.answers as Record<string, Record<string, string>>;
    const preCards = prev.cards as unknown as StoredCard[];

    // Completa o baralho até 10 cartas mantendo as 3 já sorteadas
    const all = await drawCards();
    const used = new Set(preCards.map((c) => c.name_short));
    const extras = all.filter((c) => !used.has(c.name_short)).slice(0, 10 - preCards.length);
    const merged: StoredCard[] = [...preCards, ...extras].slice(0, 10).map((c, i) => ({
      ...c,
      position: i + 1,
      position_label: POSITIONS[i],
    }));

    const { data: row, error: insErr } = await supabase
      .from("readings")
      .insert({
        user_id: userId,
        answers,
        cards: merged as any,
        summary: prev.summary,
        is_unlocked: false,
      })
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);

    await supabaseAdmin
      .from("reading_previews")
      .update({ claimed_by: userId, claimed_reading_id: row.id })
      .eq("id", data.previewId);

    // Já que o usuário acabou de pagar, gera a interpretação completa
    // imediatamente — assim a página de leitura já abre desbloqueada.
    try {
      const prompt = buildFullPrompt(answers, merged);
      const aiRes = await callOpenAI(prompt);
      const full = extractToolJson(aiRes);
      if (full) {
        await supabase
          .from("readings")
          .update({ full_interpretation: full, is_unlocked: true })
          .eq("id", row.id);
        await logUsage({
          userId,
          readingId: row.id,
          model: "gpt-4o-mini",
          kind: "full",
          aiResponse: aiRes,
        });
      }
    } catch (e) {
      console.error("[claimPreview] full interpretation falhou, segue como bloqueada:", e);
    }

    return { id: row.id as string };
  });

export const createReading = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ answers: answersSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const cards = await drawCards();

    // Pequeno resumo (preview gratuito)
    const summaryPrompt = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é uma tarólogo(a) experiente, baseada em AE Waite (Rider-Waite). Escreva em português brasileiro, com tom acolhedor, místico e específico, sem clichês esotéricos genéricos.",
        },
        {
          role: "user",
          content:
            "Com base nas respostas e nas 10 cartas a seguir, escreva um RESUMO de 2 a 3 linhas (máximo 320 caracteres) que dê uma direção geral, sem revelar detalhes carta a carta.\n\n" +
            `Respostas: ${JSON.stringify(data.answers)}\n\nCartas: ${JSON.stringify(
              cards.map((c) => ({ pos: c.position, label: c.position_label, name: c.name, reversed: c.reversed }))
            )}`,
        },
      ],
    };
    const summaryRes = await callOpenAI(summaryPrompt);
    const summary: string = summaryRes?.choices?.[0]?.message?.content?.trim?.() ?? "Sua leitura está pronta.";

    const { data: row, error } = await supabase
      .from("readings")
      .insert({
        user_id: userId,
        answers: data.answers,
        cards: cards as any,
        summary,
        is_unlocked: false,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await logUsage({
      userId,
      readingId: row.id,
      model: "gpt-4o-mini",
      kind: "summary",
      aiResponse: summaryRes,
    });

    return { id: row.id };
  });

// Cria uma leitura completa consumindo um direito (entitlement) de tarot_daily.
// Pula prévia + checkout — usado pelo hub do usuário logado com pacote ativo.
function isSameUTCDay(a: Date, b: Date) {
  return a.getUTCFullYear() === b.getUTCFullYear()
    && a.getUTCMonth() === b.getUTCMonth()
    && a.getUTCDate() === b.getUTCDate();
}
async function consumeTarotDaily(userId: string) {
  const { data: rows, error } = await supabaseAdmin
    .from("user_entitlements")
    .select("*")
    .eq("user_id", userId)
    .eq("kind", "tarot_daily")
    .order("granted_at", { ascending: true });
  if (error) throw new Error(error.message);
  const now = new Date();
  const cand = (rows ?? []).find((e) => {
    if (e.expires_at && new Date(e.expires_at) <= now) return false;
    if (e.total_remaining != null && e.total_remaining <= 0) return false;
    if (e.daily_quota != null && e.last_consumed_at
        && isSameUTCDay(new Date(e.last_consumed_at), now)) return false;
    return true;
  });
  if (!cand) {
    throw new Error("Você não tem leituras disponíveis hoje. Adquira um pacote para continuar.");
  }
  const next: { last_consumed_at: string; total_remaining?: number } = {
    last_consumed_at: now.toISOString(),
  };
  if (cand.total_remaining != null) {
    next.total_remaining = Math.max(0, cand.total_remaining - 1);
  }
  const { error: upErr } = await supabaseAdmin
    .from("user_entitlements").update(next).eq("id", cand.id);
  if (upErr) throw new Error(upErr.message);
}

export const createReadingFromEntitlement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ answers: answersSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // 1) consome o direito (pode lançar)
    await consumeTarotDaily(userId);

    // 2) sorteia + resumo
    const cards = await drawCards();
    const summaryPrompt = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Você é uma tarólogo(a) experiente. PT-BR, acolhedor e específico." },
        { role: "user", content: `Respostas: ${JSON.stringify(data.answers)}\nCartas: ${JSON.stringify(cards.map(c => ({ pos: c.position, name: c.name, reversed: c.reversed })))}\nEscreva 2-3 linhas de abertura (máx 320 chars).` },
      ],
    };
    let summary = "Sua leitura está pronta.";
    try {
      const r = await callOpenAI(summaryPrompt);
      summary = r?.choices?.[0]?.message?.content?.trim?.() ?? summary;
    } catch (e) { console.error("[createReadingFromEntitlement] summary fail", e); }

    // 3) insere já desbloqueada (vamos preencher full_interpretation a seguir)
    const { data: row, error } = await supabase
      .from("readings")
      .insert({
        user_id: userId,
        answers: data.answers,
        cards: cards as any,
        summary,
        is_unlocked: true,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // 4) interpretação completa (best-effort)
    try {
      const prompt = buildFullPrompt(data.answers, cards);
      const ai = await callOpenAI(prompt);
      const full = extractToolJson(ai);
      if (full) {
        await supabase
          .from("readings")
          .update({ full_interpretation: full })
          .eq("id", row.id);
        await logUsage({ userId, readingId: row.id, model: "gpt-4o-mini", kind: "full", aiResponse: ai });
      }
    } catch (e) { console.error("[createReadingFromEntitlement] full fail", e); }

    return { id: row.id };
  });

function buildFullPrompt(answers: unknown, cards: StoredCard[]) {
  return {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Você é uma tarólogo(a) profundo(a) e empático(a), formado(a) na tradição Rider-Waite (AE Waite, The Pictorial Key to the Tarot). Escreva em português brasileiro. Personalize TUDO com base nas respostas do consulente. Evite clichês. Seja específico, simbólico e humano. Mencione o nome da carta e se ela está invertida quando relevante.",
      },
      {
        role: "user",
        content:
          `Respostas do consulente:\n${JSON.stringify(answers)}\n\n` +
          `Tiragem (Cruz Celta — 10 cartas):\n${JSON.stringify(
            cards.map((c) => ({
              pos: c.position,
              label: c.position_label,
              name: c.name,
              reversed: c.reversed,
              meaning: c.reversed ? c.meaning_rev : c.meaning_up,
            }))
          )}\n\nGere a leitura completa.`,
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "deliver_reading",
          description: "Estrutura completa da leitura personalizada.",
          parameters: {
            type: "object",
            properties: {
              opening: { type: "string", description: "Abertura acolhedora de 2-3 linhas." },
              cards: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    position: { type: "number" },
                    title: { type: "string", description: "Nome da carta + posição." },
                    interpretation: { type: "string", description: "3-5 linhas personalizadas." },
                  },
                  required: ["position", "title", "interpretation"],
                },
              },
              synthesis: {
                type: "object",
                properties: {
                  pessoal: { type: "string" },
                  relacionamento: { type: "string" },
                  trabalho: { type: "string" },
                  espiritualidade: { type: "string" },
                },
                required: ["pessoal", "relacionamento", "trabalho", "espiritualidade"],
              },
              closing: { type: "string", description: "Mensagem de encerramento / conselho final." },
            },
            required: ["opening", "cards", "synthesis", "closing"],
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "deliver_reading" } },
  };
}

export const unlockReading = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: reading, error: readErr } = await supabase
      .from("readings")
      .select("*")
      .eq("id", data.id)
      .single();
    if (readErr || !reading) throw new Error("Leitura não encontrada.");

    if (reading.is_unlocked && reading.full_interpretation) {
      return { ok: true };
    }

    const cards = reading.cards as unknown as StoredCard[];
    const prompt = buildFullPrompt(data_answers(reading.answers), cards);
    const aiRes = await callOpenAI(prompt);
    const full = extractToolJson(aiRes);
    if (!full) throw new Error("A interpretação não retornou no formato esperado. Tente novamente.");

    const { error: upErr } = await supabase
      .from("readings")
      .update({ full_interpretation: full, is_unlocked: true })
      .eq("id", data.id);
    if (upErr) throw new Error(upErr.message);

    await logUsage({
      userId: context.userId,
      readingId: data.id,
      model: "gpt-4o-mini",
      kind: "full",
      aiResponse: aiRes,
    });

    return { ok: true };
  });

function data_answers(raw: unknown) {
  // permissive cast for jsonb
  return raw as Record<string, Record<string, string>>;
}

export const getReading = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: reading, error } = await supabase
      .from("readings")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !reading) throw new Error("Leitura não encontrada.");
    const cards = reading.cards as unknown as StoredCard[];
    return {
      id: reading.id,
      created_at: reading.created_at,
      summary: reading.summary,
      is_unlocked: reading.is_unlocked,
      cards: reading.is_unlocked ? cards : cards.slice(0, 3),
      hidden_count: reading.is_unlocked ? 0 : Math.max(0, cards.length - 3),
      full_interpretation: reading.is_unlocked ? reading.full_interpretation : null,
    };
  });

export const listReadings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("readings")
      .select("id, created_at, summary, is_unlocked")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data;
  });