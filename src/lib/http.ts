// src/lib/http.ts
export async function parseJsonSafe<T>(res: Response): Promise<T> {
  const text = await res.text();
  try { return JSON.parse(text) as T; }
  catch {
    throw new Error(`Resposta inválida (${res.status}): ${text.slice(0, 180)}`);
  }
}
