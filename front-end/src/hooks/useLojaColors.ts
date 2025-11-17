import { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabase";

type LojaRow = { loja: string; color: string };

export function useLojaColors() {
  const [rows, setRows] = useState<LojaRow[]>([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from("LojaConfig").select("loja,color").order("loja");
      if (error) console.error(error);
      if (alive) setRows((data || []) as any);
    })();
    return () => { alive = false; };
  }, []);
  const map = useMemo(() => {
    const m = new Map<string, string>();
    rows.forEach(r => { if (r.loja) m.set(r.loja, r.color || "#337ab7"); });
    return m;
  }, [rows]);
  /** retorna a cor para uma loja (fallback azul) */
  const get = (loja?: string) => (loja && map.get(loja)) || "#337ab7";
  return { loading: rows.length === 0, colors: map, get };
}
