// src/pages/Unidades/Novo.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/NavBar";
import BackgroundBubbles from "../../components/BackgroundBubbles";
import Spinner from "../../components/Spinner";

import { apiGet, apiPost } from "../../api/http";
import type { EmpresaDTO, UnidadeDTO } from "../../types/empresa";
import { cargoToLabel, getStoredPerfil, getStoredToken } from "../../types/auth";

export default function NovaUnidade() {
  const nav = useNavigate();

  const [empresas, setEmpresas] = useState<EmpresaDTO[]>([]);
  const [empresaId, setEmpresaId] = useState<string>("");
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const token = getStoredToken();
  const perfil = getStoredPerfil();
  const cargoNum = perfil?.role != null ? Number(perfil.role) : null;
  const cargoLabel = cargoToLabel(cargoNum);

  // Só ADMIN e DIRETOR podem acessar essa tela
  const isAllowed = cargoLabel === "ADMIN" || cargoLabel === "DIRETOR";

  useEffect(() => {
    if (!token) {
      setErr("Token não encontrado. Faça login novamente.");
      setLoading(false);
      return;
    }
    if (!isAllowed) {
      setErr("Seu usuário não tem permissão para criar unidades.");
      setLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // GET /empresas/minhas  (respeita ADMIN/DIRETOR no backend)
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSuccess(null);

    if (!token) {
      setErr("Token não encontrado. Faça login novamente.");
      return;
    }

    if (!empresaId) {
      setErr("Selecione uma empresa.");
      return;
    }

    if (!nome.trim() || !endereco.trim()) {
      setErr("Preencha nome e endereço da unidade.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        nome: nome.trim(),
        endereco: endereco.trim(),
      };

      // POST /empresas/{id}/unidades
      const created = await apiPost<UnidadeDTO>(
        `/empresas/${encodeURIComponent(empresaId)}/unidades`,
        payload,
        token
      );

      setSuccess(`Unidade "${created.nome}" criada com sucesso.`);
      // opcional: resetar formulário
      setNome("");
      setEndereco("");
    } catch (e: any) {
      console.error("Erro ao criar unidade:", e);
      setErr(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  if (!isAllowed) {
    return (
      <>
        <Navbar isAdminOwner={cargoLabel === "ADMIN"} />
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
      <Navbar isAdminOwner={cargoLabel === "ADMIN"} />
      <BackgroundBubbles count={60} />

      <div className="container py-4 position-relative">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="mb-1">Nova Unidade</h2>
            <p className="text-muted mb-0">
              Cadastre uma nova unidade física vinculada à empresa.
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
              <div className="mb-3">
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
                {empresas.length === 0 && (
                  <small className="text-muted">
                    Nenhuma empresa encontrada. Peça ao administrador para criar uma empresa.
                  </small>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Nome da unidade</label>
                <input
                  type="text"
                  className="form-control"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex.: Blanche Centro"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Endereço</label>
                <textarea
                  className="form-control"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, número, bairro, cidade..."
                  rows={3}
                />
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
                  disabled={saving || empresas.length === 0}
                >
                  {saving ? "Salvando..." : "Criar unidade"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
