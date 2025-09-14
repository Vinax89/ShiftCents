import { onCall } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import * as admin from 'firebase-admin'
import { computePeriodTax, periodsPerYear } from './pay.calc'

try { admin.initializeApp() } catch(e) {}
const db = getFirestore()

function requireAdmin(ctx: any){
  const claims = ctx.auth?.token as any
  if (!claims || !(claims.admin || claims.role === 'admin')) throw new Error('unauthorized')
}

export const verifyPayCorpusNow = onCall(async (req) => {
  requireAdmin(req)
  const year = (req.data?.year as number) || new Date().getFullYear()
  const tol = Math.round((req.data?.tolerance as number) ?? 1) // dollars
  const rounding = (req.data?.rounding as 'cent'|'dollar') ?? 'dollar'

  const compiledSnap = await db.doc(`system/taxRules/${year}/compiled`).get()
  if (!compiledSnap.exists) throw new Error('compiled corpus missing')
  const compiled: any = compiledSnap.data()

  const exSnap = await db.collection(`system/taxPaySamples/${year}/cases`).get()
  const cases = exSnap.docs.map(d=> ({ id: d.id, ...d.data() }))

  const failed: any[] = []
  const passed: any[] = []

  for (const c of cases){
    const schedule = (c.schedule || 'biweekly') as 'weekly'|'biweekly'|'semimonthly'|'monthly'
    const wagesPerPeriod = Number(c.wagesPerPeriod)
    const expectedPerPeriod = Number(c.expectedPerPeriod)

    // locate bands or rate
    let actual = 0
    if (c.kind === 'locality'){
      const loc = (compiled.localities||[]).find((l:any)=>l.code===c.code)
      if (!loc){ failed.push({ ...c, reason: 'no locality' }); continue }
      const rate = (c.resident==='nonresident' ? (loc.nonResidentRate ?? loc.rate) : (loc.residentRate ?? loc.rate)) || 0
      actual = (rounding==='cent'? Math.round((wagesPerPeriod*rate)*100)/100 : Math.round(wagesPerPeriod*rate))
    } else {
      const j = c.kind==='federal' ? compiled.federal : (compiled.states||[]).find((s:any)=>s.code===c.code)
      const table = j?.tables?.find((t:any)=>t.filing===c.filing)
      if (!table){ failed.push({ ...c, reason: 'no table' }); continue }
      actual = computePeriodTax({
        wagesPerPeriod,
        schedule,
        filing: c.filing,
        bands: table.bands,
        pretaxPerPeriod: Number(c.pretaxPerPeriod||0),
        creditsPerPeriod: Number(c.creditsPerPeriod||0),
        allowances: Number(c.allowances||0),
        allowanceValueAnnual: Number(c.allowanceValueAnnual||0),
        rounding,
      })
    }

    const diff = Math.abs(actual - expectedPerPeriod)
    if (diff > tol) failed.push({ ...c, actual, diff })
    else passed.push({ ...c, actual, diff })
  }

  const runDoc = await db.collection('system/taxVerifyRuns').add({ year, ts: new Date().toISOString(), kind: 'per-pay', passed: passed.length, failed: failed.length })
  return { runId: runDoc.id, passed, failed }
})
