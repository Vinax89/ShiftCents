/**
 * Minimal percentage‑method calculator against compiled bands [upto, rate].
 * This mirrors the inspector math. For locality fixed rates we apply rate*wages.
 */
export function computeTaxFromBands(wagesAnnual: number, bands: Array<[number,number]>) {
  let remaining = wagesAnnual; let prev = 0; let tax = 0
  for (const [upto, rate] of bands){
    const span = (upto === Infinity ? Infinity : upto) - prev
    const amt = Math.min(remaining, span)
    if (amt <= 0) break
    tax += amt * rate
    remaining -= amt
    prev = upto
  }
  return Math.round(tax)
}

export function computeLocalityTax(wagesAnnual: number, rate: number){
  return Math.round(wagesAnnual * rate)
}
