// src/pages/Funcionarios/Novo.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/NavBar";
import BackgroundBubbles from "../../components/BackgroundBubbles";
import Spinner from "../../components/Spinner";

import { apiGet, apiPost } from "../../api/http";
import { cargoToLabel, getStoredPerfil, getStoredToken } from "../../types/auth";
import type { EmpresaDTO, UnidadeDTO } from "../../types/empresa";

type UsuarioCriadoDTO = {
  id: string;
  nome: string;
  email: string;
  cargo: number | string;
};

export default function NovoFuncionario() {
  const nav = useNavigate();

  const token = getStoredToken();
  const perfil = getStoredPerfil();
  const cargoNum = perfil?.role != null ? Number(perfil.role) : null;
  const cargoLabel = cargoToLabel(cargoNum);

  const isAdmin = cargoLabel === "ADMIN";
  const isDiretor = cargoLabel === "DIRETOR";
  const isAllowed = isAdmin || isDiretor;

  const [empresas, setEmpresas] = useState<EmpresaDTO[]>([]);
  const [unidades, setUnidades] = useState<UnidadeDTO[]>([]);

  const [empresaId, setEmpresaId] = useState("");
  const [unidadeId, setUnidadeId] = useState("");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [cargoNovo, setCargoNovo] = useState<number>(3); // default FUNCIONARIO

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setErr("Token não encontrado. Faça login novamente.");
      setLoading(false);
      return;
    }
    if (!isAllowed) {
      setErr("Seu usuário não tem permissão para criar funcionários.");
      setLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // Carrega empresas do diretor/admin
        const data = await apiGet<EmpresaDTO[]>("/empresas/minhas", token);
        if (!mounted) return;

        setEmpresas(data);
        if (data.length === 1) {
          setEmpresaId(data[0].id);
        }
      } catch (e: any) {
        console.error("Erro ao carregar empresas:", e);
        if (mounted) setErr(e?.message ?? String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token, isAllowed]);

  // sempre que mudar empresa, carrega unidades
  useEffect(() => {
    if (!token) return;
    if (!empresaId) {
      setUnidades([]);
      setUnidadeId("");
      return;
    }

    let mounted = true;

    (async () => {
      try {
        setErr(null);
        const data = await apiGet<UnidadeDTO[]>(
          `/empresas/${encodeURIComponent(empresaId)}/unidades`,
          token
        );
        if (!mounted) return;
        setUnidades(data);
        if (data.length === 1) {
          setUnidadeId(data[0].id);
        }
      } catch (e: any) {
        console.error("Erro ao carregar unidades:", e);
        if (mounted) setErr(e?.message ?? String(e));
      }
    })();

    return () => {
      mounted = false;
    };
  }, [empresaId, token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSuccess(null);

    if (!token) {
      setErr("Token não encontrado. Faça login novamente.");
      return;
    }
    if (!nome.trim() || !email.trim() || !senha) {
      setErr("Preencha nome, e-mail e senha.");
      return;
    }

    // Diretores não podem criar ADMIN/DIRETOR
    if (isDiretor && cargoNovo !== 3) {
      setErr("Diretores só podem criar funcionários (cargo 3).");
      return;
    }

    try {
      setSaving(true);

      const payload: any = {
        nome: nome.trim(),
        email: email.trim(),
        cargo: cargoNovo, // backend espera int (1,2,3)
        senha: senha,
        // opcional: se você ajustar o DTO do backend para aceitar unidade/loja:
        // unidadeId: unidadeId || null,
      };

      const created = await apiPost<UsuarioCriadoDTO>(
        "/usuarios",
        payload,
        token
      );

      setSuccess(`Usuário "${created.nome}" criado com sucesso.`);
      setNome("");
      setEmail("");
      setSenha("");
      if (!isAdmin) {
        setCargoNovo(3);
      }
    } catch (e: any) {
      console.error("Erro ao criar usuário:", e);
      setErr(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  if (!isAllowed) {
    return (
      <>
        <Navbar isAdminOwner={isAdmin} />
        <BackgroundBubbles count={60} />
        <div className="container py-4 position-relative">
          <div className="alert alert-danger mt-3">
            Você não tem permissão para acessar esta tela.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar isAdminOwner={isAdmin} />
      <BackgroundBubbles count={60} />

      <div className="container py-4 position-relative">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="mb-1">Novo Usuário</h2>
            <p className="text-muted mb-0">
              Cadastre administradores, diretores ou funcionários da rede.
            </p>
          </div>
          <button
            className="btn btn-outline-secondary"
            onClick={() => nav("/home")}
          >
            Voltar para Home
          </button>
        </div>

        {loading && (
          <div className="mb-3">
            <Spinner />
          </div>
        )}

        {!loading && err && (
          <div className="alert alert-danger mb-3">
            {err}
          </div>
        )}

        {!loading && !err && (
          <form onSubmit={onSubmit} className="card border-0 shadow-sm">
            <div className="card-body">
              {/* Cargo do usuário que está criando */}
              <div className="alert alert-info">
                Seu cargo atual: <strong>{cargoLabel}</strong>
              </div>

              {/* Empresa / Unidade (opcional, para contexto visual) */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label">Empresa</label>
                  <select
                    className="form-select"
                    value={empresaId}
                    onChange={(e) => setEmpresaId(e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {empresas.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Unidade (opcional)</label>
                  <select
                    className="form-select"
                    value={unidadeId}
                    onChange={(e) => setUnidadeId(e.target.value)}
                    disabled={!empresaId || unidades.length === 0}
                  >
                    <option value="">(Sem vínculo)</option>
                    {unidades.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome}
                      </option>
                    ))}
                  </select>
                  <small className="text-muted">
                    Apenas visual / contextual por enquanto — podemos ligar no backend depois via lojaId/unidadeId.
                  </small>
                </div>
              </div>

              {/* Dados do novo usuário */}
              <div className="mb-3">
                <label className="form-label">Nome</label>
                <input
                  type="text"
                  className="form-control"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">E-mail</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Senha inicial</label>
                <input
                  type="password"
                  className="form-control"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Senha temporária"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Cargo</label>
                <select
                  className="form-select"
                  value={cargoNovo}
                  onChange={(e) => setCargoNovo(Number(e.target.value))}
                  disabled={isDiretor} // diretor só pode 3
                >
                  {isAdmin && <option value={1}>Administrador (1)</option>}
                  {isAdmin && <option value={2}>Diretor (2)</option>}
                  <option value={3}>Funcionário (3)</option>
                </select>
                {isDiretor && (
                  <small className="text-muted">
                    Diretores só podem criar Funcionários (cargo 3).
                  </small>
                )}
              </div>

              {success && (
                <div className="alert alert-success mb-3">
                  {success}
                </div>
              )}

              {err && (
                <div className="alert alert-danger mb-3">
                  {err}
                </div>
              )}

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => nav("/home")}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-warning fw-bold"
                  disabled={saving}
                >
                  {saving ? "Salvando..." : "Criar usuário"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
