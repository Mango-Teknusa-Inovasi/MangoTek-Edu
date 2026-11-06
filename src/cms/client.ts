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

export function uploadImage(
  file: File,
  options: { signal: AbortSignal; onProgress: (percent: number) => void },
): Promise<import("./media").MediaAsset> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    const cleanup = () => options.signal.removeEventListener("abort", abort);
    xhr.open("POST", "/api/office/media");
    xhr.timeout = 120000;
    if (csrf) xhr.setRequestHeader("X-CSRF-Token", csrf);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable)
        options.onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      cleanup();
      let result;
      try {
        result = JSON.parse(xhr.responseText);
      } catch {
        reject(Error("Server belum dapat dijangkau. Silakan coba lagi."));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(result);
      else
        reject(
          Error(result.error || "Unggah gambar gagal. Silakan coba lagi."),
        );
    };
    xhr.onerror = xhr.ontimeout = () => {
      cleanup();
      reject(Error("Koneksi unggah terputus. Silakan coba lagi."));
    };
    xhr.onabort = () => {
      cleanup();
      reject(new DOMException("Unggahan dibatalkan.", "AbortError"));
    };
    options.signal.addEventListener("abort", abort, { once: true });
    if (options.signal.aborted) {
      cleanup();
      reject(new DOMException("Unggahan dibatalkan.", "AbortError"));
      return;
    }
    const body = new FormData();
    body.set("file", file);
    xhr.send(body);
  });
}
