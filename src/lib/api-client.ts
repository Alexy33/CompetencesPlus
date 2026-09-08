const FALLBACK_MESSAGE = "Une erreur inattendue est survenue.";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; message: string };

async function readPayload(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function messageOf(payload: unknown): string {
  const message = (payload as { error?: { message?: unknown } } | null)?.error?.message;
  return typeof message === "string" ? message : FALLBACK_MESSAGE;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  const response = await fetch(path, init);
  const payload = await readPayload(response);

  return response.ok
    ? { ok: true, data: payload as T }
    : { ok: false, message: messageOf(payload) };
}

export function apiSend<T>(
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  return apiRequest<T>(path, {
    method,
    ...(body === undefined
      ? {}
      : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
}

export function apiUpload<T>(path: string, file: File): Promise<ApiResult<T>> {
  return apiRequest<T>(path, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
}

export async function apiLoad<T>(path: string): Promise<T | null> {
  const result = await apiRequest<T>(path);
  return result.ok ? result.data : null;
}
