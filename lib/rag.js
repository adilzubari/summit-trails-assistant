// Retrieval over the chunked docs. Uses embeddings when an embeddings-capable provider is
// configured (OpenAI); otherwise falls back to lexical (keyword-overlap) scoring so the demo
// works on any OpenAI-compatible chat provider (e.g. DeepSeek) without an embeddings endpoint.
import { chunkDocuments } from "./docs.js";

const EMBED_MODEL = "text-embedding-3-small";
const USE_EMBEDDINGS = process.env.USE_EMBEDDINGS === "1"; // opt-in; needs an embeddings API
let INDEX = null;

async function embed(texts) {
  const base = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const r = await fetch(`${base}/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: EMBED_MODEL, input: texts }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || "embeddings failed");
  return data.data.map((d) => d.embedding);
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

const tokenize = (s) => (s.toLowerCase().match(/[a-z0-9]+/g) || []).filter((t) => t.length > 2);

// Lexical overlap score: shared tokens weighted by rarity across chunks (light TF-IDF).
function lexicalRank(query, chunks) {
  const df = new Map();
  const chunkToks = chunks.map((c) => {
    const toks = new Set(tokenize(c.text));
    toks.forEach((t) => df.set(t, (df.get(t) || 0) + 1));
    return toks;
  });
  const N = chunks.length;
  const qToks = tokenize(query);
  return chunks.map((c, i) => {
    let score = 0;
    for (const t of qToks) {
      if (chunkToks[i].has(t)) score += Math.log(1 + N / (df.get(t) || 1));
    }
    return { ...c, score };
  });
}

export async function ensureIndex() {
  if (INDEX) return INDEX;
  const chunks = chunkDocuments();
  if (USE_EMBEDDINGS) {
    const embeddings = await embed(chunks.map((c) => c.text));
    INDEX = { mode: "embeddings", chunks: chunks.map((c, i) => ({ ...c, embedding: embeddings[i] })) };
  } else {
    INDEX = { mode: "lexical", chunks };
  }
  return INDEX;
}

export async function retrieve(query, k = 4) {
  const idx = await ensureIndex();
  let ranked;
  if (idx.mode === "embeddings") {
    const [qEmb] = await embed([query]);
    ranked = idx.chunks.map((c) => ({ ...c, score: cosine(qEmb, c.embedding) }));
  } else {
    ranked = lexicalRank(query, idx.chunks);
  }
  return ranked.sort((a, b) => b.score - a.score).slice(0, k);
}
