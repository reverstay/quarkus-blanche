import { useEffect } from "react";
import { supabase } from "../supabase";

/** Reinscreve no realtime e chama onChange em qualquer alteração relevante */
export function useRealtime(onChange: () => void) {
  useEffect(() => {
    const ch = supabase.channel("rt-blanche")
      .on("postgres_changes", { event: "*", schema: "public", table: "MovCab" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "MovItem" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "Employees" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "EmployeeLojaPerms" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "LojaConfig" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "AppSettings" }, onChange)
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [onChange]);
}
