import { onCall } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import * as admin from 'firebase-admin'
import { VerifyParams, ExampleSet } from './verify.schema'
import { computeTaxFromBands, computeLocalityTax } from './verify.calc'

try { admin.initializeApp() } catch(e) {}
const db = getFirestore()

function requireAdmin(ctx: any){
  const claims = ctx.auth?.token as any
  if (!claims || !(claims.admin || claims.role === 'admin')) throw new Error('unauthorized')
}

export const verifyTaxCorpusNow = onCall(async (req) => {
  requireAdmin(req)
  const p = VerifyParams.parse(req.data || {})
  const compiledSnap = await db.doc(`system/taxRules/${p.year}/compiled`).get()
  if (!compiledSnap.exists) throw new Error('compiled corpus missing')
  const compiled: any = compiledSnap.data()

  // Load examples from Firestore (admin-curated)
  const exSnap = await db.collection(`system/taxSamples/${p.year}/cases`).get()
  const cases = exSnap.docs.map(d=> ({ id: d.id, ...d.data() }))
  const { failed, passed } = await runVerify(compiled, cases, p.tolerance)

  const runDoc = await db.collection('system/taxVerifyRuns').add({ year: p.year, ts: new Date().toISOString(), passed: passed.length, failed: failed.length })
  return { runId: runDoc.id, passed, failed }
})

export async function runVerify(compiled: any, cases: any[], toleranceDollars: number){
  const tol = Math.round(toleranceDollars)
  const failed: any[] = []
  const passed: any[] = []

  for (const c of cases){
    let actual = 0
    if (c.kind === 'federal'){
      const table = compiled.federal?.tables?.find((t:any)=>t.filing===c.filing)
      if (!table) { failed.push({ ...c, reason: 'no federal table' }); continue }
      actual = computeTaxFromBands(c.wagesAnnual, table.bands)
    } else if (c.kind === 'state'){
      const st = (compiled.states||[]).find((s:any)=>s.code===c.code)
      const table = st?.tables?.find((t:any)=>t.filing===c.filing)
      if (!table) { failed.push({ ...c, reason: 'no state table' }); continue }
      actual = computeTaxFromBands(c.wagesAnnual, table.bands)
    } else if (c.kind === 'locality'){
      const loc = (compiled.localities||[]).find((l:any)=>l.code===c.code)
      if (!loc) { failed.push({ ...c, reason: 'no locality' }); continue }
      const rate = (loc.residentRate ?? loc.nonResidentRate ?? loc.rate)
      if (typeof rate !== 'number') { failed.push({ ...c, reason: 'no rate' }); continue }
      actual = computeLocalityTax(c.wagesAnnual, rate)
    }

    const diff = Math.abs(actual - c.expectedAnnual)
    if (diff > tol) failed.push({ ...c, actual, diff })
    else passed.push({ ...c, actual, diff })
  }
  return { passed, failed }
}
