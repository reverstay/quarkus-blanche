/** Formata datas vindas do banco (YYYY-MM-DD, ISO ou Date) para pt-BR. */
export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  try {
    // Supabase costuma mandar "YYYY-MM-DD" (sem hora) ou ISO.
    if (typeof d === "string") {
      // normaliza "YYYY-MM-DD" para Date no fuso local
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
      const date = m
        ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
        : new Date(d);
      if (isNaN(date.getTime())) return d; // deixa como veio se não deu pra parsear
      return date.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
    }
    // já é Date
    return d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  } catch {
    return typeof d === "string" ? d : "—";
  }
}

/** Opcional: formata números com separador pt-BR. */
export function fmtNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("pt-BR").format(n);
}
