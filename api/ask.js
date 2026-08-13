// RAG endpoint: retrieve grounded chunks, answer with citations, defer when unknown.
// ENV: OPENAI_API_KEY
import { retrieve } from "../lib/rag.js";

// --- Abuse guardrails (per-instance, best-effort; generous so real leads never hit them) ---
const MAX_INPUT_CHARS = 1000;
const PER_MIN = 15, PER_HOUR = 120, GLOBAL_PER_HOUR = 600;
const LIMIT_MSG = "You've reached this demo's limit for now — it's a portfolio demo, so usage is capped. " +
  "Want a custom AI assistant for your business? Message me on Fiverr (lughut) or adilzubari852@gmail.com.";
const ipHits = new Map();
let globalHour = { count: 0, ts: Date.now() };
function guard(ip) {
  const now = Date.now();
  if (now - globalHour.ts > 3600_000) globalHour = { count: 0, ts: now };
  globalHour.count++;
  if (globalHour.count > GLOBAL_PER_HOUR) return false;
  const rec = ipHits.get(ip) || { m: 0, mts: now, h: 0, hts: now };
  if (now - rec.mts > 60_000) { rec.m = 0; rec.mts = now; }
  if (now - rec.hts > 3600_000) { rec.h = 0; rec.hts = now; }
  rec.m++; rec.h++;
  ipHits.set(ip, rec);
  return rec.m <= PER_MIN && rec.h <= PER_HOUR;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const ip = (req.headers["x-forwarded-for"] || "anon").split(",")[0];
  if (!guard(ip)) return res.status(429).json({ answer: LIMIT_MSG, sources: [] });
  try {
    let { question = "" } = req.body || {};
    if (!question.trim()) return res.status(400).json({ error: "question required" });
    question = String(question).slice(0, MAX_INPUT_CHARS);

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
