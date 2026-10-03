export const apenasDigitos = (v: string) => v.replace(/\D/g, "");

// (11) 91234-5678 ou (11) 1234-5678, conforme o usuário digita.
export function mascararTelefone(valor: string) {
  const d = apenasDigitos(valor).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// Fixo: DDD + 8 dígitos. Celular: DDD + 9 dígitos começando em 9. DDD de 11 a 99.
export function telefoneValido(valor: string) {
  const d = apenasDigitos(valor);
  if (!/^[1-9][1-9]/.test(d)) return false;
  if (d.length === 10) return /^\d{2}[2-5]/.test(d);
  if (d.length === 11) return d[2] === "9";
  return false;
}
