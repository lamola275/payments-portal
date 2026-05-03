import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

export default function ProtectedRoute({ component: Component }) {
  const [, navigate] = useLocation();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuthed(true);
      } else {
        navigate("/login");
      }
      setChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthed(false);
        navigate("/login");
      } else {
        setAuthed(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-400">Checking session…</p>
        </div>
      </div>
    );
  }

  if (!authed) return null;

  return <Component />;
}
