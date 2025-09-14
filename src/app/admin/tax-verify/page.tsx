'use client'
import { useEffect, useMemo, useState } from 'react'
import { getApp, getApps, initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'

function getClients(){
  const cfg = { apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!, authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!, appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID! }
  if (!cfg.apiKey) {
    console.error("Firebase config is missing from environment variables.");
    return { db: null, fns: null };
  }
  const app = getApps().length ? getApp() : initializeApp(cfg)
  return { db: getFirestore(app), fns: getFunctions(app) }
}

const SAMPLE_CSV = `kind,code,filing,wagesAnnual,expectedAnnual,source
federal,FED,single,52000,6000,IRS Pub 15-T ex
state,CA,single,52000,2000,FTB example
locality,PHL,single,52000,1976,City wage tax` // replace with real examples

function parseCsv(text: string){
  const [head, ...rows] = text.trim().split(/\r?\n/)
  const cols = head.split(',').map(s=>s.trim())
  return rows.map(line=>{
    const vals = line.split(',').map(s=>s.trim())
    const rec: any = {}
    cols.forEach((k,i)=> rec[k]=vals[i])
    rec.wagesAnnual = Number(rec.wagesAnnual)
    rec.expectedAnnual = Number(rec.expectedAnnual)
    return rec
  })
}

export default function TaxVerify(){
  const { db, fns } = getClients()
  const currentYear = new Date().getFullYear()
  const [year,setYear] = useState<number>(currentYear)
  const [csv,setCsv] = useState<string>(SAMPLE_CSV)
  const [tol,setTol] = useState<number>(1)
  const [busy,setBusy] = useState(false)
  const [result,setResult] = useState<any>(null)

  async function uploadExamples(){
    if (!db) {
      alert('Firebase is not configured.');
      return;
    }
    setBusy(true)
    try{
      const cases = parseCsv(csv)
      for (const c of cases){ await addDoc(collection(db, `system/taxSamples/${year}/cases`), c) }
      alert(`Uploaded ${cases.length} cases for ${year}`)
    } finally { setBusy(false) }
  }

  async function runServer(){
    if (!fns) {
      setResult({ error: 'Firebase Functions not configured.' });
      return;
    }
    setBusy(true); setResult(null)
    try{
      const call = httpsCallable(fns, 'verifyTaxCorpusNow')
      const res: any = await call({ year, tolerance: tol })
      setResult(res.data)
    } catch(e:any){ setResult({ error: e?.message || 'failed' }) }
    finally { setBusy(false) }
  }

  const pass = result?.passed?.length || 0
  const fail = result?.failed?.length || 0

  return (
    <div className="space-y-4 max-w-4xl">
      <h1 className="text-xl font-semibold">Guided Tax Verifier</h1>
      <p className="text-sm opacity-80">Upload official example cases, then run verification against the compiled corpus for the selected year.</p>

      <div className="flex flex-wrap gap-2 items-center">
        <label className="text-sm">Year</label>
        <input type="number" className="border rounded px-3 py-2 w-28" value={year} onChange={e=>setYear(parseInt(e.target.value||String(currentYear),10))} />
        <label className="text-sm">Tolerance ($)</label>
        <input type="number" className="border rounded px-3 py-2 w-28" value={tol} onChange={e=>setTol(parseInt(e.target.value||'1',10)||1)} />
        <button disabled={busy || !db} className="border rounded px-3 py-2" onClick={uploadExamples}>Upload Examples</button>
        <button disabled={busy || !fns} className="border rounded px-3 py-2" onClick={runServer}>Run Verification</button>
      </div>

      <div>
        <textarea className="w-full h-[220px] font-mono border rounded p-3" value={csv} onChange={e=>setCsv(e.target.value)} spellCheck={false} />
        <div className="text-xs mt-1 opacity-70">Columns: kind(federal|state|locality), code(FED|CA|NYC|...), filing(single|married|head), wagesAnnual, expectedAnnual, source</div>
      </div>

      {result && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-xl p-4">
            <div className="font-medium mb-2">Summary</div>
            <div className="text-sm">Passed: <b>{pass}</b> | Failed: <b>{fail}</b></div>
          </div>
          <div className="border rounded-xl p-4 max-h-[360px] overflow-auto">
            <div className="font-medium mb-2">Failures (diff > ${tol})</div>
            {fail===0? <div className="text-sm opacity-70">None</div> : (
              <table className="w-full text-sm"><thead><tr><th>kind</th><th>code</th><th>filing</th><th>wages</th><th>expected</th><th>actual</th><th>diff</th><th>source</th></tr></thead><tbody>
                {result.failed.map((r:any,i:number)=> (
                  <tr key={i} className="border-t"><td>{r.kind}</td><td>{r.code}</td><td>{r.filing}</td><td>{r.wagesAnnual}</td><td>{r.expectedAnnual}</td><td>{r.actual}</td><td>{r.diff}</td><td className="truncate max-w-[200px]" title={r.source}>{r.source}</td></tr>
                ))}
              </tbody></table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
