// src/api/http.ts
const API_BASE = import.meta.env.VITE_API_BASE || "";

function resolveUrl(path: string): string {
  if (!API_BASE || !/^https?:\/\//i.test(API_BASE)) {
    // usando proxy do Vite
    return path;
  }
  return API_BASE.replace(/\/+$/, "") + path;
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const url = resolveUrl(path);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    throw new Error(`Erro ${res.status} ao chamar ${path}`);
  }

  return (await res.json()) as T;
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  token?: string
): Promise<T> {
  const url = resolveUrl(path);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Erro ${res.status} ao chamar ${path}${
        text ? `: ${text}` : ""
      }`
    );
  }

  return (await res.json()) as T;
}
