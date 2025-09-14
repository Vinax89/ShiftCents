import { getFirestore } from 'firebase-admin/firestore'
import * as admin from 'firebase-admin'
import { z } from 'zod'
import { Corpus, Jurisdiction, Table } from './schema'
import { onSchedule } from 'firebase-functions/v2/scheduler'

try { admin.initializeApp() } catch(e) {}
const db = getFirestore()

function compileJurisdiction(j: z.infer<typeof Jurisdiction>){
  return j.tables.map(t => ({ filing: t.filing, bands: t.brackets.map(b => [b.upto ?? Infinity, b.rate]) }))
}

export async function compileAndWrite(corpus: z.infer<typeof Corpus>){
  const compiled = {
    year: corpus.year,
    federal: compileJurisdiction(corpus.federal),
    states: Object.fromEntries(corpus.states.map(s => [s.name, compileJurisdiction(s)])),
  }
  await db.doc(`system/taxRules/${corpus.year}/_meta`).set({ compiledAt: new Date().toISOString(), version: 1 }, { merge: true })
  await db.doc(`system/taxRules/${corpus.year}/compiled`).set(compiled, { merge: true })
  return compiled
}

export const refreshTaxCorpus = onSchedule('every 24 hours', async () => {
  // In production, replace with official sources; here we read local samples via dynamic import
  const year = new Date().getFullYear()
  const federal = (await import('./sources/federal.sample.json')).default
  const ca = (await import('./sources/ca.sample.json')).default
  const corpus = { year, federal, states: [ca] }
  await compileAndWrite(Corpus.parse(corpus))
})
