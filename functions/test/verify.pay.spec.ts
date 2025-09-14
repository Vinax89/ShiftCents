import { describe, it, expect, vi } from 'vitest'
import { getFirestore } from 'firebase-admin/firestore'
import * as admin from 'firebase-admin'
import { computePeriodTax } from '../src/tax/pay.calc'

vi.mock('firebase-admin/firestore', async () => {
  const actual = await vi.importActual('firebase-admin/firestore');
  const getFirestore = () => ({
    doc: (path: string) => ({
      get: async () => {
        if (path.includes('system/taxRules')) {
          return {
            exists: true,
            data: () => ({
              year: 2025,
              federal: {
                tables: [{ filing: 'single', bands: [[11000, 0.1], [44725, 0.12], [95375, 0.22], [Infinity, 0.24]] }]
              },
              states: [
                { code: 'CA', tables: [{ filing: 'single', bands: [[10412, 0.01], [24684, 0.02], [Infinity, 0.04]] }] }
              ],
              localities: []
            }),
          };
        }
        return { exists: false, data: () => null };
      },
    }),
    collection: (path: string) => ({
      get: async () => {
        if (path.includes('system/taxPaySamples')) {
           return {
            empty: false,
            docs: [
              {
                id: '1',
                data: () => ({ kind: 'federal', code: 'FED', filing: 'single', schedule: 'biweekly', wagesPerPeriod: 2000, expectedPerPeriod: 220 }),
              },
              {
                id: '2',
                data: () => ({ kind: 'state', code: 'CA', filing: 'single', schedule: 'biweekly', wagesPerPeriod: 2000, expectedPerPeriod: 70 }),
              }
            ],
          };
        }
        return { empty: true, docs: [] };
      },
    }),
  });
  return { ...actual, getFirestore };
});

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = getFirestore()

it('per‑pay samples (if present) pass within tolerance', async () => {
  const year = new Date().getFullYear()
  const compiledSnap = await db.doc(`system/taxRules/${year}/compiled`).get()
  if (!compiledSnap.exists) { console.warn('compiled corpus missing, skipping'); return }
  const compiled: any = compiledSnap.data()
  const exSnap = await db.collection(`system/taxPaySamples/${year}/cases`).get()
  if (exSnap.empty) { console.warn('no per‑pay samples, skipping'); return }
  const cases = exSnap.docs.map(d=> ({ id:d.id, ...d.data() }))

  const tol = 1
  for (const c of cases){
    if (c.kind === 'locality') continue // tested client‑side
    const j = c.kind==='federal' ? compiled.federal : (compiled.states||[]).find((s:any)=>s.code===c.code)
    const table = j?.tables?.find((t:any)=>t.filing===c.filing)
    if (!table) continue
    const actual = computePeriodTax({ wagesPerPeriod:Number(c.wagesPerPeriod), schedule:c.schedule, filing:c.filing, bands:table.bands, pretaxPerPeriod:Number(c.pretaxPerPeriod||0), creditsPerPeriod:Number(c.creditsPerPeriod||0), allowances:Number(c.allowances||0), allowanceValueAnnual:Number(c.allowanceValueAnnual||0), rounding:'dollar' })
    expect(Math.abs(actual - Number(c.expectedPerPeriod))).toBeLessThanOrEqual(tol)
  }
}, 10000)
