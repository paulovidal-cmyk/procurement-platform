const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const USD = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' })
const EUR = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'EUR' })
const PCT = new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })

const formatters = { BRL, USD, EUR }

export function formatCurrency(value, currency = 'BRL') {
  if (value === null || value === undefined || isNaN(value)) return '—'
  return (formatters[currency] || BRL).format(value)
}

export function formatPercent(value) {
  if (value === null || value === undefined || isNaN(value)) return '—'
  return PCT.format(value / 100)
}

export function formatDate(isoString) {
  if (!isoString) return '—'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(isoString))
}

export function formatDateTime(isoString) {
  if (!isoString) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(isoString))
}

export function parseNumber(str) {
  if (typeof str === 'number') return str
  const cleaned = String(str).replace(/[^\d,.-]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}
