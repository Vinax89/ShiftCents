export type Schedule = 'weekly'|'biweekly'|'semimonthly'|'monthly'
export function periodsPerYear(s: Schedule){ return s==='weekly'?52 : s==='biweekly'?26 : s==='semimonthly'?24 : 12 }

export function computeAnnualTaxFromBands(annual: number, bands: Array<[number,number]>) {
  let remaining = annual; let prev = 0; let tax = 0
  for (const [upto, rate] of bands){ const span=(upto===Infinity?Infinity:upto)-prev; const amt=Math.min(remaining, span); if(amt<=0) break; tax+=amt*rate; remaining-=amt; prev=upto }
  return tax
}

export type PeriodInputs = {
  wagesPerPeriod: number,
  schedule: Schedule,
  filing: 'single'|'married'|'head',
  // Sources
  periodBands?: Array<[number,number]>,     // per‑period percentage bands
  periodBracketRows?: Array<[number,number]>, // wage bracket rows [upto, tax]
  annualBands?: Array<[number,number]>,
  pretaxPerPeriod?: number,
  creditsPerPeriod?: number,
  allowances?: number,
  allowanceValueAnnual?: number,
  rounding?: 'cent'|'dollar'
}

export function computePeriodTax(i: PeriodInputs){
  const periods = periodsPerYear(i.schedule)
  const pretaxAnnual = (i.pretaxPerPeriod ?? 0) * periods
  const allowanceAnnual = (i.allowances ?? 0) * (i.allowanceValueAnnual ?? 0)
  const annualized = i.wagesPerPeriod * periods
  const taxableAnnual = Math.max(0, annualized - pretaxAnnual - allowanceAnnual)

  let per: number
  // 1) Wage bracket per‑period (preferred)
  if (i.periodBracketRows && i.periodBracketRows.length){
    const row = i.periodBracketRows.find(r => i.wagesPerPeriod <= r[0]) || i.periodBracketRows[i.periodBracketRows.length-1]
    per = row ? row[1] : 0
  }
  // 2) Per‑period percentage bands
  else if (i.periodBands && i.periodBands.length){
    let remaining = i.wagesPerPeriod; let prev = 0; let tax = 0
    for (const [upto, rate] of i.periodBands){ const span=(upto===Infinity?Infinity:upto)-prev; const amt=Math.min(remaining, span); if(amt<=0) break; tax+=amt*rate; remaining-=amt; prev=upto }
    per = tax
  }
  // 3) Annual percentage bands (fallback)
  else if (i.annualBands && i.annualBands.length){
    per = computeAnnualTaxFromBands(taxableAnnual, i.annualBands) / periods
  }
  else per = 0

  per = per - (i.creditsPerPeriod ?? 0)
  if (i.rounding === 'cent') return Math.max(0, Math.round(per*100)/100)
  return Math.max(0, Math.round(per))
}
