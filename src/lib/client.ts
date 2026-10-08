/** Browser-side helper for calling the JSON API. Throws an Error with the server's message. */
export async function apiRequest<T = Record<string, unknown>>(
  url: string,
  { method = "POST", json, form }: { method?: string; json?: unknown; form?: FormData } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: json === undefined ? undefined : { "Content-Type": "application/json" },
      body: form ?? (json === undefined ? undefined : JSON.stringify(json)),
      cache: "no-store",
    });
  } catch {
    throw new Error("You appear to be offline. Check your connection and try again.");
  }
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Something went wrong. Please try again.");
  return payload;
}

export const errorMessage = (error: unknown, fallback = "Something went wrong. Please try again.") =>
  error instanceof Error ? error.message : fallback;
