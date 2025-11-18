import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BackgroundBubbles from "../../components/BackgroundBubbles";
import { apiPost } from "../../api/http";
import { LoginResponse, buildPerfilFromLogin } from "../../types/auth";

function parseJwt(token: string): Record<string, any> {
  try {
    const base = token.split(".")[1];
    const json = atob(base.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return {};
  }
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nav = useNavigate();

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
      // 1) Login no backend Quarkus
      const resp = await apiPost<LoginResponse>("/auth/login", {
        email,
        senha: password, // bate com LoginRequestDTO do backend
      });
      const token = resp.token;
      console.log(`token: ${token}`)


      if (!token || !resp.usuario) {
        throw new Error("Resposta inesperada do servidor de login.");
      }
        console.log(resp.usuario)
      // 2) Guardar token pra chamadas futuras
      localStorage.setItem("blanche:token", token);

      // 3) Montar um perfil “tipado” usando nosso DTO
      const perfil = buildPerfilFromLogin(resp, email);
      localStorage.setItem("blanche:perfil", JSON.stringify(perfil));

      // (Opcional) Se quiser ainda inspecionar o JWT:
      const claims = parseJwt(token);
      console.log("Claims JWT:", claims);

      // 4) Vai pra Home
      console.log("LOGIN OK, indo para /home", { perfil });
      nav("/home", { replace: true });
    } catch (ex: any) {
      console.error("Erro no login:", ex);
      setErr(ex?.message ?? String(ex));
    } finally {
      setLoading(false);
      setHint(null);
    }
  }

  return (
    <div
      className="d-flex vh-100 position-relative"
      style={{ backgroundColor: "#00224c31" }}
    >
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
        </div>

        <footer
          className="mt-auto py-3 text-center text-white"
          style={{ fontSize: 14 }}
        >
          © {new Date().getFullYear()} Neuverse — Fazendo sua Empresa maior!.
        </footer>
      </div>
    </div>
  );
}
