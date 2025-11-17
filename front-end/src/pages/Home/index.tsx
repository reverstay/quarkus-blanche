import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabase";
import { useSession } from "../../App";

/** Helpers locais — evitam .join/.map em undefined */
const safeArray = <T,>(v: T[] | null | undefined): T[] => (Array.isArray(v) ? v : []);
const safeJoin = (v: unknown, sep = " · "): string => (Array.isArray(v) ? v.join(sep) : "");
const nil = <T,>(v: T | null | undefined, fb: T): T => (v == null ? fb : v);

type AppSettings = { id: number; days_back: number; days_ahead: number };
type EmployeeRow = { user_id: string; role: string; loja: number | null };
type LojaColor = { loja: number; color: string };
type MovCab = {
  id: number;
  loja_id: number | null;
  cliente_id: number | null;
  data: string | null;
  status: string | null;
  total: number | null;
};

export default function Home() {
  const { user } = useSession();

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [empRows, setEmpRows] = useState<EmployeeRow[]>([]);
  const [lojaColors, setLojaColors] = useState<LojaColor[]>([]);
  const [items, setItems] = useState<MovCab[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  /** Sempre derive arrays a partir de safeArray() */
  const lojaIds = useMemo(
    () => safeArray(empRows).map(r => r.loja).filter((x): x is number => Number.isInteger(x)),
    [empRows]
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);

        if (!user) {
          setSettings({ id: 1, days_back: 7, days_ahead: 7 });
          setEmpRows([]); setLojaColors([]); setItems([]);
          return;
        }

        // AppSettings (id=1) — tolera ausência
        {
          const { data, error } = await supabase
            .from("AppSettings")
            .select("id,days_back,days_ahead")
            .eq("id", 1)
            .maybeSingle();
          if (error && error.code !== "PGRST116") throw error;
          setSettings((data as AppSettings) ?? { id: 1, days_back: 7, days_ahead: 7 });
        }

        // Employees (compat view)
        {
          const { data, error } = await supabase
            .from("Employees")
            .select("user_id,role,loja")
            .eq("user_id", user.id);
          if (error) throw error;
          setEmpRows(safeArray(data as EmployeeRow[]));
        }

        // LojaConfig (cores por loja)
        {
          const { data, error } = await supabase
            .from("LojaConfig")
            .select("loja,color")
            .order("loja", { ascending: true });
          if (error) throw error;
          setLojaColors(safeArray(data as LojaColor[]));
        }

        // vw_movcab_priority (ou fallback MovCab)
        {
          const { data, error } = await supabase
            .from("vw_movcab_priority")
            .select("*")
            .order("priority_number", { ascending: true })
            .order("data", { ascending: true })
            .limit(50);

          if (error) {
            const { data: mv2, error: e2 } = await supabase
              .from("MovCab")
              .select("*")
              .limit(50);
            if (e2) throw error;
            setItems(safeArray(mv2 as MovCab[]));
          } else {
            setItems(safeArray(data as MovCab[]));
          }
        }
      } catch (e: any) {
        console.error("Home load error:", e);
        setErr(e?.message ?? String(e));
      } finally {
        mounted && setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [user]);

  if (loading) return <div style={{ padding: 24 }}>Carregando…</div>;
  if (err) return <div style={{ padding: 24, color: "tomato" }}>Erro: {err}</div>;

  /** <<< ESTA LINHA É O ANTIGO .join QUE QUEBRAVA >>> */
  const lojasStr = safeJoin(lojaIds, " · ");

  const colorByLoja = new Map(safeArray(lojaColors).map(x => [x.loja, x.color]));

  return (
    <div style={{ padding: 24 }}>
      <header style={{ marginBottom: 16 }}>
        <h2>Dashboard</h2>
        <div style={{ opacity: 0.8 }}>
          Lojas do usuário: <strong>{lojasStr || "—"}</strong>
          {settings && (
            <span style={{ marginLeft: 12 }}>
              | Janela: D{nil(settings.days_back, 7)}…D+{nil(settings.days_ahead, 7)}
            </span>
          )}
        </div>
      </header>

      <section>
        <h3>Movimentos Prioritários</h3>
        {!safeArray(items).length ? (
          <div style={{ opacity: 0.7 }}>Nenhum item encontrado.</div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
            {safeArray(items).map((m) => {
              const color = colorByLoja.get(m.loja_id ?? -1) ?? "#666";
              return (
                <li key={m.id} style={{ border: "1px solid #3334", padding: 12, borderRadius: 8 }}>
                  <div>
                    <strong>Mov #{m.id}</strong>{" "}
                    <span style={{ fontSize: 12, opacity: 0.8 }}>
                      (loja {m.loja_id ?? "—"}, cliente {m.cliente_id ?? "—"})
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div
                      title={`loja=${m.loja_id ?? "—"}`}
                      style={{
                        width: 10, height: 10, borderRadius: 999,
                        background: color, border: "1px solid #0002"
                      }}
                    />
                    <span>Data: {m.data ?? "—"}</span>
                    <span style={{ marginLeft: 8, opacity: 0.8 }}>Status: {m.status ?? "—"}</span>
                    <span style={{ marginLeft: 8, opacity: 0.8 }}>
                      Total: {m.total != null ? m.total.toFixed(2) : "—"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
