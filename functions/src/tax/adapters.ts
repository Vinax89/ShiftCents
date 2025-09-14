import type { Src } from './schemas'
import { parseCSV, parseXLSX, parseHTMLtable, toBandsFromColumns, Row } from './parsers'

export type Adapted = {
  tables?: Array<{ filing: 'single'|'married'|'head', bands: Array<[number,number]> }>,
  wageBracket?: Array<{ filing: 'single'|'married'|'head', rows: Array<[number,number]> }>,
  locality?: { residentRate?: number, nonResidentRate?: number, rate?: number }
}

export function adaptFrom(kind: Src['kind'], buf: Buffer, opts: Src): Adapted{
  if (kind === 'csv'){
    const rows = parseCSV(buf); return routeByType(rows, opts)
  }
  if (kind === 'xlsx'){
    const rows = parseXLSX(buf, opts.sheet); return routeByType(rows, opts)
  }
  if (kind === 'html'){
    const rows = parseHTMLtable(buf, opts.selector || 'table'); return routeByType(rows, opts)
  }
  if (kind === 'fixed'){
    return { locality: { residentRate: opts.residentRate ?? null as any, nonResidentRate: opts.nonResidentRate ?? null as any, rate: opts.rate } }
  }
  throw new Error('PDF parsing not implemented; provide CSV/XLSX/HTML or pre‑processed CSV')
}

function routeByType(rows: Row[], opts: Src): Adapted{
  const filing = opts.filing || 'single'
  if (opts.tableType === 'wageBracket'){
    // Heuristics for wage bracket: detect columns for "up to" and "tax"
    const keys = Object.keys(rows[0] || {})
    const uptoKey = keys.find(k=>/up\s*to|upper|wages?\s*to|max/i.test(k)) || keys[0]
    const taxKey = keys.find(k=>/tax|withhold/i.test(k)) || keys[1]
    const out: Array<[number,number]> = []
    for (const r of rows){
      const upto = Number(String(r[uptoKey]).replace(/[,\s]/g,''))
      const amt = Number(String(r[taxKey]).replace(/[$,\s]/g,''))
      if (!isFinite(upto) || !isFinite(amt)) continue
      out.push([upto || Infinity, amt])
    }
    if (out.length && out[out.length-1][0] !== Infinity) out.push([Infinity, out[out.length-1][1]])
    return { wageBracket: [{ filing, rows: out }] }
  }
  // Default: percentage bands from columns
  const bands = toBandsFromColumns(rows, guessUpto(rows), guessRate(rows))
  return { tables: [{ filing, bands }] }
}

function guessUpto(rows: Row[]){ const keys = Object.keys(rows[0] || {}); return keys.find(k=>/up\s*to|upper|wages?\s*to|threshold/i.test(k)) || keys[0] }
function guessRate(rows: Row[]){ const keys = Object.keys(rows[0] || {}); return keys.find(k=>/rate|percent/i.test(k)) || keys[1] }
