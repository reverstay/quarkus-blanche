import { Link } from "react-router-dom";
import { supabase } from "../supabase";

export default function Home() {
  const perfil = JSON.parse(localStorage.getItem("blanche:perfil") || "{}");
  const role = (perfil?.role ?? "").toString().toUpperCase();
  const email = perfil?.email ?? "—";
  const empresa = perfil?.empresa ?? "—";
  const isAdmin = role === "ADMIN";

  return (
    <div style={{ padding: 24 }}>
      <h2>Dashboard — Blanch-system</h2>
      <p>Bem-vindo(a), {email}!</p>
      <p>Empresa: {empresa} · Perfil: {role || "—"}</p>

      {isAdmin && (
        <p style={{ marginTop: 16 }}>
          <Link to="/admin/owners">→ Painel do Administrador (Donos)</Link>
        </p>
      )}

      <button onClick={() => supabase.auth.signOut()} style={{ marginTop: 16 }}>
        Sair
      </button>
    </div>
  );
}
