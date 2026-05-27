import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/db/auth-middleware";
import { supabaseAdmin } from "@/integrations/db/client.server";

const inputSchema = z.object({
  birth_name: z.string().min(1).max(120),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birth_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/)
    .optional()
    .nullable(),
  birth_place: z.string().min(1).max(160),
});

async function callOpenAI(payload: object) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY não configurada");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`OpenAI: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

function extractToolJson(aiResponse: any): any {
  const msg = aiResponse?.choices?.[0]?.message;
  const tc = msg?.tool_calls?.[0]?.function?.arguments;
  if (tc) {
    try { return JSON.parse(tc); } catch { /* nada */ }
  }
  const content = msg?.content;
  if (typeof content === "string") {
    const m = content.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch { /* nada */ } }
  }
  return null;
}

export const createAstralChart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Cria o registro primeiro pra reservar o id
    const { data: row, error } = await supabase
      .from("astral_charts")
      .insert({
        user_id: userId,
        birth_name: data.birth_name,
        birth_date: data.birth_date,
        birth_time: data.birth_time ?? null,
        birth_place: data.birth_place,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const prompt = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é um(a) astrólogo(a) profundo(a) e poético(a), formado(a) na tradição ocidental. Escreva em português brasileiro, tom acolhedor e simbólico, sem clichês. Personalize tudo com base nos dados de nascimento.",
        },
        {
          role: "user",
          content: `Dados de nascimento:\nNome: ${data.birth_name}\nData: ${data.birth_date}\nHora: ${data.birth_time ?? "desconhecida"}\nLocal: ${data.birth_place}\n\nProduza um retrato astrológico estimado. Sem hora exata, infira o ascendente como provável e marque "estimado".`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "deliver_chart",
            description: "Mapa astral interpretado.",
            parameters: {
              type: "object",
              properties: {
                sun: { type: "object", properties: {
                  sign: { type: "string" },
                  reading: { type: "string", description: "3-4 linhas sobre a essência solar." },
                }, required: ["sign", "reading"] },
                moon: { type: "object", properties: {
                  sign: { type: "string" },
                  reading: { type: "string", description: "3-4 linhas sobre emoções e mundo interior." },
                }, required: ["sign", "reading"] },
                ascendant: { type: "object", properties: {
                  sign: { type: "string" },
                  estimated: { type: "boolean" },
                  reading: { type: "string", description: "3-4 linhas sobre máscara social e primeiro impacto." },
                }, required: ["sign", "reading", "estimated"] },
                opening: { type: "string", description: "Abertura poética 2-3 linhas." },
                synthesis: { type: "string", description: "Síntese final 4-6 linhas." },
                advice: { type: "string", description: "Conselho prático 2-3 linhas." },
              },
              required: ["sun", "moon", "ascendant", "opening", "synthesis", "advice"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "deliver_chart" } },
    };

    try {
      const ai = await callOpenAI(prompt);
      const interpretation = extractToolJson(ai);
      if (interpretation) {
        await supabase
          .from("astral_charts")
          .update({ interpretation })
          .eq("id", row.id);
      }
    } catch (e) {
      console.error("[createAstralChart] OpenAI falhou:", e);
    }

    return { id: row.id };
  });

export const getAstralChart = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("astral_charts")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !row) throw new Error("Mapa não encontrado.");
    return row;
  });