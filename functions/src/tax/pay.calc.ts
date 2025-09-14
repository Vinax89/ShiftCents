export type Schedule = 'weekly'|'biweekly'|'semimonthly'|'monthly'
export function periodsPerYear(s: Schedule){ return s==='weekly'?52 : s==='biweekly'?26 : s==='semimonthly'?24 : 12 }

export function computeAnnualTaxFromBands(annual: number, bands: Array<[number,number]>) {
  let remaining = annual; let prev = 0; let tax = 0
  for (const [upto, rate] of bands){
    const span = (upto===Infinity?Infinity:upto)-prev
    const amt = Math.min(rem, span)
    if (amt<=0) break
    tax += amt * rate
    remaining -= amt
    prev = upto
  }
  return tax // dollars, not rounded
}

export type PeriodInputs = {
  wagesPerPeriod: number,
  schedule: Schedule,
  filing: 'single'|'married'|'head',
  bands: Array<[number,number]>,
  pretaxPerPeriod?: number,           // reduces taxable wages each period
  creditsPerPeriod?: number,          // subtract from computed tax each period
  allowances?: number,                // optional # of allowances
  allowanceValueAnnual?: number,      // optional annual reduction per allowance
  rounding?: 'cent'|'dollar'          // default 'dollar' (IRS practice)
}

export function computePeriodTax(i: PeriodInputs){
  const periods = periodsPerYear(i.schedule)
  const pretaxAnnual = (i.pretaxPerPeriod ?? 0) * periods
  const allowanceAnnual = (i.allowances ?? 0) * (i.allowanceValueAnnual ?? 0)
  const annualized = i.wagesPerPeriod * periods
  const taxableAnnual = Math.max(0, annualized - pretaxAnnual - allowanceAnnual)
  const annualTax = computeAnnualTaxFromBands(taxableAnnual, i.bands)
  let per = annualTax / periods
  per = per - (i.creditsPerPeriod ?? 0)
  if (i.rounding === 'cent') return Math.max(0, Math.round(per*100)/100)
  // default IRS style: nearest dollar
  return Math.max(0, Math.round(per))
}
