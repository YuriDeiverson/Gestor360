/** Iniciais para avatar (ex.: Yuri → YU; Yuri Silva → YS). */
export function initialsFromName(name?: string | null, fallback = "?"): string {
  const t = name?.trim();
  if (!t) return fallback;
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0];
    const b = parts[parts.length - 1][0];
    return `${a}${b}`.toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}
