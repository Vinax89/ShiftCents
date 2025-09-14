import { getFirestore } from 'firebase-admin/firestore'
import * as admin from 'firebase-admin'
import { Registry, CompiledCorpus, CompJurisdiction, CompTable, CompPerPeriod, CompWageBracket } from './schemas'
import { fetchBuffer, cacheRaw } from './fetchers'
import { adaptFrom } from './adapters'

try { admin.initializeApp() } catch(e) {}
const db = getFirestore()

function emptyPerPeriod(): CompPerPeriod { return { weekly:{}, biweekly:{}, semimonthly:{}, monthly:{} } as any }

function mergePerPeriod(dst: any, schedule: string, ad: any){
  dst[schedule] = dst[schedule] || {}
  if (ad.tables && ad.tables.length){ dst[schedule].percentage = [...(dst[schedule].percentage||[]), ...ad.tables] }
  if (ad.wageBracket && ad.wageBracket.length){ dst[schedule].wageBracket = [...(dst[schedule].wageBracket||[]), ...ad.wageBracket] }
}

async function buildJurisdiction(code: string, name: string, entries: Record<string, any>, year: number){
  const tables: CompTable[] = []
  const perPeriod: CompPerPeriod = emptyPerPeriod()

  for (const key of Object.keys(entries)){
    const src = entries[key]
    const buf = src.url ? await fetchBuffer(src.url).catch(()=> Buffer.alloc(0)) : Buffer.alloc(0)
    if (src.url && buf.length > 0) await cacheRaw(year, `${code}/${key}`, buf)
    const ad = adaptFrom(src.kind, buf, src)

    // Keys that include schedule indicate per‑period (e.g., wageBracket_biweekly)
    const schedule = src.schedule as string | undefined
    if (schedule){ mergePerPeriod(perPeriod as any, schedule, ad) }
    else if (ad.tables){ tables.push(...(ad.tables as any)) }
  }

  return { code, name, tables, perPeriod }
}

export async function compileFromRegistry(reg: Registry){
  // Federal
  const federal = await buildJurisdiction('FED', 'Federal', reg.federal as any, reg.year) as unknown as CompJurisdiction

  // States
  const states: CompJurisdiction[] = []
  for (const code of Object.keys(reg.states)){
    const j = await buildJurisdiction(code, code, reg.states[code] as any, reg.year)
    states.push(j as any)
  }

  // Localities (fixed or percentage; unchanged)
  const localities: CompiledCorpus['localities'] = []
  for (const code of Object.keys(reg.localities)){
    const srcMap = reg.localities[code]
    const first = Object.values(srcMap)[0]
    if (!first) continue
    const buf = first.url ? await fetchBuffer(first.url).catch(()=> Buffer.alloc(0)) : Buffer.alloc(0)
    if (first.url && buf.length > 0) await cacheRaw(reg.year, `localities/${code}/first`, buf)
    const ad = adaptFrom(first.kind, buf, first)
    localities.push({ code, name: code, residentRate: ad.locality?.residentRate ?? null, nonResidentRate: ad.locality?.nonResidentRate ?? null })
  }

  const compiled: CompiledCorpus = {
    year: reg.year,
    federal,
    states,
    localities,
    meta: { compiledAt: new Date().toISOString(), version: 2, sources: {} }
  }

  await db.doc(`system/taxRules/${reg.year}/compiled`).set(compiled, { merge: true })
  await db.doc(`system/taxRules/${reg.year}/_meta`).set({ compiledAt: compiled.meta.compiledAt, version: 2 }, { merge: true })
  return compiled
}
