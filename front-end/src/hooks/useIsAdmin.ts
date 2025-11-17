import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export function useIsAdmin(email?: string | null) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) { setLoading(false); return; }
    let alive = true;
    (async () => {
      try {
        const { data, error } = await supabase.rpc("is_admin", { p_email: email });
        if (error) {
          console.error("RPC is_admin:", error);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [email]);

  return { isAdmin, loading };
}
