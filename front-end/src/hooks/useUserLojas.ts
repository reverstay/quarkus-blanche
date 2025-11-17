// src/hooks/useUserLojas.ts
import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export function useUserLojas() {
  const [lojaIds, setLojaIds] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const user = data?.session?.user;
        if (!user) {
          if (mounted) { setLojaIds([]); setLoading(false); }
          return;
        }

        const { data: emp, error: e2 } = await supabase
          .from("Employees")
          .select("loja")
          .eq("user_id", user.id);
        if (e2) throw e2;

        const ids = (emp ?? []).map((r: any) => r.loja).filter(Boolean);
        if (mounted) { setLojaIds(ids); setLoading(false); }
      } catch (e: any) {
        if (mounted) { setErr(e.message ?? String(e)); setLoading(false); }
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { lojaIds, loading, err };
}
