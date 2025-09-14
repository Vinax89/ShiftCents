import type { Src } from './schemas'
import { parseCSV, parseXLSX, parseHTMLtable, toBandsFromColumns, Row } from './parsers'

export type Adapted = { tables?: Array<{ filing: 'single'|'married'|'head', bands: Array<[number,number]> }>, locality?: { residentRate?: number, nonResidentRate?: number, rate?: number } }

export function adaptFrom(kind: Src['kind'], buf: Buffer, opts: Src): Adapted{
  if (kind === 'csv'){
    const rows = parseCSV(buf)
    return guessPercentageTable(rows)
  }
  if (kind === 'xlsx'){
    const rows = parseXLSX(buf, opts.sheet)
    return guessPercentageTable(rows)
  }
  if (kind === 'html'){
    const rows = parseHTMLtable(buf, opts.selector || 'table')
    return guessPercentageTable(rows)
  }
  if (kind === 'fixed'){
    return { locality: { residentRate: opts.residentRate ?? null as any, nonResidentRate: opts.nonResidentRate ?? null as any, rate: opts.rate } }
  }
  // pdf: prefer pre-extracted CSV or manual mapping; leave unimplemented here
  throw new Error('PDF parsing not implemented; supply CSV/XLSX/HTML or fixed rate')
}

function guessPercentageTable(rows: Row[]): Adapted{
  // Heuristics: find columns that look like thresholds and rates
  const keys = Object.keys(rows[0] || {})
  const uptoKey = keys.find(k=>/up\s*to|upper|wages?\s*to|threshold/i.test(k)) || keys[0]
  const rateKey = keys.find(k=>/rate|percent/i.test(k)) || keys[1]
  return { tables: [ { filing: 'single', bands: toBandsFromColumns(rows, uptoKey, rateKey) } ] }
}
