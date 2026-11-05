let csrf = "";
export async function api<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  if (csrf) headers.set("X-CSRF-Token", csrf);
  const response = await fetch(path, {
    ...options,
    headers,
    credentials: "same-origin",
  });
  const result = await response
    .json()
    .catch(() => ({ error: "Server belum dapat dijangkau." }));
  if (!response.ok) throw Error(result.error || "Permintaan gagal.");
  if (result.csrf) csrf = result.csrf;
  return result;
}
export const send = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
});
