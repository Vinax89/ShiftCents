import type { Src } from './schemas'
import { parseCSV, parseXLSX, parseHTMLtable, toBandsFromColumns, Row } from './parsers'

export type Adapted = {
  tables?: Array<{ filing: 'single'|'married'|'head', bands: Array<[number,number]> }>,
  wageBracket?: Array<{ filing: 'single'|'married'|'head', rows: Array<[number,number]> }>,
  locality?: { residentRate?: number, nonResidentRate?: number, rate?: number }
}

export function adaptFrom(kind: Src['kind'], buf: Buffer, opts: Src): Adapted{
  if (kind === 'csv') return routeByType(parseCSV(buf), opts)
  if (kind === 'xlsx') return routeByType(parseXLSX(buf, opts.sheet), opts)
  if (kind === 'html') return routeByType(parseHTMLtable(buf, opts.selector || 'table'), opts)
  if (kind === 'fixed') return { locality: { residentRate: opts.residentRate ?? null as any, nonResidentRate: opts.nonResidentRate ?? null as any, rate: opts.rate } }
  throw new Error('PDF parsing not implemented; provide CSV/XLSX/HTML or pre‑processed CSV')
}

function routeByType(rows: Row[], opts: Src): Adapted{
  const filing = opts.filing || 'single'
  if (opts.tableType === 'wageBracket'){
    const uptoKey = opts.columns?.upto || guessUpto(rows)
    const taxKey  = opts.columns?.tax  || guessTax(rows)
    const out: Array<[number,number]> = []
    for (const r of rows){
      const upto = Number(String(r[uptoKey]).replace(/[,\s]/g,''))
      const amt  = Number(String(r[taxKey]).replace(/[$,\s]/g,''))
      if (!isFinite(upto) || !isFinite(amt)) continue
      out.push([upto || Infinity, amt])
    }
    if (out.length && out[out.length-1][0] !== Infinity) out.push([Infinity, out[out.length-1][1]])
    return { wageBracket: [{ filing, rows: out }] }
  }
  // percentage
  const uptoKey = opts.columns?.upto || guessUpto(rows)
  const rateKey = opts.columns?.rate || guessRate(rows)
  return { tables: [{ filing, bands: toBandsFromColumns(rows, uptoKey, rateKey) }] }
}

function guessUpto(rows: Row[]){ const keys = Object.keys(rows[0] || {}); return keys.find(k=>/up\s*to|upper|wages?\s*to|max|threshold/i.test(k)) || keys[0] }
function guessRate(rows: Row[]){ const keys = Object.keys(rows[0] || {}); return keys.find(k=>/rate|percent|%/i.test(k)) || keys[1] }
function guessTax(rows: Row[]){ const keys = Object.keys(rows[0] || {}); return keys.find(k=>/tax|withhold|amount/i.test(k)) || keys[1] }
