import { Navigate, Route, Routes } from "react-router-dom";

// páginas
import Login from "./pages/Login";
import Home from "./pages/Home/index";
import AdminLayout from "./pages/Admin";
import Owners from "./pages/Admin/Owners";
import Pedidos from "./pages/Pedidos";
import Novo from "./pages/Pedidos/Novo";
import NovaUnidade from "./pages/Unidades/Novo";
import NovoFuncionario from "./pages/Funcionarios/Novo";
import NovaEmpresa from "./pages/Empresas/Novo";


import type { PerfilDTO } from "./types/auth";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("blanche:token");
}

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

/** Exige usuário logado (via JWT do Quarkus) */
function Protected({ children }: { children: React.ReactNode }) {
  const token = getToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/** Só admins entram (com base no perfil salvo do login) */
function AdminGate({ children }: { children: React.ReactNode }) {
  const perfil = getPerfil();
  const cargo = Number(perfil?.role ?? 0);

  const isAdmin = cargo === 0; // 1 = ADMIN

  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}

export default function AppRoutes() {
  const hasToken = !!getToken();

  return (
    <Routes>
      {/* Raiz: manda para /home ou /login com base no token do Quarkus */}
      <Route
        path="/"
        element={<Navigate to={hasToken ? "/home" : "/login"} replace />}
      />

      <Route path="/login" element={<Login />} />

      {/* Home protegida pelo JWT */}
      <Route
        path="/home"
        element={
          <Protected>
            <Home />
          </Protected>
        }
      />
      <Route
        path="/empresas/nova"
        element={
          <Protected>
            <NovaEmpresa />
          </Protected>
        }
      />
      {/* Dashboard de pedidos */}
      <Route
        path="/pedidos"
        element={
          <Protected>
            <Pedidos />
          </Protected>
        }
      />

      {/* Tela de novo pedido */}
      <Route
        path="/novo"
        element={
          <Protected>
            <Novo />
          </Protected>
        }
      />
            {/* Nova Unidade */}
            <Route
              path="/unidades/nova"
              element={
                <Protected>
                  <NovaUnidade />
                </Protected>
              }
            />

            {/* Novo Funcionário */}
            <Route
              path="/funcionarios/novo"
              element={
                <Protected>
                  <NovoFuncionario />
                </Protected>
              }
            />


      <Route
        path="/admin"
        element={
          <Protected>
            <AdminGate>
              <AdminLayout />
            </AdminGate>
          </Protected>
        }
      >
        <Route index element={<Navigate to="owners" replace />} />
        <Route path="owners" element={<Owners />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
