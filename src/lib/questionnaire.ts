export type ThemeKey = "pessoal" | "relacionamento" | "trabalho" | "espiritualidade";

export interface ThemeDef {
  key: ThemeKey;
  label: string;
  description: string;
  multipleChoice: { id: string; question: string; options: string[] }[];
  open: { id: string; question: string; placeholder: string };
}

export const THEMES: ThemeDef[] = [
  {
    key: "pessoal",
    label: "Vida Pessoal",
    description: "Como você está consigo mesma(o) neste momento.",
    multipleChoice: [
      { id: "humor", question: "Como descreveria seu humor nas últimas semanas?", options: ["Leve e otimista", "Oscilante", "Pesado e cansado", "Em transformação"] },
      { id: "saude", question: "E sua energia / saúde?", options: ["Ótima", "Razoável", "Baixa", "Estou cuidando"] },
      { id: "mudanca", question: "Você sente que precisa de uma mudança?", options: ["Sim, urgente", "Aos poucos", "Talvez", "Não, está bom"] },
    ],
    open: { id: "contexto", question: "O que mais pesa na sua vida pessoal agora?", placeholder: "Escreva livremente..." },
  },
  {
    key: "relacionamento",
    label: "Relacionamento",
    description: "Vínculos afetivos, família e parcerias.",
    multipleChoice: [
      { id: "status", question: "Situação afetiva atual?", options: ["Sozinha(o)", "Em relacionamento estável", "Recém-começando", "Em término / dúvida"] },
      { id: "satisfacao", question: "Como avalia seus vínculos?", options: ["Plena", "Boa, com ajustes", "Conturbada", "Distante"] },
      { id: "foco", question: "Onde você quer foco?", options: ["Amor romântico", "Família", "Amizades", "Reconciliação"] },
    ],
    open: { id: "contexto", question: "Tem alguém ou alguma situação específica em mente?", placeholder: "Pode ser uma pessoa, uma decisão..." },
  },
  {
    key: "trabalho",
    label: "Trabalho & Carreira",
    description: "Profissão, propósito e finanças.",
    multipleChoice: [
      { id: "fase", question: "Em que fase você está?", options: ["Estável", "Crescendo", "Estagnada", "Em transição"] },
      { id: "satisfacao", question: "Está satisfeita com o que faz?", options: ["Muito", "Razoavelmente", "Pouco", "Quero mudar"] },
      { id: "financas", question: "E sua relação com dinheiro?", options: ["Tranquila", "Apertada mas estável", "Preocupante", "Em expansão"] },
    ],
    open: { id: "contexto", question: "Qual sua maior pergunta sobre trabalho ou carreira agora?", placeholder: "Pode ser uma decisão, projeto, ambição..." },
  },
  {
    key: "espiritualidade",
    label: "Espiritualidade",
    description: "Conexão interior, propósito e intuição.",
    multipleChoice: [
      { id: "pratica", question: "Você tem alguma prática espiritual?", options: ["Sim, diária", "De vez em quando", "Quero começar", "Não pratico"] },
      { id: "conexao", question: "Como sente sua conexão interior?", options: ["Forte", "Em busca", "Confusa", "Distante"] },
      { id: "intuicao", question: "Tem confiado na sua intuição?", options: ["Sempre", "Às vezes", "Raramente", "Estou aprendendo"] },
    ],
    open: { id: "contexto", question: "O que sua alma anda pedindo?", placeholder: "Sem julgamento, escreva o que vier..." },
  },
];

export type Answers = Record<ThemeKey, Record<string, string>>;

export function emptyAnswers(): Answers {
  return THEMES.reduce((acc, t) => {
    acc[t.key] = {};
    return acc;
  }, {} as Answers);
}