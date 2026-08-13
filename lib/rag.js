// Minimal RAG: embed chunks once (cached in module memory), then for each query embed it,
// rank chunks by cosine similarity, and return the top-k for grounding.
import { chunkDocuments } from "./docs.js";

const EMBED_MODEL = "text-embedding-3-small";
let INDEX = null; // { chunks: [{id,source,text,embedding}] }

async function embed(texts) {
  const r = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
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

// Build the index once (cold start). ~20 chunks = one cheap embeddings call.
export async function ensureIndex() {
  if (INDEX) return INDEX;
  const chunks = chunkDocuments();
  const embeddings = await embed(chunks.map((c) => c.text));
  INDEX = { chunks: chunks.map((c, i) => ({ ...c, embedding: embeddings[i] })) };
  return INDEX;
}

export async function retrieve(query, k = 4) {
  const idx = await ensureIndex();
  const [qEmb] = await embed([query]);
  return idx.chunks
    .map((c) => ({ ...c, score: cosine(qEmb, c.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
