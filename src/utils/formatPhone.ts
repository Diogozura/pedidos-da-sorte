export function formatPhone(value: string): string {
  // remove tudo que não for dígito e limita a 11 chars
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length === 0) return '';
  if (digits.length < 3) {
    return `(${digits}`;
  }
  if (digits.length < 8) {
    // (11) 11111
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  // (11) 11111-1111
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
