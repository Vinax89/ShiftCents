import { onCall } from 'firebase-functions/v2/https'
// Minimal stub: returns a fake parse; replace with Vision or Tesseract later
export const ocrFallback = onCall(async (req) => {
  // input: { gsPath?: string }
  return { amountCents: null, dateISO: null, merchant: null, confidence: 0.0, engine: 'cloud' }
})
