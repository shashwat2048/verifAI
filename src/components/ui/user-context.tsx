"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type UserContextValue = {
  loading: boolean;
  name: string | null;
  email: string | null;
  role: 'free'|'pro';
  used: number;
  max: number | null; // null for pro
  remaining: number | null; // null for pro
  unlimited: boolean;
};

const Ctx = createContext<UserContextValue>({
  loading: true,
  name: null,
  email: null,
  role: 'free',
  used: 0,
  max: 10,
  remaining: 10,
  unlimited: false,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UserContextValue>({
    loading: true,
    name: null,
    email: null,
    role: 'free',
    used: 0,
    max: 10,
    remaining: 10,
    unlimited: false,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const query = `query { myQuota { used max remaining unlimited } me { name email } }`;
        const res = await fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ query }),
        });
        const json = await res.json();
        const q = json?.data?.myQuota || null;
        const me = json?.data?.me || null;
        if (!mounted) return;

        // For VerifAI v1, everyone is effectively "free" with unlimited scans.
        const used = q?.used ?? 0;
        const max = q?.max ?? null;
        const remaining = q?.remaining ?? null;
        const unlimited = q?.unlimited ?? true;

        setState({
          loading: false,
          name: me?.name || null,
          email: me?.email || null,
          role: 'free',
          used,
          max,
          remaining,
          unlimited,
        });
      } catch {
        if (!mounted) return;
        setState({
          loading: false,
          name: null,
          email: null,
          role: 'free',
          used: 0,
          max: 10,
          remaining: 10,
          unlimited: false,
        });
      }
    })();
    return () => { mounted = false };
  }, []);

  const value = useMemo(()=>state, [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUserContext() {
  return useContext(Ctx);
}


