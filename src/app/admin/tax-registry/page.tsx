'use client'
import { useEffect, useState } from 'react'
import { getApp, getApps, initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'

const YEAR_DEFAULT = new Date().getFullYear()

function getClients(){
  const cfg = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  }
  if (!cfg.apiKey) {
    console.error("Firebase config is missing from environment variables.");
    // This will be handled gracefully by other parts of the app, but let's prevent a crash here.
    return { db: null, fns: null };
  }
  const app = getApps().length ? getApp() : initializeApp(cfg)
  return { db: getFirestore(app), fns: getFunctions(app) }
}

const SAMPLE = {
  year: YEAR_DEFAULT,
  federal: {
    percentage: { kind: 'pdf', url: 'https://www.irs.gov/pub/irs-pdf/p15t.pdf', note: 'IRS Pub 15-T Percentage Method' }
  },
  states: {
    CA: { percentage: { kind: 'xlsx', url: 'https://example.ca.gov/withholding-2025.xlsx', sheet: 'Single' } },
    NY: { percentage: { kind: 'pdf', url: 'https://example.ny.gov/withholding-2025.pdf' } }
  },
  localities: {
    NYC: { percentage: { kind: 'pdf', url: 'https://example.nyc.gov/nyc-tax-2025.pdf' } },
    PHL: { fixed: { kind: 'fixed', residentRate: 0.0379, nonResidentRate: 0.0344, note: 'Replace with official' } },
    STL: { fixed: { kind: 'fixed', rate: 0.01, note: 'Replace with official' } }
  }
}

export default function TaxRegistryEditor(){
  const { db, fns } = getClients()
  const [year, setYear] = useState<number>(YEAR_DEFAULT)
  const [json, setJson] = useState<string>('')
  const [status, setStatus] = useState<string>('Idle')
  const [busy, setBusy] = useState(false)

  async function load(){
    if (!db) {
      setStatus('Error: Firebase not configured.');
      return;
    }
    setBusy(true); setStatus('Loading…')
    try {
      const snap = await getDoc(doc(db, `system/taxRegistry/${year}`))
      if (snap.exists()) setJson(JSON.stringify(snap.data(), null, 2))
      else setJson(JSON.stringify({ ...SAMPLE, year }, null, 2))
      setStatus('Loaded')
    } catch (e:any) { setStatus('Error: '+(e?.message||'load failed')) } finally { setBusy(false) }
  }

  async function save(){
    if (!db) {
      setStatus('Error: Firebase not configured.');
      return;
    }
    setBusy(true); setStatus('Saving…')
    try {
      const val = JSON.parse(json)
      await setDoc(doc(db, `system/taxRegistry/${year}`), val, { merge: false })
      setStatus('Saved')
    } catch (e:any) { setStatus('Error: '+(e?.message||'invalid JSON')) } finally { setBusy(false) }
  }

  async function refreshNow(){
    if (!fns) {
      setStatus('Error: Firebase not configured.');
      return;
    }
    setBusy(true); setStatus('Compiling from sources…')
    try {
      const call = httpsCallable(fns, 'refreshTaxCorpusNow')
      const res: any = await call({ year })
      setStatus(`Compiled year=${res?.data?.year ?? year}`)
    } catch (e:any) { setStatus('Error: '+(e?.message||'compile failed')) } finally { setBusy(false) }
  }

  useEffect(()=>{
    if(db) load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[year, db])

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-xl font-semibold">Tax Registry — Official Sources</h1>
      <p className="text-sm opacity-80">Edit the per‑year registry of official source URLs and parse options. Save, then **Refresh Now** to fetch → parse → compile.</p>
      <div className="flex items-center gap-2">
        <label className="text-sm">Year</label>
        <input type="number" className="border rounded px-3 py-2 w-32" value={year} onChange={e=>setYear(parseInt(e.target.value||String(YEAR_DEFAULT),10))} />
        <button disabled={busy || !db} onClick={load} className="border rounded px-3 py-2">Reload</button>
        <button disabled={busy || !db} onClick={save} className="border rounded px-3 py-2">Save</button>
        <button disabled={busy || !fns} onClick={refreshNow} className="border rounded px-3 py-2">Refresh Now</button>
      </div>
      <textarea className="w-full h-[520px] font-mono border rounded p-3" value={json} onChange={e=>setJson(e.target.value)} spellCheck={false} />
      <div className="text-sm">{status}</div>
      <details className="mt-2"><summary className="cursor-pointer text-sm font-medium">Registry JSON shape</summary>
        <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">{JSON.stringify(SAMPLE, null, 2)}</pre>
      </details>
    </div>
  )
}
