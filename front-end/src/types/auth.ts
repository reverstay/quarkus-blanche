// src/types/auth.ts

// DTO que reflete o que o backend Quarkus devolve em /auth/login
// (veio do LoginResponseDTO em Kotlin)
export type UsuarioResponseDTO = {
  id: string;
  nome: string;
  email: string;
  cargo: number;      // int2 no banco → number no front
  online: boolean;
  emailVerificado: boolean;
  twoFactorEnabled: boolean;
  criadoEm: string;   // OffsetDateTime → string ISO
  atualizadoEm: string;
};

// Resposta do login (sem 2FA por enquanto)
export type LoginResponse = {
  token: string;
  usuario: UsuarioResponseDTO;
};

// Perfil que vamos guardar no localStorage
export type PerfilFront = {
  email: string | null;
  role: number | null;    // 1=ADMIN, 2=DIRETOR, 3=FUNCIONARIO
  empresa: string | null; // depois podemos preencher com empresa/unidade
  ativo: boolean;
};

/**
 * Constrói o perfil que vai pro localStorage
 * a partir da resposta do /auth/login.
 */
export function buildPerfilFromLogin(
  resp: LoginResponse,
  fallbackEmail?: string
): PerfilFront {
  const { usuario } = resp;

  const email =
    usuario?.email ??
    fallbackEmail ??
    null;

  let role: number | null = null;
  if (typeof usuario?.cargo === "number") {
    role = usuario.cargo;
  } else if (usuario && (usuario as any).cargo != null) {
    const n = Number((usuario as any).cargo);
    role = Number.isFinite(n) ? n : null;
  }

  return {
    email,
    role,
    empresa: null,
    ativo: true,
  };
}
