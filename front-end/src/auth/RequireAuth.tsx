// src/auth/RequireAuth.tsx
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../supabase";
import { useEffect, useState } from "react";

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      setAuthed(!!session);
      setLoading(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  if (loading) return null; // ou um spinner
  if (!authed) return <Navigate to="/login" replace state={{ from: loc }} />;
  return children;
}
