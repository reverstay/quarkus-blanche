import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/NavBar";
import Spinner from "../../components/Spinner";
import BackgroundBubbles from "../../components/BackgroundBubbles";

import { supabase } from "../../supabase";
import { apiGet } from "../../api/http";

import type { PerfilDTO } from "../../types/auth";
import type { EmpresaDTO, UnidadeDTO } from "../../types/empresa";

/** Helpers locais */
const safeArray = <T,>(v: T[] | null | undefined): T[] =>
  Array.isArray(v) ? v : [];
const nil = <T,>(v: T | null | undefined, fb: T): T => (v == null ? fb : v);

// Config da agenda
type AppSettings = { id: number; days_back: number; days_ahead: number };

// Cores por loja (Supabase)
type LojaColor = { loja: number; color: string };

// Movimentos / pedidos
type MovCab = {
  id: number;
  loja_id: number | null;
  cliente_id: number | null;
  data: string | null;
  status: string | null;
  total: number | null;
};

// DTO estendido só pra Home (empresa + unidades)
type EmpresaWithUnidades = EmpresaDTO & { unidades: UnidadeDTO[] };

// ====== helpers de sessão local (JWT do Quarkus) ======

function getPerfil(): PerfilDTO | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("blanche:perfil");
    if (!raw) return null;
    return JSON.parse(raw) as PerfilDTO;
  } catch {
    return null;
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("blanche:token");
}

// ====== componente ======

