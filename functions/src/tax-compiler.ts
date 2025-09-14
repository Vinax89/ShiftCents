import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getFirestore } from 'firebase-admin/firestore'
import * as admin from 'firebase-admin'
import fs from 'node:fs/promises'
import path from 'node:path'

try {
  admin.initializeApp()
} catch {}
const db = getFirestore()

async function loadLocalAsset(rel: string){
  const p = path.join(process.cwd(), 'assets', rel)
  return JSON.parse(await fs.readFile(p, 'utf8'))
}

async function compileTax(year: number){
  // Replace sample with official corpus later
  const raw = await loadLocalAsset(`tax/${year}.sample.json`)
  // Compile step would transform formulas/tables into compact arrays
  const compiled = { year, version: 1, data: raw }
  await db.doc(`system/taxRules/${year}/_meta`).set({ compiledAt: new Date().toISOString(), version: 1 }, { merge: true })
  await db.doc(`system/taxRules/${year}/compiled`).set(compiled, { merge: true })
}

async function upsertLocality(){
  const map = await loadLocalAsset('locality/zip-to-locality.sample.json')
  const batch = db.batch()
  const col = db.collection('system').doc('localityMap')
  // store as one doc for demo; real impl should shard by prefix
  batch.set(col, map, { merge: true })
  await batch.commit()
}

export const refreshTaxCorpus = onSchedule('every 24 hours', async () => {
  await compileTax(2025)
  await upsertLocality()
})
