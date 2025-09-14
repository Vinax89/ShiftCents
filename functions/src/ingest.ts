import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getFirestore } from 'firebase-admin/firestore'

export const refreshLocalityAndTax = onSchedule('every 24 hours', async () => {
  const db = getFirestore()
  // TODO: fetch locality map + compile tax rules → write to system collections
  await db.doc('system/taxRules/2025/_meta').set({ compiledAt: new Date().toISOString(), source: 'official' }, { merge: true })
})

export const refreshCol = onSchedule('every 24 hours', async () => {
  const db = getFirestore()
  // TODO: fetch CoL indices → system/colIndexes/...
  await db.doc('system/colIndexes/2025/US').set({ updatedAt: new Date().toISOString() }, { merge: true })
})
