import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/NavBar";
import BackgroundBubbles from "../../components/BackgroundBubbles";
import Spinner from "../../components/Spinner";

import { apiGet, apiPost } from "../../api/http";
import {
  cargoToLabel,
  getStoredPerfil,
  getStoredToken,
} from "../../types/auth";

type EmpresaCriadaDTO = {
  id: string;
  nome: string;
  criadoEm: string;
};

type DiretorDTO = {
  id: string;
  nome: string;
  email: string;
  cargo: number;
};

export default function NovaEmpresa() {
  const nav = useNavigate();

  const token = getStoredToken();
  const perfil = getStoredPerfil();
  const cargoNum = perfil?.role != null ? Number(perfil.role) : null;
  const cargoLabel = cargoToLabel(cargoNum);
  const isAdmin = Number(perfil.role)==0?true:false;

  const [nome, setNome] = useState("");
  const [selectedDiretores, setSelectedDiretores] = useState<string[]>([]);

  const [diretores, setDiretores] = useState<DiretorDTO[]>([]);
  const [loadingDiretores, setLoadingDiretores] = useState(false);
  const [errDiretores, setErrDiretores] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ========== proteção básica ==========
  if (!token) {
    return (
      <>
        <Navbar isAdminOwner={false} />
        <BackgroundBubbles count={60} />
        <div className="container py-4 position-relative">
          <div className="alert alert-danger mt-3">
            Token não encontrado. Faça login novamente.
          </div>
        </div>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <Navbar isAdminOwner={false} />
        <BackgroundBubbles count={60} />
        <div className="container py-4 position-relative">
          <div className="alert alert-danger mt-3">
            Apenas administradores podem criar empresas.
          </div>
        </div>
      </>
    );
  }

  // ========== carregar lista de diretores ==========
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingDiretores(true);
        setErrDiretores(null);

        const data = await apiGet<DiretorDTO[]>("/usuarios?cargo=DIRETOR", token);
        console.log(token);
        if (!mounted) return;
        setDiretores(data ?? []);
      } catch (e: any) {
        console.error("Erro ao carregar diretores:", e);
        if (mounted)
          setErrDiretores(e?.message ?? "Falha ao carregar lista de diretores.");
      } finally {
        if (mounted) setLoadingDiretores(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token]);

  // ========== handlers ==========
  function toggleDiretor(id: string) {
    setSelectedDiretores((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSuccess(null);

    if (!nome.trim()) {
      setErr("Informe o nome da empresa.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        nome: nome.trim(),
        diretoresIds: selectedDiretores, // array de UUIDs selecionados
      };

      const created = await apiPost<EmpresaCriadaDTO>(
        "/empresas",
        payload,
        token
      );

      setSuccess(`Empresa "${created.nome}" criada com sucesso.`);
      setNome("");
      setSelectedDiretores([]);
    } catch (e: any) {
      console.error("Erro ao criar empresa:", e);
      setErr(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Navbar isAdminOwner={true} />
      <BackgroundBubbles count={60} />

      <div className="container py-4 position-relative">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="mb-1">Nova Empresa</h2>
            <p className="text-muted mb-0">
              Cadastre uma nova empresa e vincule diretores.
            </p>
          </div>
          <button
            className="btn btn-outline-secondary"
            onClick={() => nav("/home")}
          >
            Voltar para Home
          </button>
        </div>

        <form onSubmit={onSubmit} className="card border-0 shadow-sm">
          <div className="card-body">
            {/* Nome da empresa */}
            <div className="mb-3">
              <label className="form-label">Nome da empresa</label>
              <input
                type="text"
                className="form-control"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Blanche Lavanderias LTDA"
              />
            </div>

            {/* Lista de diretores */}
            <div className="mb-3">
              <label className="form-label">Diretores</label>

              {loadingDiretores && (
                <div className="d-flex align-items-center gap-2 mb-2">
                  <Spinner />
                  <span className="text-muted">Carregando diretores…</span>
                </div>
              )}

              {!loadingDiretores && errDiretores && (
                <div className="alert alert-danger">
                  {errDiretores}
                </div>
              )}

              {!loadingDiretores && !errDiretores && diretores.length === 0 && (
                <div className="text-muted">
                  Nenhum usuário com cargo de diretor encontrado.
                </div>
              )}

              {!loadingDiretores && !errDiretores && diretores.length > 0 && (
                <div className="border rounded p-2" style={{ maxHeight: 220, overflowY: "auto" }}>
                  {diretores.map((d) => (
                    <div className="form-check" key={d.id}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`dir-${d.id}`}
                        checked={selectedDiretores.includes(d.id)}
                        onChange={() => toggleDiretor(d.id)}
                      />
                      <label className="form-check-label" htmlFor={`dir-${d.id}`}>
                        <strong>{d.nome}</strong>{" "}
                        <span className="text-muted">({d.email})</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              <small className="text-muted">
                Selecione um ou mais diretores que serão responsáveis por esta empresa.
              </small>
            </div>

            {saving && (
              <div className="mb-3">
                <Spinner />
              </div>
            )}

            {success && (
              <div className="alert alert-success mb-3">{success}</div>
            )}

            {err && <div className="alert alert-danger mb-3">{err}</div>}

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
                {saving ? "Salvando..." : "Criar empresa"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
