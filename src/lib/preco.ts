// Aceita "1234.5", "1234,50" e "1.234,50". Retorna null se não for um número.
export function parsePreco(valor: string): number | null {
  const v = valor.trim().replace(/^R\$\s*/, "");
  if (!v) return null;
  const normal = v.includes(",") ? v.replace(/\./g, "").replace(",", ".") : v;
  if (!/^\d+(\.\d+)?$/.test(normal) && !/^-\d+(\.\d+)?$/.test(normal)) return null;
  const n = Number(normal);
  return Number.isFinite(n) ? n : null;
}
