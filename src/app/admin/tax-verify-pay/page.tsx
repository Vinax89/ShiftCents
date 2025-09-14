'use client'
import { useState } from 'react'
import { getApp, getApps, initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'

function getClients(){
  const cfg = { apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!, authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!, appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID! }
  const app = getApps().length ? getApp() : initializeApp(cfg)
  return { db: getFirestore(app), fns: getFunctions(app) }
}

const SAMPLE = `kind,code,filing,schedule,wagesPerPeriod,expectedPerPeriod,pretaxPerPeriod,creditsPerPeriod,allowances,allowanceValueAnnual,resident
federal,FED,single,biweekly,2000,220,,0,0,0,
state,CA,single,biweekly,2000,70,,0,0,0,
locality,PHL,,biweekly,2000,69,,,,,resident`

function parseCsv(text: string){
  const lines = text.trim().split(/\r?\n/) ; const cols = lines[0].split(',').map(s=>s.trim())
  return lines.slice(1).map(line=>{ const vals=line.split(',').map(s=>s.trim()); const rec:any={}; cols.forEach((k,i)=>rec[k]=vals[i]);
    rec.wagesPerPeriod = Number(rec.wagesPerPeriod); rec.expectedPerPeriod = Number(rec.expectedPerPeriod)
    rec.pretaxPerPeriod = Number(rec.pretaxPerPeriod||0); rec.creditsPerPeriod = Number(rec.creditsPerPeriod||0)
    rec.allowances = Number(rec.allowances||0); rec.allowanceValueAnnual = Number(rec.allowanceValueAnnual||0)
    if(!rec.filing) rec.filing = 'single'; if(!rec.schedule) rec.schedule='biweekly'; return rec })
}

export default function VerifyPay(){
  const { db, fns } = getClients()
  const now = new Date().getFullYear()
  const [year,setYear]=useState<number>(now)
  const [csv,setCsv]=useState(SAMPLE)
  const [tol,setTol]=useState<number>(1)
  const [rounding,setRounding]=useState<'dollar'|'cent'>('dollar')
  const [busy,setBusy]=useState(false)
  const [result,setResult]=useState<any>(null)

  async function upload(){
    setBusy(true)
    try{ const rows = parseCsv(csv); for (const r of rows){ await addDoc(collection(db, `system/taxPaySamples/${year}/cases`), r) }; alert(`Uploaded ${rows.length} cases`) } finally { setBusy(false) }
  }

  async function run(){
    setBusy(true); setResult(null)
    try{ const call = httpsCallable(fns, 'verifyPayCorpusNow'); const res:any = await call({ year, tolerance: tol, rounding }); setResult(res.data) } catch(e:any){ setResult({ error: e?.message || 'failed' }) } finally{ setBusy(false) }
  }

  const pass = result?.passed?.length || 0; const fail = result?.failed?.length || 0

  return (
    <div className="space-y-4 max-w-4xl">
      <h1 className="text-xl font-semibold">Per‑Pay Withholding Verifier</h1>
      <div className="flex flex-wrap gap-2 items-center">
        <label className="text-sm">Year</label>
        <input type="number" className="border rounded px-3 py-2 w-28" value={year} onChange={e=>setYear(parseInt(e.target.value||String(now),10))} />
        <label className="text-sm">Tolerance ($)</label>
        <input type="number" className="border rounded px-3 py-2 w-28" value={tol} onChange={e=>setTol(parseInt(e.target.value||'1',10)||1)} />
        <label className="text-sm">Rounding</label>
        <select className="border rounded px-3 py-2" value={rounding} onChange={e=>setRounding(e.target.value as any)}>
          <option value="dollar">nearest dollar</option>
          <option value="cent">cent</option>
        </select>
        <button disabled={busy} className="border rounded px-3 py-2" onClick={upload}>Upload Examples</button>
        <button disabled={busy} className="border rounded px-3 py-2" onClick={run}>Run Verification</button>
      </div>
      <textarea className="w-full h-[220px] font-mono border rounded p-3" value={csv} onChange={e=>setCsv(e.target.value)} spellCheck={false} />
      {result && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-xl p-4"><div className="font-medium mb-2">Summary</div><div className="text-sm">Passed: <b>{pass}</b> | Failed: <b>{fail}</b></div></div>
          <div className="border rounded-xl p-4 max-h-[360px] overflow-auto">
            <div className="font-medium mb-2">Failures (>{tol}$)</div>
            {fail===0? <div className="text-sm opacity-70">None</div> : (
              <table className="w-full text-sm"><thead><tr><th>kind</th><th>code</th><th>filing</th><th>schedule</th><th>wages</th><th>expected</th><th>actual</th><th>diff</th></tr></thead><tbody>
                {result.failed.map((r:any,i:number)=> (
                  <tr key={i} className="border-t"><td>{r.kind}</td><td>{r.code}</td><td>{r.filing}</td><td>{r.schedule}</td><td>{r.wagesPerPeriod}</td><td>{r.expectedPerPeriod}</td><td>{r.actual}</td><td>{r.diff}</td></tr>
                ))}
              </tbody></table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
