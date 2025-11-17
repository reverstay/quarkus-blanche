import { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabase";

type EmpRow = { role: "ADMIN"|"OWNER"|"RECEP"|"DELIVERY"; loja: string|null };

export function useRole() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<EmpRow["role"] | null>(null);
  const [loja, setLoja] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (alive) { setRole(null); setLoja(null); setLoading(false); } return; }
      const { data, error } = await supabase
        .from("Employees").select("role,loja").eq("user_id", user.id).maybeSingle();
      if (error) console.error(error);
      if (alive) {
        setRole((data?.role as any) ?? null);
        setLoja((data?.loja as any) ?? null);
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const isAdmin = role === "ADMIN";
  const isOwner = role === "OWNER";
  const isRecep = role === "RECEP";
  const isDelivery = role === "DELIVERY";
  const isAdminOwner = useMemo(() => isAdmin || isOwner, [isAdmin, isOwner]);

  return { loading, role, loja: loja || undefined, isAdmin, isOwner, isRecep, isDelivery, isAdminOwner };
}
