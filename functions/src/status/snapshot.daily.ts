import { onSchedule } from 'firebase-functions/v2/scheduler'
import * as admin from 'firebase-admin'
try { admin.initializeApp() } catch(e) {}
const db = admin.firestore()

type Item = { status?: 'done'|'partial'|'todo'|'verify', weight?: number, category?: string }

function todayId(date = new Date()){
  return date.toISOString().slice(0,10) // YYYY-MM-DD
}

export const snapshotAppStatusDaily = onSchedule({ schedule: '5 2 * * *', timeZone: 'America/Los_Angeles' }, async () => {
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

  const id = todayId()
  await db.doc(`system/appStatus/history/${id}`).set({ ts: new Date().toISOString(), total: grandTotal, done: grandDone, pct, categories: buckets }, { merge: true })
})
