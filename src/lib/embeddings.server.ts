// Server-only helper for Lovable AI Gateway embeddings.
export async function embedTexts(apiKey: string, inputs: string[]): Promise<number[][]> {
  if (inputs.length === 0) return [];
  const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "raw-fetch",
    },
    body: JSON.stringify({
      model: "openai/text-embedding-3-small",
      input: inputs,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("Embedding rate limit. Try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please add credits.");
    throw new Error(`Embedding error ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { data: Array<{ embedding: number[]; index: number }> };
  const sorted = [...json.data].sort((a, b) => a.index - b.index);
  return sorted.map((d) => d.embedding);
}

export async function embedOne(apiKey: string, input: string): Promise<number[]> {
  const [v] = await embedTexts(apiKey, [input]);
  return v;
}
