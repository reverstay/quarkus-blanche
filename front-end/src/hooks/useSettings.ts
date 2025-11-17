import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export function useSettings() {
  const [daysBack, setDaysBack] = useState<number>(0);
  const [daysAhead, setDaysAhead] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from("AppSettings").select("days_back,days_ahead").eq("id", 1).maybeSingle();
      if (error) console.error(error);
      if (alive) {
        setDaysBack(data?.days_back ?? 0);
        setDaysAhead(data?.days_ahead ?? 1);
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return { loading, daysBack, daysAhead };
}
