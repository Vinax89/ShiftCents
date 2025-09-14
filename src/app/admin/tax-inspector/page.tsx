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

function computeTax(annual: number, bands: Array<[number,number]>) {
  let rem = annual, prev = 0, tax = 0
  for (const [upto, rate] of bands){
    const span = (upto === Infinity ? Infinity : upto) - prev
    const amt = Math.min(rem, span)
    if (amt <= 0) break
    tax += amt * rate
    rem -= amt
    prev = upto
  }
  return Math.round(tax)
}

export default function TaxInspector(){
  const db = useMemo(()=>getDb(),[])
  const [year,setYear] = useState<number>(new Date().getFullYear())
  const [compiled,setCompiled] = useState<any>(null)
  const [kind,setKind] = useState<'federal'|'state'|'locality'>('federal')
  const [code,setCode] = useState<string>('FED')
  const [filing,setFiling] = useState<'single'|'married'|'head'>('single')
  const [resident,setResident] = useState<'resident'|'nonresident'>('resident')
  const [wages,setWages] = useState<number>(52000)
  const [tax,setTax] = useState<number>(0)

  async function load(){
    if (!db) return;
    const snap = await getDoc(doc(db, `system/taxRules/${year}/compiled`))
    setCompiled(snap.exists() ? snap.data() : null)
  }

  useEffect(()=>{
    if (db) load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, db])

  useEffect(()=>{
    if (!compiled) return
    if (kind !== 'locality'){
      const j = kind==='federal' ? compiled.federal : (compiled.states as any[]).find((s)=>s.code===code)
      const t = j?.tables?.find((x:any)=>x.filing===filing)
      if (t) setTax(computeTax(wages, t.bands))
    } else {
      const l = (compiled.localities as any[]).find((x)=>x.code===code)
      if (l){
        const rate = resident==='resident' ? (l.residentRate ?? l.rate ?? 0) : (l.nonResidentRate ?? l.rate ?? 0)
        setTax(Math.round(wages * rate))
      }
    }
  }, [compiled, kind, code, filing, wages, resident])

  const stateCodes: string[] = useMemo(()=> (compiled?.states||[]).map((s:any)=>s.code), [compiled])
  const localityCodes: string[] = useMemo(()=> (compiled?.localities||[]).map((l:any)=>l.code), [compiled])

  const currentBands: Array<[number,number]> = useMemo(()=>{
    if (!compiled) return []
    if (kind==='locality') return []
    const j = kind==='federal' ? compiled.federal : (compiled.states||[]).find((s:any)=>s.code===code)
    const t = j?.tables?.find((x:any)=>x.filing===filing)
    return t?.bands || []
  },[compiled, kind, code, filing])

  return (
    <div className="space-y-4 max-w-4xl">
      <h1 className="text-xl font-semibold">Tax Visual Inspector</h1>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm">Year</label>
        <input type="number" className="border rounded px-3 py-2 w-28" value={year} onChange={e=>setYear(parseInt(e.target.value||String(year),10))} />
        <select className="border rounded px-3 py-2" value={kind} onChange={e=>setKind(e.target.value as any)}>
          <option value="federal">Federal</option>
          <option value="state">State</option>
          <option value="locality">Locality</option>
        </select>
        {kind==='state' && (
          <select className="border rounded px-3 py-2" value={code} onChange={e=>setCode(e.target.value)}>
            <option value="">Select state</option>
            {stateCodes.map(c=> <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {kind==='locality' && (
          <select className="border rounded px-3 py-2" value={code} onChange={e=>setCode(e.target.value)}>
            <option value="">Select locality</option>
            {localityCodes.map(c=> <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {kind!=='locality' && (
          <select className="border rounded px-3 py-2" value={filing} onChange={e=>setFiling(e.target.value as any)}>
            <option value="single">single</option>
            <option value="married">married</option>
            <option value="head">head</option>
          </select>
        )}
        {kind==='locality' && (
          <select className="border rounded px-3 py-2" value={resident} onChange={e=>setResident(e.target.value as any)}>
            <option value="resident">resident</option>
            <option value="nonresident">nonresident</option>
          </select>
        )}
        <label className="text-sm">Wages (annual)</label>
        <input type="number" className="border rounded px-3 py-2 w-40" value={wages} onChange={e=>setWages(parseInt(e.target.value||'0',10)||0)} />
      </div>

      <div className="border rounded-xl p-4">
        <div className="text-sm">Computed tax: <span className="font-semibold">${tax}</span></div>
      </div>

      {currentBands.length>0 && (
        <div className="border rounded-xl p-4">
          <div className="text-sm font-medium mb-2">Bands (upto, rate)</div>
          <table className="w-full text-sm">
            <thead><tr><th className="text-left">Up to</th><th className="text-left">Rate</th></tr></thead>
            <tbody>
              {currentBands.map((b,i)=> (
                <tr key={i} className="border-t">
                  <td className="py-1 pr-4">{b[0]===Infinity?'∞':b[0]}</td>
                  <td className="py-1">{(b[1]*100).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs opacity-70">This tool visualizes your compiled bands and runs a simple percentage‑method calculator. Validate against official examples before publishing.</p>
    </div>
  )
}
