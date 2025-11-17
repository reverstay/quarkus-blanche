import { useEffect, useState } from "react";
import { supabase } from "../../supabase";

type Dono = {
  id: string;
  email: string;
  nome: string | null;
  ativo: boolean | null;
};

export default function Owners() {
  const [rows, setRows] = useState<Dono[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // lê view pública (ou troque para sua tabela/consulta favorita)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("admin_permissoes")
          .select("email, role, ativo")
          .eq("role", "ADMIN");
        if (error) throw error;

        // mapeia para a grid
        const list: Dono[] = (data ?? []).map((r: any, i: number) => ({
          id: String(i),
          email: r.email,
          nome: null,
          ativo: r.ativo ?? true,
        }));
        if (alive) setRows(list);
      } catch (e: any) {
        setErr(e?.message ?? String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <div>Carregando donos…</div>;
  if (err) return <div style={{ color: "tomato" }}>Erro: {err}</div>;

  return (
    <div>
      <h3>Donos (Owners)</h3>
      {!rows.length ? (
        <div>Nenhum dono encontrado.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>E-mail</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Ativo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{r.email}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{r.ativo ? "Sim" : "Não"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
