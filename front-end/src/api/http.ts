// src/api/http.ts
const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/+$/, "") || "";

export async function apiPost<T = any>(path: string, body: any, token?: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Erro ${res.status} ao chamar ${path}`);
  }
  return (await res.json()) as T;
}

export async function apiGet<T = any>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
  });
  if (!res.ok) {
    const text = await res.text();
    console.log(`Erro ${res.status} ao chamar ${path}`);
    console.log(token)
    throw new Error(text || `Erro ${res.status} ao chamar ${path}`);
  }
  return (await res.json()) as T;
}
