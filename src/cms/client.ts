export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
let csrf = "";
export async function api<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  if (csrf) headers.set("X-CSRF-Token", csrf);
  const read =
    !options.method || ["GET", "HEAD"].includes(options.method.toUpperCase());
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  if (options.signal?.aborted) controller.abort();
  const timer = read
    ? setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, 20000)
    : undefined;
  try {
    const response = await fetch(path, {
      ...options,
      headers,
      credentials: "same-origin",
      signal: read ? controller.signal : options.signal,
    });
    let result;
    try {
      result = await response.json();
    } catch {
      throw new ApiError(
        "Server mengembalikan respons yang belum dapat dibaca. Silakan coba lagi.",
        502,
      );
    }
    if (!response.ok)
      throw new ApiError(result.error || "Permintaan gagal.", response.status);
    if (result.csrf) csrf = result.csrf;
    return result;
  } catch (error) {
    if (timedOut)
      throw new ApiError(
        "Server belum merespons. Periksa koneksi Anda dan coba lagi.",
        408,
      );
    if (error instanceof TypeError && !options.signal?.aborted)
      throw new ApiError(
        "Koneksi terputus. Periksa koneksi Anda dan coba lagi.",
        0,
      );
    throw error;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", abort);
  }
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
