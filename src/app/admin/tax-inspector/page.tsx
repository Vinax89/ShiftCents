'use client'
import { useEffect, useMemo, useState } from 'react'
import { getApp, getApps, initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, Firestore } from 'firebase/firestore'

function getDb(): Firestore | null {
  const cfg = { apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!, authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!, appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID! }
  if (!cfg.apiKey) return null;
  const app = getApps().length ? getApp() : initializeApp(cfg)
  return getFirestore(app)
}

function computeAnnual(annual: number, bands: Array<[number,number]>) { let rem=annual, prev=0, tax=0; for(const [u,r] of bands){ const span=(u===Infinity?Infinity:u)-prev; const amt=Math.min(rem,span); if(amt<=0) break; tax+=amt*r; rem-=amt; prev=u } return Math.round(tax) }
function computePeriod(wage: number, bands?: Array<[number,number]>, bracket?: Array<[number,number]>){ if(bracket?.length){ const row = bracket.find(r=>wage<=r[0]) || bracket[bracket.length-1]; return row?row[1]:0 } if(bands?.length){ let rem=wage, prev=0, tax=0; for(const [u,r] of bands){ const span=(u===Infinity?Infinity:u)-prev; const amt=Math.min(rem,span); if(amt<=0) break; tax+=amt*r; rem-=amt; prev=u } return Math.round(tax) } return 0 }

