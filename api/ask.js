// RAG endpoint: retrieve grounded chunks, answer with citations, defer when unknown.
// ENV: OPENAI_API_KEY
import { retrieve } from "../lib/rag.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { question = "" } = req.body || {};
    if (!question.trim()) return res.status(400).json({ error: "question required" });

    const hits = await retrieve(question, 4);
    const context = hits.map((h, i) => `[${i + 1}] (${h.source}) ${h.text}`).join("\n\n");

    const system = `You are the Summit Trails assistant. Answer ONLY using the context below.
If the answer is not in the context, say you're not sure and offer to connect the user to the team.
Cite sources inline like [1], [2] matching the context blocks. Be concise (2-4 sentences).

CONTEXT:
${context}`;

    const BASE = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const r = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        max_tokens: 350,
        messages: [
          { role: "system", content: system },
          { role: "user", content: question },
        ],
      }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error?.message || "chat failed");

    res.status(200).json({
      answer: data.choices[0].message.content,
      sources: hits.map((h, i) => ({ n: i + 1, source: h.source, score: Number(h.score.toFixed(3)), text: h.text })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ answer: "Sorry, I hit a snag. Please try again shortly.", sources: [] });
  }
}
