'use client'
import { useEffect, useMemo, useState } from 'react'
import { getApp, getApps, initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc } from 'firebase/firestore'
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

export default function TaxMapper(){
  const { db, fns } = getClients()
  const now = new Date().getFullYear()
  const [year,setYear] = useState<number>(now)
  const [kind,setKind] = useState<'federal'|'state'|'locality'>('state')
  const [code,setCode] = useState<string>('CA')
  const [sourceKey,setSourceKey] = useState<string>('percentage')
  const [loading,setLoading] = useState(false)
  const [preview,setPreview] = useState<any>(null)
  const [tableType,setTableType] = useState<'percentage'|'wageBracket'|'fixed'>('percentage')
  const [schedule,setSchedule] = useState<'weekly'|'biweekly'|'semimonthly'|'monthly'|''>('')
  const [filing,setFiling] = useState<'single'|'married'|'head'>('single')
  const [map,setMap] = useState<{ upto?: string; rate?: string; tax?: string }>({})
  const [status,setStatus] = useState<string>('')

  async function load(){
    if (!fns) {
      setStatus('Firebase Functions not configured.');
      return;
    }
    setLoading(true); setStatus('Loading…')
    try{
      const call = httpsCallable(fns, 'previewTaxSource')
      const res: any = await call({ year, kind, code, sourceKey })
      setPreview(res.data)
      setTableType(res.data?.src?.tableType || (res.data?.src?.kind==='fixed'?'fixed':'percentage'))
      setSchedule(res.data?.src?.schedule || '')
      setFiling(res.data?.src?.filing || 'single')
      setMap({ upto: res.data?.guess?.upto, rate: res.data?.guess?.rate, tax: res.data?.guess?.tax })
      setStatus('Loaded')
    } catch(e:any){ setStatus('Error: '+(e?.message||'failed')) } finally { setLoading(false) }
  }

  function deepSet(obj:any, keys:string[], value:any){ let o=obj; for(let i=0;i<keys.length-1;i++){ o[keys[i]] = o[keys[i]] || {}; o = o[keys[i]] } o[keys[keys.length-1]] = value }

  async function save(){
    if (!db) {
        setStatus('Firestore not configured.');
        return;
    }
    setLoading(true); setStatus('Saving…')
    try{
      const ref = doc(db, `system/taxRegistry/${year}`)
      const payload:any = {}
      const base = kind==='federal' ? ['federal', sourceKey] : kind==='state' ? ['states', code, sourceKey] : ['localities', code, sourceKey]
      deepSet(payload, [...base, 'tableType'], tableType)
      if (schedule) deepSet(payload, [...base, 'schedule'], schedule)
      if (filing) deepSet(payload, [...base, 'filing'], filing as any)
      deepSet(payload, [...base, 'columns'], map)
      await setDoc(ref, payload, { merge: true })
      setStatus('Saved. You can now compile from /admin/tax-registry → Refresh Now')
    } catch(e:any){ setStatus('Error: '+(e?.message||'failed')) } finally { setLoading(false) }
  }

  async function compileNow(){
    if (!fns) {
        setStatus('Firebase Functions not configured.');
        return;
    }
    setLoading(true); setStatus('Compiling…')
    try{ const call = httpsCallable(fns, 'refreshTaxCorpusNow'); const res:any = await call({ year }); setStatus('Compiled year='+ (res?.data?.year||year)) } catch(e:any){ setStatus('Error: '+(e?.message||'compile failed')) } finally{ setLoading(false) }
  }

  const keys: string[] = preview?.keys || []
  const rows: any[] = preview?.rows || []

  return (
    <div className="space-y-4 max-w-6xl">
      <h1 className="text-xl font-semibold">Tax Source Column Mapper</h1>
      <p className="text-sm opacity-80">Preview official CSV/XLSX/HTML, map its columns to canonical fields, and save to the registry. The compiler will use your mapping.</p>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm">Year</label>
        <input type="number" className="border rounded px-3 py-2 w-28" value={year} onChange={e=>setYear(parseInt(e.target.value||String(now),10))} />
        <label className="text-sm">Kind</label>
        <select className="border rounded px-3 py-2" value={kind} onChange={e=>setKind(e.target.value as any)}>
          <option value="federal">federal</option>
          <option value="state">state</option>
          <option value="locality">locality</option>
        </select>
        {kind!=='federal' && (
          <>
            <label className="text-sm">Code</label>
            <input className="border rounded px-3 py-2 w-28" placeholder="CA/NY/NYC" value={code} onChange={e=>setCode(e.target.value)} />
          </>
        )}
        <label className="text-sm">Source Key</label>
        <input className="border rounded px-3 py-2 w-56" placeholder="percentage / wageBracket_biweekly" value={sourceKey} onChange={e=>setSourceKey(e.target.value)} />
        <button disabled={loading || !fns} onClick={load} className="border rounded px-3 py-2">Load Preview</button>
      </div>

      {preview && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border rounded-xl p-4 space-y-2">
            <div className="font-medium">Mapping</div>
            <div className="text-xs opacity-70">Choose which columns represent each field.</div>

            <label className="text-sm">Table Type</label>
            <select className="border rounded px-3 py-2 w-full" value={tableType} onChange={e=>setTableType(e.target.value as any)}>
              <option value="percentage">percentage (bands)</option>
              <option value="wageBracket">wage bracket (rows)</option>
              <option value="fixed">fixed (locality)</option>
            </select>

            <label className="text-sm">Schedule (optional)</label>
            <select className="border rounded px-3 py-2 w-full" value={schedule} onChange={e=>setSchedule(e.target.value as any)}>
              <option value="">(none)</option>
              <option value="weekly">weekly</option>
              <option value="biweekly">biweekly</option>
              <option value="semimonthly">semimonthly</option>
              <option value="monthly">monthly</option>
            </select>

            <label className="text-sm">Filing</label>
            <select className="border rounded px-3 py-2 w-full" value={filing} onChange={e=>setFiling(e.target.value as any)}>
              <option value="single">single</option>
              <option value="married">married</option>
              <option value="head">head</option>
            </select>

            <label className="text-sm">Up to (threshold)</label>
            <select className="border rounded px-3 py-2 w-full" value={map.upto||''} onChange={e=>setMap(m=>({...m, upto: e.target.value}))}>
              <option value="">(auto)</option>
              {keys.map(k=> <option key={k} value={k}>{k}</option>)}
            </select>

            <label className="text-sm">Rate (%)</label>
            <select className="border rounded px-3 py-2 w-full" value={map.rate||''} onChange={e=>setMap(m=>({...m, rate: e.target.value}))}>
              <option value="">(auto)</option>
              {keys.map(k=> <option key={k} value={k}>{k}</option>)}
            </select>

            <label className="text-sm">Tax Amount ($)</label>
            <select className="border rounded px-3 py-2 w-full" value={map.tax||''} onChange={e=>setMap(m=>({...m, tax: e.target.value}))}>
              <option value="">(auto)</option>
              {keys.map(k=> <option key={k} value={k}>{k}</option>)}
            </select>

            <div className="flex gap-2 pt-2">
              <button disabled={loading || !db} onClick={save} className="border rounded px-3 py-2">Save Mapping</button>
              <button disabled={loading || !fns} onClick={compileNow} className="border rounded px-3 py-2">Compile Now</button>
            </div>
            <div className="text-sm">{status}</div>
          </div>

          <div className="md:col-span-2 border rounded-xl p-4 overflow-auto">
            <div className="font-medium mb-2">Preview (first 15 rows)</div>
            {!rows.length ? (
              <div className="text-sm opacity-70">No rows found. Ensure the URL points to a CSV/XLSX or an HTML page with a table.</div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr>{keys.map((k:string)=> <th key={k} className="text-left pr-4 pb-1">{k}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.map((r:any,i:number)=> (
                    <tr key={i} className="border-t">
                      {keys.map((k:string)=> <td key={k} className="py-1 pr-4 whitespace-nowrap">{String(r[k]).slice(0,64)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
