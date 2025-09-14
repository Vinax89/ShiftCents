import { onSchedule } from 'firebase-functions/v2/scheduler'
import { onCall } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { compileFromRegistry } from './compiler'
import { Registry } from './schemas'
import { registry2025 } from './registry.2025.sample'

const db = getFirestore()

function requireAdmin(ctx: any){
  const claims = ctx.auth?.token as any
  if (!claims || !(claims.admin || claims.role === 'admin')) throw new Error('unauthorized')
}

export const refreshTaxCorpus = onSchedule('every 24 hours', async () => {
  await compileFromRegistry(registry2025)
})

export const refreshTaxCorpusNow = onCall(async (req) => {
  requireAdmin(req)
  // Load registry doc if stored in Firestore; fallback to local sample
  const year = (req.data?.year as number) || new Date().getFullYear()
  const doc = await db.doc(`system/taxRegistry/${year}`).get()
  const reg = (doc.exists ? doc.data() : registry2025) as any
  return await compileFromRegistry(Registry.parse(reg))
})
