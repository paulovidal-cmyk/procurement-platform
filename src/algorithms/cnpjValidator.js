export function maskCNPJ(value) {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return digits.replace(/^(\d{2})(\d+)/, '$1.$2')
  if (digits.length <= 8) return digits.replace(/^(\d{2})(\d{3})(\d+)/, '$1.$2.$3')
  if (digits.length <= 12) return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4')
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, '$1.$2.$3/$4-$5')
}

export function validateCNPJ(raw) {
  const digits = raw.replace(/\D/g, '')

  if (digits.length !== 14) {
    return { valid: false, error: 'CNPJ deve ter 14 dígitos' }
  }

  if (/^(\d)\1{13}$/.test(digits)) {
    return { valid: false, error: 'CNPJ inválido' }
  }

  const calcDigit = (weights) =>
    weights.reduce((sum, w, i) => sum + parseInt(digits[i]) * w, 0)

  const rem1 = calcDigit([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) % 11
  const d1 = rem1 < 2 ? 0 : 11 - rem1

  const rem2 = calcDigit([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) % 11
  const d2 = rem2 < 2 ? 0 : 11 - rem2

  if (parseInt(digits[12]) !== d1 || parseInt(digits[13]) !== d2) {
    return { valid: false, error: 'Dígitos verificadores inválidos' }
  }

  return {
    valid: true,
    formatted: digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5'),
  }
}
