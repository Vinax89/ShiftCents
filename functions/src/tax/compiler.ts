import { getFirestore } from 'firebase-admin/firestore'
import * as admin from 'firebase-admin'
import { Registry, CompiledCorpus, CompJurisdiction, CompTable } from './schemas'
import { fetchBuffer, cacheRaw } from './fetchers'
import { adaptFrom } from './adapters'

try { admin.initializeApp() } catch(e) {}
const db = getFirestore()

export async function compileFromRegistry(reg: Registry){
  const sources: Record<string, any> = {}

  // Federal
  const fedKey = `federal/percentage`
  const fedSrc = reg.federal.percentage
  if (!fedSrc) throw new Error('Federal percentage source missing')
  const fedBuf = fedSrc.url ? await fetchBuffer(fedSrc.url).catch(()=> Buffer.alloc(0)) : Buffer.alloc(0)
  if (fedSrc.url && fedBuf.length) await cacheRaw(reg.year, fedKey, fedBuf)
  const fedAdapt = adaptFrom(fedSrc.kind, fedBuf, fedSrc)
  const federal: CompJurisdiction = { code: 'FED', name: 'Federal', tables: (fedAdapt.tables || []) as unknown as CompTable[] }

  // States
  const states: CompJurisdiction[] = []
  for (const code of Object.keys(reg.states)){
    const m = reg.states[code]
    const src = m.percentage
    if (!src) continue
    const key = `states/${code}/percentage`
    const buf = src.url ? await fetchBuffer(src.url).catch(()=> Buffer.alloc(0)) : Buffer.alloc(0)
    if (src.url && buf.length) await cacheRaw(reg.year, key, buf)
    const ad = adaptFrom(src.kind, buf, src)
    states.push({ code, name: code, tables: (ad.tables || []) as any })
  }

  // Localities
  const localities: CompiledCorpus['localities'] = []
  for (const code of Object.keys(reg.localities)){
    const srcMap = reg.localities[code]
    const first = Object.values(srcMap)[0]
    if (!first) continue
    const key = `localities/${code}/first`
    const buf = first.url ? await fetchBuffer(first.url).catch(()=> Buffer.alloc(0)) : Buffer.alloc(0)
    if (first.url && buf.length) await cacheRaw(reg.year, key, buf)
    const ad = adaptFrom(first.kind, buf, first)
    localities.push({ code, name: code, residentRate: ad.locality?.residentRate ?? null, nonResidentRate: ad.locality?.nonResidentRate ?? null })
  }

  const compiled: CompiledCorpus = {
    year: reg.year,
    federal,
    states,
    localities,
    meta: { compiledAt: new Date().toISOString(), version: 1, sources }
  }
  await db.doc(`system/taxRules/${reg.year}/compiled`).set(compiled, { merge: true })
  await db.doc(`system/taxRules/${reg.year}/_meta`).set({ compiledAt: compiled.meta.compiledAt, version: 1 }, { merge: true })
  return compiled
}
