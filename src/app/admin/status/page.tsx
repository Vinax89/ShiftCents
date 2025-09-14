'use client'
import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { collection, doc, getDocs, onSnapshot, query, setDoc, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { StatusItem, StatusCode, Category, pct } from '@/lib/status/types'
import { StatusEditor } from '@/components/status/StatusEditor'
import { ProgressBar } from '@/components/status/ProgressBar'

const BurndownSparkline = dynamic(()=> import('@/components/status/BurndownSparkline'), { ssr:false })

async function seedIfEmpty(){
  if (!db) return false;
  const snap = await getDocs(collection(db, 'system/appStatus/items'))
  if (!snap.empty) return false
  const seed = await fetch('/api/status-seed').then(r=>r.json())
  const batch: Array<Promise<any>> = []
  for (const it of seed.items as StatusItem[]){ batch.push(setDoc(doc(db, 'system/appStatus/items', it.id), { ...it, weight: it.weight ?? 1, updatedAt: new Date().toISOString() })) }
  await Promise.all(batch)
  return true
}

export default function AdminStatus(){
  const [items,setItems] = useState<StatusItem[]>([])
  const [byCat,setByCat] = useState<Record<string,StatusItem[]>>({})
  const [catFilter,setCatFilter] = useState<Category|'ALL'>('ALL')

  useEffect(()=>{
    if (!db) return;
    seedIfEmpty().finally(()=>{
      const q = query(collection(db, 'system/appStatus/items'))
      return onSnapshot(q, snap => {
        const arr = snap.docs.map(d=> ({ id:d.id, ...(d.data() as any) })) as StatusItem[]
        setItems(arr)
      })
    })
  },[])

  useEffect(()=>{
    const buckets: Record<string,StatusItem[]> = {}
    for (const it of items){ (buckets[it.category] ||= []).push(it) }
    setByCat(buckets)
  },[items])

  async function updateStatus(id:string, status: StatusCode){
    if (!db) return;
    await setDoc(doc(db, 'system/appStatus/items', id), { status, updatedAt: new Date().toISOString() }, { merge: true })
  }

  function computePct(list: StatusItem[]){ const done = list.filter(x=>x.status==='done').reduce((a,b)=>a+(b.weight||1),0); const total = list.reduce((a,b)=>a+(b.weight||1),0); return pct(done,total) }

  const categories: Category[] = ['SPEC-R','R11-EXT','SPEC-UI','FEATURE','PLATFORM']

  async function exportHistoryCSV(){
    // Pull all history docs and emit CSV for either ALL or selected category
    if (!db) return;
    const qy = query(collection(db, 'system/appStatus/history'), orderBy('ts','asc'))
    const snap = await getDocs(qy)
    const rows: any[] = []
    for (const d of snap.docs){
      const x: any = d.data()
      const ts = x.ts
      let pctDone: number | null = null
      if (catFilter==='ALL'){
        pctDone = typeof x.pct === 'number' ? x.pct : (x.total ? Math.round(((x.done||0)/(x.total||1))*100) : null)
      } else {
        const cat = x.categories?.[catFilter]
        pctDone = cat ? (typeof cat.pct === 'number' ? cat.pct : (cat.total ? Math.round(((cat.done||0)/(cat.total||1))*100) : null)) : null
      }
      if (pctDone==null) continue
      const remaining = Math.max(0, 100 - pctDone)
      rows.push({ ts, remaining })
    }
    const header = `ts,remaining_percent${catFilter==='ALL'?'':'_'+catFilter}`
    const body = rows.map(r=> `${r.ts},${r.remaining}`).join('\n')
    const csv = header + '\n' + body + '\n'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `status-history${catFilter==='ALL'?'':'-'+catFilter}.csv`
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Live App Status</h1>
          <div className="text-sm opacity-80">Admin‑editable, realtime. Toggle category to focus the burndown. Export CSV anytime.</div>
        </div>
        <div className="flex items-center gap-2">
          <select className="border rounded px-3 py-2 text-sm" value={catFilter} onChange={e=> setCatFilter(e.target.value as any)}>
            <option value="ALL">All (overall)</option>
            {categories.map(c=> <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="border rounded px-3 py-2 text-sm" onClick={exportHistoryCSV}>Export CSV</button>
        </div>
      </div>

      <div className="mt-2"><BurndownSparkline category={catFilter} /></div>

      {categories.map(cat => {
        const list = byCat[cat] || []
        const p = computePct(list)
        return (
          <section key={cat} className="border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{cat}</h2>
              <div className="flex items-center gap-2 w-64"><ProgressBar value={p} /><span className="text-sm w-10 text-right">{p}%</span></div>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead><tr><th className="text-left">ID</th><th className="text-left">Name</th><th className="text-left">Status</th><th className="text-left">Notes</th></tr></thead>
                <tbody>
                  {list.sort((a,b)=>a.id.localeCompare(b.id)).map(it => (
                    <tr key={it.id} className="border-t">
                      <td className="py-2 pr-4 whitespace-nowrap">{it.id}</td>
                      <td className="py-2 pr-4">{it.name}</td>
                      <td className="py-2 pr-4 whitespace-nowrap">
                        <StatusEditor value={it.status as StatusCode} onChange={(v)=>updateStatus(it.id, v)} />
                      </td>
                      <td className="py-2 pr-4 min-w-[240px]">
                        <textarea className="border rounded px-2 py-1 w-full text-xs" defaultValue={it.notes||''} onBlur={async e=>{ if(!db) return; await setDoc(doc(db,'system/appStatus/items', it.id), { notes:e.currentTarget.value, updatedAt:new Date().toISOString() }, { merge:true }) }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
    </div>
  )
}