export default function TaxInspector(){
  const db = useMemo(()=>getDb(),[])
  const [year,setYear] = useState<number>(new Date().getFullYear())
  const [compiled,setCompiled] = useState<any>(null)
  const [kind,setKind] = useState<'federal'|'state'|'locality'>('federal')
  const [code,setCode] = useState<string>('FED')
  const [filing,setFiling] = useState<'single'|'married'|'head'>('single')
  const [resident,setResident] = useState<'resident'|'nonresident'>('resident')
  const [schedule,setSchedule] = useState<'weekly'|'biweekly'|'semimonthly'|'monthly'>('biweekly')
  const [wages,setWages] = useState<number>(2000)
  const [result,setResult] = useState<{ tax:number; path:string }>({ tax:0, path:'n/a' })

  async function load(){ 
    if (!db) return;
    const snap = await getDoc(doc(db, `system/taxRules/${year}/compiled`)); 
    setCompiled(snap.exists()?snap.data():null) 
  }
  useEffect(()=>{ 
    if(db) load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, db])

  useEffect(()=>{
    if (!compiled) return
    if (kind==='locality'){
      const l = (compiled.localities||[]).find((x:any)=>x.code===code)
      const rate = resident==='resident'? (l?.residentRate ?? l?.rate ?? 0) : (l?.nonResidentRate ?? l?.rate ?? 0)
      setResult({ tax: Math.round(wages*rate), path: 'locality:fixed' }); return
    }
    const j = kind==='federal'? compiled.federal : (compiled.states||[]).find((s:any)=>s.code===code)
    const per = j?.perPeriod?.[schedule]
    const table = j?.tables?.find((t:any)=>t.filing===filing)
    const perPct = per?.percentage?.find((t:any)=>t.filing===filing)
    const perBrk = per?.wageBracket?.find((t:any)=>t.filing===filing)

    if (perBrk){ setResult({ tax: computePeriod(wages, undefined, perBrk.rows), path: `per-period:wage-bracket:${schedule}` }); return }
    if (perPct){ setResult({ tax: computePeriod(wages, perPct.bands, undefined), path: `per-period:percentage:${schedule}` }); return }
    if (table){ setResult({ tax: Math.round((computeAnnual(wages*26, table.bands)/26)), path: 'annual-percentage:fallback' }); return }
    setResult({ tax: 0, path: 'none' })
  }, [compiled, kind, code, filing, schedule, wages, resident])

  const stateCodes: string[] = useMemo(()=> (compiled?.states||[]).map((s:any)=>s.code), [compiled])
  const localityCodes: string[] = useMemo(()=> (compiled?.localities||[]).map((l:any)=>l.code), [compiled])
  const perBands: Array<[number,number]> = useMemo(()=>{ if(!compiled||kind==='locality')return []; const j=kind==='federal'?compiled.federal:(compiled.states||[]).find((s:any)=>s.code===code); return j?.perPeriod?.[schedule]?.percentage?.find((t:any)=>t.filing===filing)?.bands || [] },[compiled,kind,code,filing,schedule])
  const perRows: Array<[number,number]> = useMemo(()=>{ if(!compiled||kind==='locality')return []; const j=kind==='federal'?compiled.federal:(compiled.states||[]).find((s:any)=>s.code===code); return j?.perPeriod?.[schedule]?.wageBracket?.find((t:any)=>t.filing===filing)?.rows || [] },[compiled,kind,code,filing,schedule])

  return (
    <div className="space-y-4 max-w-5xl">
      <h1 className="text-xl font-semibold">Tax Visual Inspector (Per‑Period Aware)</h1>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm">Year</label><input type="number" className="border rounded px-3 py-2 w-28" value={year} onChange={e=>setYear(parseInt(e.target.value||String(year),10))} />
        <select className="border rounded px-3 py-2" value={kind} onChange={e=>setKind(e.target.value as any)}>
          <option value="federal">Federal</option><option value="state">State</option><option value="locality">Locality</option>
        </select>
        {kind==='state' && <select className="border rounded px-3 py-2" value={code} onChange={e=>setCode(e.target.value)}>{stateCodes.map(c=> <option key={c} value={c}>{c}</option>)}</select>}
        {kind==='locality' && <select className="border rounded px-3 py-2" value={code} onChange={e=>setCode(e.target.value)}>{localityCodes.map(c=> <option key={c} value={c}>{c}</option>)}</select>}
        {kind!=='locality' && <select className="border rounded px-3 py-2" value={filing} onChange={e=>setFiling(e.target.value as any)}><option value="single">single</option><option value="married">married</option><option value="head">head</option></select>}
        {kind!=='locality' && <select className="border rounded px-3 py-2" value={schedule} onChange={e=>setSchedule(e.target.value as any)}><option value="weekly">weekly</option><option value="biweekly">biweekly</option><option value="semimonthly">semimonthly</option><option value="monthly">monthly</option></select>}
        <label className="text-sm">Wage/period</label><input type="number" className="border rounded px-3 py-2 w-40" value={wages} onChange={e=>setWages(parseInt(e.target.value||'0',10)||0)} />
      </div>

      <div className="border rounded-xl p-4"><div className="text-sm">Computed per‑pay tax: <b>{result.tax}</b> <span className="opacity-70">(path: {result.path})</span></div></div>

      {perRows.length>0 && (
        <div className="border rounded-xl p-4">
          <div className="text-sm font-medium mb-2">Wage Bracket Rows (upto → tax)</div>
          <table className="w-full text-sm"><thead><tr><th>Up to</th><th>Tax</th></tr></thead><tbody>
            {perRows.map((r,i)=>(<tr key={i} className="border-t"><td className="py-1 pr-4">{r[0]===Infinity?'∞':r[0]}</td><td className="py-1">{r[1]}</td></tr>))}
          </tbody></table>
        </div>
      )}

      {perRows.length===0 && perBands.length>0 && (
        <div className="border rounded-xl p-4">
          <div className="text-sm font-medium mb-2">Per‑Period Percentage Bands (upto, rate)</div>
          <table className="w-full text-sm"><thead><tr><th>Up to</th><th>Rate</th></tr></thead><tbody>
            {perBands.map((b,i)=>(<tr key={i} className="border-t"><td className="py-1 pr-4">{b[0]===Infinity?'∞':b[0]}</td><td className="py-1">{(b[1]*100).toFixed(2)}%</td></tr>))}
          </tbody></table>
        </div>
      )}

      <p className="text-xs opacity-70">Computation path prefers <b>wage bracket</b> → <b>per‑period percentage</b> → <b>annual percentage</b>.</p>
    </div>
  )
}
