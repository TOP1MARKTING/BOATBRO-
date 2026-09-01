import type { KnowledgeChunk, Lang } from "./types.js";

const SYSTEM_PROMPT = {
  ar: `أنت مساعد بوت برو (BoatPro) — منصّة تقنية بحرية في المملكة العربية السعودية.
أجب بلغة عربية واضحة ومختصرة. استخدم سياق المعرفة أدناه عند الإجابة.
إذا لم تجد إجابة في السياق، اقترح التواصل عبر wa.me/966502554747 أو Info@boatpro.club.
لا تختلق أسعارًا أو توفرًا غير مذكور.`,
  en: `You are the BoatPro assistant — a marine technology platform in Saudi Arabia.
Reply in clear, concise English. Use the knowledge context below when answering.
If the answer is not in the context, suggest contacting wa.me/966502554747 or Info@boatpro.club.
Do not invent prices or availability.`,
};

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
};

export async function generateChatReply(input: {
  apiKey: string;
  lang: Lang;
  message: string;
  history: Array<{ role: "user" | "model"; content: string }>;
  knowledge: KnowledgeChunk[];
}) {
  const context = input.knowledge
    .map((chunk) => `## ${chunk.title}\n${chunk.body}`)
    .join("\n\n")
    .slice(0, 12000);

  const contents = [
    ...input.history.slice(-8).map((entry) => ({
      role: entry.role,
      parts: [{ text: entry.content }],
    })),
    { role: "user" as const, parts: [{ text: input.message }] },
  ];

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(input.apiKey)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: `${SYSTEM_PROMPT[input.lang]}\n\n--- Knowledge ---\n${context || "(no synced knowledge yet)"}`,
            },
          ],
        },
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 800,
        },
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`gemini-error:${res.status}:${text.slice(0, 200)}`);
  }

  const payload = (await res.json()) as GeminiResponse;
  const reply = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!reply) throw new Error("empty-reply");
  return reply;
}
