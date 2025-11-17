import { useEffect, useRef, useState } from "react";

type Entry<T> = { at: number; ttl: number; data: T };

const mem = new Map<string, Entry<any>>();

export function useCache<T>(
  key: string,
  loader: () => Promise<T>,
  ttlMs = 60_000,
  invalidateKey?: any
) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const inflight = useRef<Promise<void> | null>(null);

  useEffect(() => {
    const now = Date.now();
    const hit = mem.get(key);
    if (hit && now - hit.at < hit.ttl) {
      setData(hit.data); setLoading(false); return;
    }
    if (!inflight.current) {
      inflight.current = (async () => {
        setLoading(true);
        const d = await loader();
        mem.set(key, { at: Date.now(), ttl: ttlMs, data: d });
        setData(d); setLoading(false);
        inflight.current = null;
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ttlMs, invalidateKey]);

  return { loading, data };
}
