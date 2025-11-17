// src/api/authService.ts
import { apiGet, apiPost } from "./http";
import { supabase } from "../supabase";
import type {
  LoginResponse,
  PermissaoDTO,
  PerfilLocalStorage,
} from "../types/auth";

export function parseJwt(token: string): Record<string, any> {
  try {
    const base = token.split(".")[1];
    const json = atob(base.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return {};
  }
}

// ---- chamadas à API do backend ----

export async function loginBackend(email: string, senha: string): Promise<LoginResponse> {
  // IMPORTANTE: endpoint correto e campo "senha"
  return await apiPost<LoginResponse>("/auth/login", { email, senha });
}

export async function login2FABackend(session: string, code: string): Promise<{ token: string }> {
  // Quando você implementar no Quarkus: POST /auth/login/2fa
  return await apiPost<{ token: string }>("/auth/login/2fa", { session, code });
}

export async function fetchPermissoesBackend(userEmail: string, token: string) {
  // Ajuste a rota se no backend estiver diferente
  return await apiGet<PermissaoDTO[]>(
    `/permissoes?email=${encodeURIComponent(userEmail)}`,
    token
  );
}

// ---- Supabase fallback ----

export async function fetchPermissoesSupabase(userEmail: string) {
  const { data, error, status } = await supabase
    .from("vw_permissoes_extendida")
    .select("usuario_email, empresa_nome, role, permissao_ativa")
    .eq("usuario_email", userEmail);

  if (error) {
    console.error("vw_permissoes_extendida error:", status, error.message);
    throw new Error("Falha ao consultar permissões");
  }
  return (data ?? []) as PermissaoDTO[];
}

// ---- persistência em localStorage + roteamento ----

export function persistPerfilAndToken(
  perms: PermissaoDTO[],
  emailFromToken: string,
  token: string
): { perfil: PerfilLocalStorage; destino: string } {
  if (!perms.length) {
    throw new Error("Nenhuma permissão encontrada para este usuário.");
  }

  const first = perms[0];
  if (first?.permissao_ativa === false) {
    throw new Error("Seu acesso está desativado. Contate o administrador.");
  }

  // Guarda o JWT
  localStorage.setItem("blanche:token", token);

  const perfil: PerfilLocalStorage = {
    email: first?.usuario_email ?? emailFromToken,
    role: first?.role ?? null,
    empresa: first?.empresa_nome ?? null,
    ativo: first?.permissao_ativa ?? null,
  };
  localStorage.setItem("blanche:perfil", JSON.stringify(perfil));

  const roleUpper = (first?.role ?? "").toUpperCase();
  const destino = roleUpper === "ADMIN" ? "/admin" : "/home";

  return { perfil, destino };
}
