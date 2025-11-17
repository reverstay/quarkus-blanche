import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import BackgroundBubbles from "../components/BackgroundBubbles";

type PermissaoDTO = {
  role: string | null;
  permissao_ativa: boolean | null;
  usuario_email?: string | null;
  empresa_nome?: string | null;
};

type LoginResponse =
  | { token: string } // fluxo sem 2FA
  | { requires2FA: true; session: string; email: string }; // fluxo com 2FA

const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/+$/, "") || "";

function parseJwt(token: string): Record<string, any> {
  try {
    const base = token.split(".")[1];
    const json = atob(base.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return {};
  }
}

async function apiPost<T = any>(path: string, body: any, token?: string): Promise<T> {
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

async function apiGet<T = any>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Erro ${res.status} ao chamar ${path}`);
  }
  return (await res.json()) as T;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Estado do 2FA
  const [twoFA, setTwoFA] = useState<{ session: string; email: string } | null>(null);
  const [twoFACode, setTwoFACode] = useState("");

  const nav = useNavigate();

  async function fetchPermissoesBackend(userEmail: string, token: string) {
    // Espera-se um endpoint GET /permissoes?email=...
    // Ajuste o caminho se sua API usar outro route.
    return await apiGet<PermissaoDTO[]>(
      `/permissoes?email=${encodeURIComponent(userEmail)}`,
      token
    );
  }

  async function fetchPermissoesSupabase(userEmail: string) {
    // Fallback: sua view atual no Supabase
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

  function persistAndRoute(perms: PermissaoDTO[], emailFromToken: string, token: string) {
    if (!perms.length) {
      throw new Error("Nenhuma permissão encontrada para este usuário.");
    }

    const first = perms[0];
    if (first?.permissao_ativa === false) {
      throw new Error("Seu acesso está desativado. Contate o administrador.");
    }

    // Guarda o JWT para chamadas futuras ao backend
    localStorage.setItem("blanche:token", token);

    // Guarda perfil (mantive seu formato)
    const payload = {
      email: first?.usuario_email ?? emailFromToken,
      role: first?.role ?? null,
      empresa: first?.empresa_nome ?? null,
      ativo: first?.permissao_ativa ?? null,
    };
    localStorage.setItem("blanche:perfil", JSON.stringify(payload));

    // Redireciona por role
    const roleUpper = (first?.role ?? "").toUpperCase();
    nav(roleUpper === "ADMIN" ? "/admin" : "/home", { replace: true });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!email || !password) {
      setErr("Preencha todos os campos");
      return;
    }

    setLoading(true);
    setHint("Autenticando…");
    try {
      // 1) Autentica no Quarkus
      const resp = await apiPost<LoginResponse>("/login", { email, password });

      // 2) Se 2FA requerido, exibir etapa 2
      if ("requires2FA" in resp && resp.requires2FA) {
        setTwoFA({ session: resp.session, email: resp.email });
        setHint("Código 2FA requerido. Verifique seu app de autenticação.");
        return; // para aqui; o restante ocorre no submit do 2FA
      }

      // 3) Sem 2FA: recebemos token
      const token = resp.token;
      const claims = parseJwt(token);
      const emailFromToken: string = claims.email || claims.sub || email;

      // 4) Buscar permissões (backend -> fallback supabase)
      setHint("Verificando permissões…");
      let perms: PermissaoDTO[] = [];
      try {
        perms = await fetchPermissoesBackend(emailFromToken, token);
      } catch (e) {
        // opcional: logar o erro do backend e tentar Supabase
        console.warn("Permissões via backend falharam; tentando Supabase…", e);
        perms = await fetchPermissoesSupabase(emailFromToken);
      }

      // 5) Persistir e navegar
      persistAndRoute(perms, emailFromToken, token);
    } catch (ex: any) {
      setErr(ex?.message ?? String(ex));
    } finally {
      setLoading(false);
      setHint(null);
    }
  }

  async function onSubmit2FA(e: React.FormEvent) {
    e.preventDefault();
    if (!twoFA) return;

    setErr(null);
    setLoading(true);
    setHint("Validando 2FA…");
    try {
      // Endpoint esperado: POST /login/2fa { session, code } -> { token }
      const data = await apiPost<{ token: string }>(
        "/login/2fa",
        { session: twoFA.session, code: twoFACode }
      );

      const token = data.token;
      const claims = parseJwt(token);
      const emailFromToken: string = claims.email || claims.sub || twoFA.email;

      setHint("Verificando permissões…");
      let perms: PermissaoDTO[] = [];
      try {
        perms = await fetchPermissoesBackend(emailFromToken, token);
      } catch (e) {
        console.warn("Permissões via backend falharam; tentando Supabase…", e);
        perms = await fetchPermissoesSupabase(emailFromToken);
      }

      persistAndRoute(perms, emailFromToken, token);
    } catch (ex: any) {
      setErr(ex?.message ?? String(ex));
    } finally {
      setLoading(false);
      setHint(null);
    }
  }

  // UI principal (login ou etapa 2FA)
  return (
    <div className="d-flex vh-100 position-relative" style={{ backgroundColor: "#00224c31" }}>
      <BackgroundBubbles count={90} />

      <div className="d-none d-md-flex col-6 align-items-center justify-content-center p-0">
        <img
          src="/blanche-logo.png"
          alt="Banner de login"
          className="w-100 h-100"
          style={{ objectFit: "cover" }}
        />
      </div>

      <div className="col mt-5 d-flex flex-column justify-content-center align-items-center">
        <div className="w-100" style={{ maxWidth: 420 }}>
          {!twoFA ? (
            <>
              <h3 className="mb-2 text-center text-white fw-bold">Bem-vindo!</h3>
              <h3 className="mb-4 text-center text-white fw-bold">Login</h3>

              <form onSubmit={onSubmit}>
                <div className="mb-2 text-white">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <div className="mb-3 text-white">
                  <label className="form-label">Senha</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>

                {err && <div className="alert alert-danger">{err}</div>}
                {hint && !err && <div className="alert alert-secondary">{hint}</div>}

                <button
                  disabled={loading}
                  className="btn w-100"
                  style={{
                    backgroundColor: "#FACC15",
                    color: "#0B1220",
                    fontWeight: 800,
                    border: "1px solid rgba(250,204,21,0.4)",
                  }}
                >
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h3 className="mb-2 text-center text-white fw-bold">Verificação 2FA</h3>
              <p className="text-center text-white-50">
                Envie o código do seu app autenticador para <b>{twoFA.email}</b>.
              </p>

              <form onSubmit={onSubmit2FA}>
                <div className="mb-3 text-white">
                  <label className="form-label">Código 2FA</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="form-control"
                    value={twoFACode}
                    onChange={(e) => setTwoFACode(e.target.value)}
                    placeholder="Ex.: 123456"
                    autoFocus
                  />
                </div>

                {err && <div className="alert alert-danger">{err}</div>}
                {hint && !err && <div className="alert alert-secondary">{hint}</div>}

                <div className="d-grid gap-2">
                  <button
                    disabled={loading}
                    className="btn"
                    style={{
                      backgroundColor: "#FACC15",
                      color: "#0B1220",
                      fontWeight: 800,
                      border: "1px solid rgba(250,204,21,0.4)",
                    }}
                  >
                    {loading ? "Validando..." : "Validar 2FA"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-light"
                    disabled={loading}
                    onClick={() => {
                      setTwoFA(null);
                      setTwoFACode("");
                      setErr(null);
                      setHint(null);
                    }}
                  >
                    Voltar
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <footer className="mt-auto py-3 text-center text-white" style={{ fontSize: 14 }}>
          © {new Date().getFullYear()} Neuverse — Fazendo sua Empresa maior!.
        </footer>
      </div>
    </div>
  );
}
