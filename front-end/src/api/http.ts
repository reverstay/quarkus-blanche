// src/api/http.ts

// Garante que se a variável estiver vazia, usamos string vazia (caminho relativo)
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/+$/, "") || "";

export async function apiPost<T = any>(path: string, body: any, token?: string): Promise<T> {
  // O navegador vai resolver isso para: https://blanche.neuverse.com.br/auth/login
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
    method: "GET", // Boa prática explicitar
    headers: {
      "Content-Type": "application/json",
      // CORREÇÃO CRÍTICA: Adicionado o cabeçalho de autorização aqui
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Erro ${res.status} ao chamar ${path}`); // Use console.error para erros
    throw new Error(text || `Erro ${res.status} ao chamar ${path}`);
  }
  return (await res.json()) as T;
}