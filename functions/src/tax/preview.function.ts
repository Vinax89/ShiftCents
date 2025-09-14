import { onCall } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'
import { fetchBuffer } from './fetchers'
import { parseCSV, parseXLSX, parseHTMLtable } from './parsers'

try { admin.initializeApp() } catch(e) {}
const db = getFirestore()

function requireAdmin(ctx: any){ const c = ctx.auth?.token as any; if (!c || !(c.admin || c.role==='admin')) throw new Error('unauthorized') }

export const previewTaxSource = onCall(async (req) => {
  requireAdmin(req)
  const { year, kind, code, sourceKey } = req.data || {}
  if (!year || !kind || !sourceKey) throw new Error('missing params')
  const doc = await db.doc(`system/taxRegistry/${year}`).get()
  if (!doc.exists) throw new Error('registry missing')
  const reg: any = doc.data()
  const src = kind==='federal' ? reg.federal?.[sourceKey] : kind==='state' ? reg.states?.[code]?.[sourceKey] : reg.localities?.[code]?.[sourceKey]
  if (!src) throw new Error('source not found in registry')
  if (src.kind==='fixed') return { kind:'fixed', keys:[], rows:[], src }
  if (src.kind==='pdf') return { kind:'pdf', keys:[], rows:[], src, note:'PDF preview unsupported; provide CSV/XLSX/HTML instead' }
  if (!src.url) throw new Error('source url missing')

  const buf = await fetchBuffer(src.url)
  let rows: any[] = []
  if (src.kind==='csv') rows = parseCSV(buf)
  else if (src.kind==='xlsx') rows = parseXLSX(buf, src.sheet)
  else if (src.kind==='html') rows = parseHTMLtable(buf, src.selector || 'table')

  const keys = rows.length ? Object.keys(rows[0]) : []
  // simple guesses
  const upto = src.columns?.upto || keys.find((k:string)=>/up\s*to|upper|wages?\s*to|max|threshold/i.test(k))
  const rate = src.columns?.rate || keys.find((k:string)=>/rate|percent|%/i.test(k))
  const tax  = src.columns?.tax  || keys.find((k:string)=>/tax|withhold|amount/i.test(k))

  return { kind: src.kind, keys, rows: rows.slice(0, 15), guess: { upto, rate, tax }, src }
})
