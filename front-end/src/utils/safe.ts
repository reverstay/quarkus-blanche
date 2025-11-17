export function safeArray<T>(v: T[] | null | undefined): T[] {
  return Array.isArray(v) ? v : [];
}
export function safeJoin(v: unknown, sep = ", "): string {
  return Array.isArray(v) ? v.join(sep) : "";
}
export function nil<T>(v: T | null | undefined, fallback: T): T {
  return v == null ? fallback : v;
}
