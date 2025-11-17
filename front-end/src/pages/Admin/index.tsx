import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateRows: "auto 1fr" }}>
      <header style={{ padding: "16px 24px", background: "#0B1220", color: "#FACC15" }}>
        <h3 style={{ margin: 0 }}>Admin · Blanch</h3>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr" }}>
        <aside style={{ borderRight: "1px solid #0002", padding: 16 }}>
          <nav style={{ display: "grid", gap: 8 }}>
            <NavLink to="/admin/owners">Donos (Owners)</NavLink>
            {/* add: <NavLink to="/admin/lojas">Lojas</NavLink> etc */}
          </nav>
        </aside>

        <main style={{ padding: 24 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
