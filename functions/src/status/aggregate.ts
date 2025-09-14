import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import * as admin from 'firebase-admin'

try { admin.initializeApp() } catch(e) {}
const db = admin.firestore()

type Item = { status?: 'done'|'partial'|'todo'|'verify', weight?: number, category?: string }

export const aggregateAppStatus = onDocumentWritten('system/appStatus/items/{id}', async () => {
  const snap = await db.collection('system/appStatus/items').get()
  const buckets: Record<string,{ total:number, done:number }> = {}
  for (const doc of snap.docs){
    const it = doc.data() as Item
    const cat = it.category || 'misc'
    const w = Number(it.weight||1)
    const b = buckets[cat] ||= { total:0, done:0 }
    b.total += w
    if (it.status === 'done') b.done += w
  }
  const summary: any = { updatedAt: new Date().toISOString(), categories: {} }
  for (const [k,v] of Object.entries(buckets)){ summary.categories[k] = { total: v.total, done: v.done, pct: v.total? Math.round((v.done/v.total)*100):0 } }
  await db.doc('system/appStatus/summary').set(summary, { merge: true })
})
