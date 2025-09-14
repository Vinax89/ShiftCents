'use client'
import { useEffect, useMemo, useState } from 'react'
import { getApp, getApps, initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { domainFromUrl, suggestMapping, Mapping, TableType, Schedule, Filing } from '@/lib/tax/mapper-memory'

function getClients(){
  const cfg = { apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!, authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!, appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID! }
  if (!cfg.apiKey) {
    console.error("Firebase config is missing from environment variables.");
    return { db: null, fns: null };
  }
  const app = getApps().length ? getApp() : initializeApp(cfg)
  return { db: getFirestore(app), fns: getFunctions(app) }
}

// Utilities to deep set / get on registry docs
function deepSet(obj:any, keys:string[], value:any){ let o=obj; for(let i=0;i<keys.length-1;i++){ o[keys[i]] = o[keys[i]] || {}; o = o[keys[i]] } o[keys[keys.length-1]] = value }
async function deepMergeSet(db:any, path:string[], payload:any){ const ref = doc(db, path.join('/')); await setDoc(ref, payload, { merge: true }) }

export default function TaxMapper(){
  const { db, fns } = getClients()
  const now = new Date().getFullYear()
  const [year,setYear] = useState<number>(now)
  const [kind,setKind] = useState<'federal'|'state'|'locality'>('state')
  const [code,setCode] = useState<string>('CA')
  const [sourceKey,setSourceKey] = useState<string>('percentage')
  const [loading,setLoading] = useState(false)
  const [preview,setPreview] = useState<any>(null)
  const [tableType,setTableType] = useState<TableType>('percentage')
  const [schedule,setSchedule] = useState<Schedule|''>('')
  const [filing,setFiling] = useState<Filing>('single')
  const [map,setMap] = useState<Mapping>({})
  const [status,setStatus] = useState<string>('')

  // Mapper Memory
  const [domain,setDomain] = useState<string| null>(null)
  const [memory,setMemory] = useState<any>(null)
  const [applySuggested,setApplySuggested] = useState<boolean>(false)

  // Copy to schedules
  const [copyTargets,setCopyTargets] = useState<Record<Schedule,boolean>>({ weekly:false, biweekly:true, semimonthly:false, monthly:false })

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
      const tType = res.data?.src?.tableType || (res.data?.src?.kind==='fixed'?'fixed':'percentage')
      setTableType(tType)
      setSchedule(res.data?.src?.schedule || '')
      setFiling(res.data?.src?.filing || 'single')
      const url = res.data?.src?.url as string | undefined
      const d = domainFromUrl(url)
      setDomain(d)
      // Load memory
      let mem: any = null
      if (d && db){ const msnap = await getDoc(doc(db, 'system/taxMapperMemory', d)); mem = msnap.exists()? msnap.data() : { domain: d, templates: [] } }
      setMemory(mem)
      // Suggest mapping
      const keys: string[] = res.data?.keys || []
      const suggested = suggestMapping(keys, mem, { tableType: tType })
      setMap(m=>({ ...suggested, ...m }))
      setStatus('Loaded')
    } catch(e:any){ setStatus('Error: '+(e?.message||'failed')) } finally { setLoading(false) }
  }

  async function save(){
    if (!db) {
        setStatus('Firestore not configured.');
        return;
    }
    setLoading(true); setStatus('Saving…')
    try{
      // 1) Save mapping to registry
      const regPayload:any = {}
      const root = kind==='federal' ? ['federal', sourceKey] : kind==='state' ? ['states', code, sourceKey] : ['localities', code, sourceKey]
      deepSet(regPayload, [...root, 'tableType'], tableType)
      if (schedule) deepSet(regPayload, [...root, 'schedule'], schedule)
      if (filing) deepSet(regPayload, [...root, 'filing'], filing)
      deepSet(regPayload, [...root, 'columns'], map)
      await deepMergeSet(db, ['system','taxRegistry', String(year)], regPayload)

      // 2) Save to memory (domain template)
      if (domain){
        const tmpl = { tableType, schedule: (schedule||undefined) as any, filing, mapping: map, headers: (preview?.keys||[]), sourceKey, updatedAt: new Date().toISOString() }
        const docRef = doc(db, 'system/taxMapperMemory', domain)
        const msnap = await getDoc(docRef)
        const prev = msnap.exists()? msnap.data() : { domain, templates: [] as any[] }
        prev.templates = [...(prev.templates||[]), tmpl]
        await setDoc(docRef, prev, { merge: true })
      }

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

  async function copyToSchedules(){
    if (!db) {
        setStatus('Firestore not configured.');
        return;
    }
    if (!schedule){ alert('Choose a source schedule or map without schedule to copy.'); return }
    setLoading(true); setStatus('Copying…')
    try{
      const targets = (Object.keys(copyTargets) as Schedule[]).filter(s=> copyTargets[s])
      const regRefPath = ['system','taxRegistry', String(year)]
      const batchPayload:any = {}
      for (const s of targets){
        if (s === schedule) continue
        const key = tableType==='wageBracket' ? `wageBracket_${s}` : tableType==='percentage' ? `percentage_${s}` : sourceKey
        const root = kind==='federal' ? ['federal', key] : kind==='state' ? ['states', code, key] : ['localities', code, key]
        deepSet(batchPayload, [...root, 'tableType'], tableType)
        deepSet(batchPayload, [...root, 'schedule'], s)
        deepSet(batchPayload, [...root, 'filing'], filing)
        deepSet(batchPayload, [...root, 'columns'], map)
      }
      await deepMergeSet(db, regRefPath, batchPayload)
      setStatus('Copied mappings to selected schedules.')
    } catch(e:any){ setStatus('Error: '+(e?.message||'copy failed')) } finally { setLoading(false) }
  }

  const keys: string[] = preview?.keys || []
  const rows: any[] = preview?.rows || []

  return (
    <div className="space-y-4 max-w-6xl">
      <h1 className="text-xl font-semibold">Tax Source Column Mapper</h1>
      <p className="text-sm opacity-80">Preview official CSV/XLSX/HTML, map to canonical fields, **auto‑suggest** from memory, and copy mappings across schedules.</p>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm">Year</label>
        <input type="number" className="border rounded px-3 py-2 w-28" value={year} onChange={e=>setYear(parseInt(e.target.value||String(now),10))} />
        <label className="text-sm">Kind</label>
        <select className="border rounded px-3 py-2" value={kind} onChange={e=>setKind(e.target.value as any)}>
          <option value="federal">federal</option>
          <option value="state">state</option>
          <option value="locality">locality</option>
        </select>
        {kind!=='federal' && (<><label className="text-sm">Code</label><input className="border rounded px-3 py-2 w-28" placeholder="CA/NY/NYC" value={code} onChange={e=>setCode(e.target.value)} /></>)}
        <label className="text-sm">Source Key</label>
        <input className="border rounded px-3 py-2 w-56" placeholder="percentage / wageBracket_biweekly" value={sourceKey} onChange={e=>setSourceKey(e.target.value)} />
        <button disabled={loading || !fns} onClick={load} className="border rounded px-3 py-2">Load Preview</button>
      </div>

      {domain && (
        <div className="text-xs opacity-70">Domain: <b>{domain}</b> {memory?.templates?.length? `(templates: ${memory.templates.length})` : '(no memory yet)'}</div>
      )}

      {preview && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border rounded-xl p-4 space-y-2">
            <div className="font-medium">Mapping</div>
            <div className="text-xs opacity-70">Table type, schedule, filing, and column mapping.</div>

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

            <div className="text-xs opacity-70">Auto‑suggest picked from memory (by domain + table type). You can override below.</div>

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

          <div className="md:col-span-2 border rounded-xl p-4 overflow-auto space-y-4">
            <div>
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

            <div className="border rounded-xl p-3">
              <div className="font-medium mb-2">Copy mapping to other schedules</div>
              <div className="text-xs opacity-70 mb-2">Stamps the same mapping + filing to sibling sources (e.g., wageBracket_weekly → biweekly/semimonthly/monthly).</div>
              <div className="flex flex-wrap gap-3 items-center">
                {(['weekly','biweekly','semimonthly','monthly'] as Schedule[]).map(s => (
                  <label key={s} className="inline-flex items-center gap-1 text-sm">
                    <input type="checkbox" checked={!!copyTargets[s]} onChange={e=>setCopyTargets(t=>({ ...t, [s]: e.target.checked }))} /> {s}
                  </label>
                ))}
                <button disabled={loading || !db} onClick={copyToSchedules} className="border rounded px-3 py-2">Copy to Selected</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
