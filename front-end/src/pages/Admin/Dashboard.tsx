export default function AdminDashboard() {
  const perfil = JSON.parse(localStorage.getItem("blanche:perfil") || "{}");
  return (
    <div>
      <h2>Painel Administrativo</h2>
      <p>Olá, {perfil?.email || "admin"} — Empresa: {perfil?.empresa || "—"}</p>
      <pre style={{ background: "#111", color: "#eee", padding: 12, borderRadius: 8 }}>
        {JSON.stringify(perfil, null, 2)}
      </pre>
    </div>
  );
}
