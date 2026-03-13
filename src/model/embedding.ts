export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(apiKey: string, model = 'gemini-embedding-exp-03-07') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async embed(text: string): Promise<number[]> {
    const [result] = await this.embedBatch([text]);
    return result;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const url = `${this.baseUrl}/models/${this.model}:batchEmbedContents?key=${this.apiKey}`;
    const body = {
      requests: texts.map((text) => ({
        model: `models/${this.model}`,
        content: { parts: [{ text }] },
      })),
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini embedding API error (${res.status}): ${err}`);
    }

    const data = (await res.json()) as {
      embeddings: Array<{ values: number[] }>;
    };

    return data.embeddings.map((e) => e.values);
  }
}

/** Serialize a float64 array to a Buffer for SQLite BLOB storage. */
export function serializeEmbedding(embedding: number[]): Buffer {
  const buf = Buffer.alloc(embedding.length * 8);
  for (let i = 0; i < embedding.length; i++) {
    buf.writeDoubleLE(embedding[i], i * 8);
  }
  return buf;
}

/** Deserialize a Buffer from SQLite back to a number array. */
export function deserializeEmbedding(buf: Buffer): number[] {
  const count = buf.length / 8;
  const result = new Array<number>(count);
  for (let i = 0; i < count; i++) {
    result[i] = buf.readDoubleLE(i * 8);
  }
  return result;
}

/** Cosine similarity between two vectors. Returns value in [-1, 1]. */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
