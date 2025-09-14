import { onObjectFinalized } from 'firebase-functions/v2/storage'
import { getStorage } from 'firebase-admin/storage'
import { getFirestore } from 'firebase-admin/firestore'
import * as admin from 'firebase-admin'

admin.initializeApp()

export const parseReceipt = onObjectFinalized({ bucket: process.env.RECEIPTS_BUCKET || undefined }, async (event) => {
  const filePath = event.data.name || ''
  if (!filePath) return
  // TODO: download & OCR → extract fields
  const db = getFirestore()
  const [tenantId, receiptId] = filePath.split('/').slice(-2) // convention: receipts/{tenant}/{receiptId}.jpg
  await db.doc(`tenants/${tenantId}/receipts/${receiptId}`).set({ status: 'parsed', result: { amountCents: 0, merchant: 'TBD', confidence: 0.0, ocrEngine: 'cloud' } }, { merge: true })
})
