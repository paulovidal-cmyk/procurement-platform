export function calculateSaving(baseline, final, tipo = 'Hard') {
  const b = parseFloat(baseline) || 0
  const f = parseFloat(final) || 0

  if (b === 0) {
    return { savingValue: 0, savingPercent: null, isNegative: false, tipo }
  }

  const savingValue = b - f
  const savingPercent = (savingValue / b) * 100
  const isNegative = savingValue < 0

  return {
    savingValue,
    savingPercent,
    isNegative,
    tipo,
    label: tipo === 'Hard' ? 'Hard Saving' : 'Cost Avoidance',
  }
}