export default function Home() {
  const nav = useNavigate();

  const perfil = getPerfil();
  const cargoNum = perfil?.role != null ? Number(perfil.role) : 0;
  const isAdmin = cargoNum === 0;
  const isDiretor = cargoNum === 1;
  const isFuncionario = cargoNum === 2; // por enquanto não usamos, mas é bom já deixar

  // ====== estado para Supabase (pedidos) ======
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [lojaColors, setLojaColors] = useState<LojaColor[]>([]);
  const [items, setItems] = useState<MovCab[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [errPedidos, setErrPedidos] = useState<string | null>(null);

  // ====== estado para Empresas/Unidades (Quarkus) ======
  const [empresas, setEmpresas] = useState<EmpresaWithUnidades[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [errEmpresas, setErrEmpresas] = useState<string | null>(null);

  // ====== EFFECT: dados de pedidos (Supabase) ======
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingPedidos(true);

        // AppSettings (id=1) — tolera ausência
        {
          const { data, error } = await supabase
            .from("AppSettings")
            .select("id,days_back,days_ahead")
            .eq("id", 1)
            .maybeSingle();

          if (error && error.code !== "PGRST116") throw error;
          if (!mounted) return;

          setSettings(
            (data as AppSettings) ?? { id: 1, days_back: 7, days_ahead: 7 }
          );
        }

        // LojaConfig (cores por loja)
        {
          const { data, error } = await supabase
            .from("LojaConfig")
            .select("loja,color")
            .order("loja", { ascending: true });

          if (error) throw error;
          if (!mounted) return;

          setLojaColors(safeArray(data as LojaColor[]));
        }

        // vw_movcab_priority (ou fallback MovCab)
        {
          const { data, error } = await supabase
            .from("vw_movcab_priority")
            .select("*")
            .order("priority_number", { ascending: true })
            // se a view não tiver "data", trocar pelo nome real da coluna
            .order("data", { ascending: true })
            .limit(50);

          if (error) {
            const { data: mv2, error: e2 } = await supabase
              .from("MovCab")
              .select("*")
              .order("data", { ascending: false })
              .limit(50);

            if (e2) throw error;
            if (!mounted) return;

            setItems(safeArray(mv2 as MovCab[]));
          } else {
            if (!mounted) return;
            setItems(safeArray(data as MovCab[]));
          }
        }

        if (mounted) setErrPedidos(null);
      } catch (e: any) {
        console.error("Home load error (pedidos):", e);
        if (mounted) setErrPedidos(e?.message ?? String(e));
      } finally {
        if (mounted) setLoadingPedidos(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ====== EFFECT: dados de empresas/unidades (Quarkus) ======
  useEffect(() => {
    let mounted = true;
    const token = getToken();

    if (!token) {
      setErrEmpresas("Sessão expirada. Faça login novamente.");
      setLoadingEmpresas(false);
      return;
    }

    (async () => {
      try {
        setLoadingEmpresas(true);

        // 1) empresas onde o usuário é admin/diretor
        const empresasResp = await apiGet<EmpresaDTO[]>("/empresas/minhas", token);

        const empresasComUnidades: EmpresaWithUnidades[] = [];

        // 2) para cada empresa, buscar unidades
        for (const emp of empresasResp) {
          try {
            const unidades = await apiGet<UnidadeDTO[]>(
              `/empresas/${emp.id}/unidades`,
              token
            );
            if (!mounted) return;
            empresasComUnidades.push({ ...emp, unidades });
          } catch (e: any) {
            console.warn("Erro ao carregar unidades da empresa", emp.id, e);
            if (!mounted) return;
            empresasComUnidades.push({ ...emp, unidades: [] });
          }
        }

        if (!mounted) return;
        setEmpresas(empresasComUnidades);
        setErrEmpresas(null);
      } catch (e: any) {
        console.error("Home load error (empresas):", e);
        if (mounted) setErrEmpresas(e?.message ?? String(e));
      } finally {
        if (mounted) setLoadingEmpresas(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ====== KPIs de pedidos ======
  const totalPedidos = items.length;

  const pedidosProntos = useMemo(
    () =>
      items.filter(
        (m) => (m.status ?? "").toLowerCase().includes("pronta")
      ).length,
    [items]
  );

  const pedidosPendentes = totalPedidos - pedidosProntos;

  const lojasConfig = lojaColors.length;
  const colorByLoja = new Map(
    safeArray(lojaColors).map((x) => [x.loja, x.color])
  );

  // ====== contagens de Empresas/Unidades ======
  const totalEmpresas = empresas.length;
  const totalUnidades = empresas.reduce(
    (acc, e) => acc + e.unidades.length,
    0
  );

  return (
    <div
      className="d-flex flex-column min-vh-100 position-relative"
      style={{ backgroundColor: "#00224c31" }}
    >
      {/* Fundo animado igual ao login */}
      <BackgroundBubbles count={80} />

      {/* Navbar de sistema */}
      <Navbar isAdminOwner={isAdmin || isDiretor} />

      {/* Conteúdo principal */}
      <main
        className="container py-3 position-relative"
        style={{ zIndex: 1 }}
      >
        {/* Cabeçalho */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
          <div>
            <h2 className="mb-1 text-white">
              {isAdmin
                ? "Central de Administração"
                : isDiretor
                ? "Painel do Diretor"
                : "Painel da Unidade"}
            </h2>
            <p className="text-white-50 mb-0">
              Gerencie pedidos, empresas e unidades da rede Blanche.
            </p>
            {settings && (
              <small className="text-white-50">
                Janela padrão de agenda: D-
                {nil(settings.days_back, 7)} até D+
                {nil(settings.days_ahead, 7)}
              </small>
            )}
          </div>

          <div className="d-flex gap-2 mt-3 mt-md-0">
            <button
              className="btn btn-warning fw-bold"
              onClick={() => nav("/pedidos")}
            >
              <i className="bi bi-layout-text-sidebar me-2" />
              Dashboard de Pedidos
            </button>

            {(isAdmin || isDiretor) && (
              <button
                className="btn btn-outline-light"
                onClick={() => nav("/novo")}
              >
                <i className="bi bi-plus-circle me-2" />
                Novo Pedido
              </button>
            )}
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="row g-3 mb-4">
          {/* Pedidos listados */}
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <h6 className="text-muted text-uppercase small mb-1">
                  Pedidos listados
                </h6>
                <div className="d-flex justify-content-between align-items-end">
                  <span className="display-6 fw-bold">
                    {totalPedidos || "—"}
                  </span>
                  <i className="bi bi-basket2 fs-2 text-primary" />
                </div>
                <small className="text-muted">
                  Últimos registros trazidos da base.
                </small>
              </div>
            </div>
          </div>

          {/* Pedidos pendentes */}
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <h6 className="text-muted text-uppercase small mb-1">
                  Pedidos pendentes
                </h6>
                <div className="d-flex justify-content-between align-items-end">
                  <span className="display-6 fw-bold text-danger">
                    {totalPedidos ? pedidosPendentes : "—"}
                  </span>
                  <i className="bi bi-hourglass-split fs-2 text-danger" />
                </div>
                <small className="text-muted">
                  Ainda em processamento (não marcados como &quot;pronta&quot;).
                </small>
              </div>
            </div>
          </div>

          {/* Empresas */}
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <h6 className="text-muted text-uppercase small mb-1">
                  Empresas
                </h6>
                <div className="d-flex justify-content-between align-items-end">
                  <span className="display-6 fw-bold">
                    {totalEmpresas || "—"}
                  </span>
                  <i className="bi bi-buildings fs-2 text-success" />
                </div>
                <small className="text-muted">
                  {isAdmin
                    ? "Todas as empresas cadastradas no sistema."
                    : "Empresas que você gerencia."}
                </small>
              </div>
            </div>
          </div>

          {/* Unidades físicas */}
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <h6 className="text-muted text-uppercase small mb-1">
                  Unidades físicas
                </h6>
                <div className="d-flex justify-content-between align-items-end">
                  <span className="display-6 fw-bold">
                    {totalUnidades || "—"}
                  </span>
                  <i className="bi bi-shop fs-2 text-info" />
                </div>
                <small className="text-muted">
                  Pontos físicos da rede associados às empresas.
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Empresas e Unidades */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="mb-0">
                  {isAdmin ? "Empresas e Unidades" : "Minhas Empresas e Unidades"}
                </h5>
                <small className="text-muted">
                  {isAdmin
                    ? "Administre todas as empresas e seus diretores."
                    : isDiretor
                    ? "Empresas e unidades que você gerencia."
                    : "Unidades às quais você tem acesso."}
                </small>
              </div>

              <div className="d-flex gap-2">
                {isAdmin && (
                  <>
                    <button
                      className="btn btn-primary"
                      onClick={() => nav("/empresas/nova")}
                    >
                      <i className="bi bi-building-add me-1" />
                      Nova empresa
                    </button>

                    <button
                      className="btn btn-sm btn-outline-warning"
                      onClick={() => nav("/admin")}
                    >
                      <i className="bi bi-people-fill me-1" />
                      Gerenciar diretores
                    </button>
                  </>
                )}

                {isDiretor && (
                  <>
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => nav("/unidades/nova")}
                    >
                      <i className="bi bi-shop-window me-1" />
                      Nova unidade
                    </button>

                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => nav("/funcionarios/novo")}
                    >
                      <i className="bi bi-person-plus me-1" />
                      Novo funcionário
                    </button>
                  </>
                )}
              </div>
            </div>

            {loadingEmpresas && <Spinner />}

            {!loadingEmpresas && errEmpresas && (
              <div className="alert alert-danger mb-0">
                Erro ao carregar empresas/unidades: {errEmpresas}
              </div>
            )}

            {!loadingEmpresas && !errEmpresas && (
              <>
                {empresas.length === 0 ? (
                  <div className="text-muted">
                    Nenhuma empresa encontrada para este usuário.
                  </div>
                ) : (
                  <div className="row g-3">
                    {empresas.map((emp) => (
                      <div className="col-md-6" key={emp.id}>
                        <div className="card h-100">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <h5 className="mb-1">{emp.nome}</h5>
                                <small className="text-muted">ID: {emp.id}</small>
                              </div>
                              <span className="badge bg-primary">
                                {emp.unidades.length} unidade
                                {emp.unidades.length === 1 ? "" : "s"}
                              </span>
                            </div>

                            {emp.unidades.length === 0 ? (
                              <p className="text-muted mb-0">
                                Nenhuma unidade cadastrada para esta empresa.
                              </p>
                            ) : (
                              <ul className="list-unstyled mb-0">
                                {emp.unidades.map((u) => (
                                  <li
                                    key={u.id}
                                    className="d-flex align-items-center mb-1"
                                  >
                                    <i className="bi bi-geo-alt-fill me-2 text-info" />
                                    <div>
                                      <div>{u.nome}</div>
                                      <small className="text-muted">
                                        {u.endereco}
                                      </small>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Últimos pedidos */}
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="mb-0">Últimos pedidos</h5>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => nav("/pedidos")}
              >
                Ver todos os pedidos
              </button>
            </div>

            {loadingPedidos && <Spinner />}

            {!loadingPedidos && errPedidos && (
              <div className="alert alert-danger mb-0">
                Erro ao carregar pedidos: {errPedidos}
              </div>
            )}

            {!loadingPedidos && !errPedidos && (
              <>
                {items.length === 0 ? (
                  <div className="text-muted">
                    Nenhum pedido encontrado nos últimos registros.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm align-middle mb-0">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Loja</th>
                          <th>Cliente</th>
                          <th>Data</th>
                          <th>Status</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((m) => {
                          const color =
                            colorByLoja.get(m.loja_id ?? -1) ?? "#666";
                          const status = m.status ?? "—";
                          return (
                            <tr key={m.id}>
                              <td>{m.id}</td>
                              <td>
                                <span
                                  className="me-2 d-inline-block"
                                  style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: 999,
                                    background: color,
                                    border: "1px solid #0002",
                                  }}
                                />
                                {m.loja_id ?? "—"}
                              </td>
                              <td>{m.cliente_id ?? "—"}</td>
                              <td>{m.data ?? "—"}</td>
                              <td>
                                <span className="badge bg-secondary">
                                  {status}
                                </span>
                              </td>
                              <td>
                                {m.total != null ? m.total.toFixed(2) : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
