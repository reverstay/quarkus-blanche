import { Navigate, Route, Routes } from "react-router-dom";

// páginas
import Login from "./pages/Login";
import Home from "./pages/Home";
import AdminLayout from "./pages/Admin";
import Owners from "./pages/Admin/Owners";

// Se quiser ainda usar useSession em outras coisas, pode importar,
// mas NÃO vamos mais usá-lo pra proteger rota.
// import { useSession } from "./App";

type Perfil = {
  email?: string | null;
  role?: string | null;
  empresa?: string | null;
  ativo?: boolean | null;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("blanche:token");
}

function getPerfil(): Perfil | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("blanche:perfil");
    if (!raw) return null;
    return JSON.parse(raw) as Perfil;
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
  const role = (perfil?.role || "").toString().toUpperCase();

  // Ajusta aqui conforme sua convenção:
  // - "ADMIN"
  // - "1" (se cargo "1" significa admin)
  const isAdmin = role === "ADMIN" || role === "1";

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
      <Route path="/" element={<Navigate to={hasToken ? "/home" : "/login"} replace />} />

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

      {/* Admin + subrotas protegidas por JWT + role do perfil */}
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
        {/* futuras: /admin/lojas, /admin/funcionarios, etc. */}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
