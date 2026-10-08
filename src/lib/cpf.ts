/** Mantém apenas os dígitos (no máximo 11). */
export function onlyCpfDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11);
}

/** Aplica a máscara 000.000.000-00 progressivamente, conforme o usuário digita. */
export function maskCpf(value: string): string {
  const d = onlyCpfDigits(value);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** Formata um CPF armazenado (só dígitos) para exibição; devolve o valor original se não tiver 11 dígitos. */
export function formatCpf(value: string | null | undefined): string {
  if (!value) return "-";
  const d = value.replace(/\D/g, "");
  return d.length === 11 ? maskCpf(d) : value;
}

/** Valida os dois dígitos verificadores do CPF (algoritmo da Receita Federal). */
export function isValidCpf(value: string): boolean {
  const d = value.replace(/\D/g, "");
  if (d.length !== 11) return false;
  // Sequências repetidas (000.000.000-00, 111...) passam no cálculo, mas são inválidas.
  if (/^(\d)\1{10}$/.test(d)) return false;

  const digits = d.split("").map(Number);
  const calcCheckDigit = (length: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += digits[i] * (length + 1 - i);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return calcCheckDigit(9) === digits[9] && calcCheckDigit(10) === digits[10];
}
