import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import * as admin from 'firebase-admin'

try { admin.initializeApp() } catch(e) {}
const db = admin.firestore()

type Item = { status?: 'done'|'partial'|'todo'|'verify', weight?: number, category?: string }

function floorToMinutes(date: Date, stepMin = 5){
  const ms = date.getTime()
  const stepMs = stepMin * 60_000
  const floored = new Date(ms - (ms % stepMs))
  return floored
}

export const aggregateAppStatus = onDocumentWritten('system/appStatus/items/{id}', async () => {
  const snap = await db.collection('system/appStatus/items').get()
  const buckets: Record<string,{ total:number, done:number }> = {}
  let grandTotal = 0, grandDone = 0

  for (const doc of snap.docs){
    const it = doc.data() as Item
    const cat = it.category || 'misc'
    const w = Number(it.weight||1)
    const b = buckets[cat] ||= { total:0, done:0 }
    b.total += w
    if (it.status === 'done') b.done += w
  }
  for (const b of Object.values(buckets)){ grandTotal += b.total; grandDone += b.done }
  const pct = grandTotal ? Math.round((grandDone/grandTotal)*100) : 0

  // 1) Update summary
  const summary: any = { updatedAt: new Date().toISOString(), categories: {} as any, total: grandTotal, done: grandDone, pct }
  for (const [k,v] of Object.entries(buckets)){ (summary.categories as any)[k] = { total: v.total, done: v.done, pct: v.total? Math.round((v.done/v.total)*100):0 } }
  await db.doc('system/appStatus/summary').set(summary, { merge: true })

  // 2) Append (throttled) history snapshot
  const now = new Date()
  const bucket = floorToMinutes(now, 5)  // at most one point every 5 minutes
  const bucketId = bucket.toISOString().slice(0,16) // e.g., 2025-09-14T21:35
  await db.doc(`system/appStatus/history/${bucketId}`).set({
    ts: now.toISOString(),
    total: grandTotal,
    done: grandDone,
    pct,
    categories: summary.categories,
  }, { merge: true })
})
