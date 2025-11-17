// src/types/auth.ts
export type PermissaoDTO = {
  role: string | null;
  permissao_ativa: boolean | null;
  usuario_email?: string | null;
  empresa_nome?: string | null;
};

export type UsuarioDTO = {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  online: boolean;
  emailVerificado: boolean;
  twoFactorEnabled: boolean;
  criadoEm: string;
  atualizadoEm: string;
};

export type LoginResponseSem2FA = {
  token: string;
  usuario: UsuarioDTO;
};

// se no futuro você implementar 2FA, mantém a união:
export type LoginResponse2FA = {
  requires2FA: true;
  session: string;
  email: string;
};

export type LoginResponse = LoginResponseSem2FA | LoginResponse2FA;

export type PerfilLocalStorage = {
  email: string | null;
  role: string | null;
  empresa: string | null;
  ativo: boolean | null;
};
