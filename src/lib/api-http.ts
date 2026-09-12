import { z } from "zod";

/** JSON helpers shared by the REST route handlers. Client-safe: no server imports. */
export function json(body: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}

export function jsonError(message: string, status: number) {
  return json({ error: message }, status);
}

export const deviceIdSchema = z.string().min(8).max(100);
export const memeIdSchema = z.string().uuid();

/** Parse a JSON request body, returning null when it is not valid JSON. */
export async function readJsonBody(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** Map a thrown value to a JSON error response. */
export function serverError(context: string, error: unknown) {
  console.error(`[api] ${context}:`, error instanceof Error ? error.message : error);
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  return jsonError(message, 500);
}
