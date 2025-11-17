import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import AppRoutes from "./routes";

type SessCtx = { session: Session | null; user: User | null; loading: boolean };
const SessionContext = createContext<SessCtx>({ session: null, user: null, loading: true });

export function useSession() {
  return useContext(SessionContext);
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: SessCtx = { session, user: session?.user ?? null, loading };
  return (
    <SessionContext.Provider value={value}>
      <AppRoutes />
    </SessionContext.Provider>
  );
}
