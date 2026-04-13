/**
 * VPL (Valor Presente Líquido) / NPV calculation
 * @param {Array<{period: number, value: number}>} cashFlows
 * @param {number} discountRate - in percent (e.g. 12 for 12%)
 */
export function calculateVPL(cashFlows, discountRate) {
  if (!cashFlows || cashFlows.length === 0) {
    return { vpl: 0, breakdown: [] }
  }

  const r = (parseFloat(discountRate) || 0) / 100

  const breakdown = cashFlows.map(({ period, value }) => {
    const v = parseFloat(value) || 0
    const t = parseFloat(period) || 0
    const discounted = r === 0 ? v : v / Math.pow(1 + r, t)
    return { period: t, value: v, discounted }
  })

  const vpl = breakdown.reduce((sum, row) => sum + row.discounted, 0)

  return { vpl, breakdown }
}
