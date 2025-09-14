import { parse } from 'csv-parse/sync'
import XLSX from 'xlsx'
import * as cheerio from 'cheerio'

export type Row = Record<string, string | number>

export function parseCSV(buf: Buffer): Row[]{
  const recs = parse(buf, { columns: true, skip_empty_lines: true, trim: true }) as Row[]
  return recs
}
export function parseXLSX(buf: Buffer, sheet?: string): Row[]{
  const wb = XLSX.read(buf)
  const ws = wb.Sheets[sheet || wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json(ws, { raw: true }) as Row[]
}
export function parseHTMLtable(buf: Buffer, selector: string): Row[]{
  const $ = cheerio.load(buf.toString('utf8'))
  const rows: Row[] = []
  const table = $(selector)
  const headers = table.find('tr').first().find('th,td').map((_,th)=>$(th).text().trim()).get()
  table.find('tr').slice(1).each((_,tr)=>{
    const cells = $(tr).find('td').map((_,td)=>$(td).text().trim()).get()
    if(!cells.length) return
    const row: Row = {}
    headers.forEach((h,i)=> row[h || `col${i}`] = cells[i] ?? '')
    rows.push(row)
  })
  return rows
}

// Helpers to map arbitrary rows into percentage-method bands: [upto, rate]
export function toBandsFromColumns(rows: Row[], uptoKey: string, rateKey: string){
  const bands: Array<[number, number]> = []
  for(const r of rows){
    const upto = Number(String(r[uptoKey]).replace(/[,\s]/g,''))
    const rate = Number(String(r[rateKey]).replace(/%/g,''))/100
    if (!isFinite(upto) || !isFinite(rate)) continue
    bands.push([upto || Infinity, rate])
  }
  // Ensure last band is Infinity
  const last = bands[bands.length-1]
  if (last && last[0] !== Infinity) bands.push([Infinity, last[1]])
  return bands
}
