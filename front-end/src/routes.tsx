import { Navigate, Route, Routes } from "react-router-dom";
import { useSession } from "./App";

// páginas
import Login from "./pages/Login";
import Home from "./pages/Home";
import AdminLayout from "./pages/Admin";
import Owners from "./pages/Admin/Owners";
import { useIsAdmin } from "./hooks/useIsAdmin";

/** Exige usuário logado */
function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  if (loading) return <div style={{ padding: 24 }}>Carregando…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Só admins entram */
function AdminGate({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  const email = user?.email ?? null;
  const { isAdmin, loading } = useIsAdmin(email);

  if (loading) return <div style={{ padding: 24 }}>Verificando permissões…</div>;
  if (!isAdmin) return <Navigate to="/home" replace />;
  return <>{children}</>;
}

export default function AppRoutes() {
  const { user } = useSession();

  return (
    <Routes>
      {/* Raiz: manda para /home ou /login */}
      <Route path="/" element={<Navigate to={user ? "/home" : "/login"} replace />} />
      <Route path="/login" element={<Login />} />

      {/* Home protegida */}
      <Route
        path="/home"
        element={
          <Protected>
            <Home />
          </Protected>
        }
      />

      {/* Admin + subrotas */}
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
