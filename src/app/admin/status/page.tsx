'use client'
import { useEffect, useMemo, useState } from 'react'
import { collection, doc, getDoc, getDocs, onSnapshot, query, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { StatusItem, STATUS_META, StatusCode, Category, pct } from '@/lib/status/types'
import { StatusChip } from '@/components/status/StatusChip'
import { StatusEditor } from '@/components/status/StatusEditor'
import { ProgressBar } from '@/components/status/ProgressBar'

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

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Live App Status</h1>
      <p className="text-sm opacity-80">Admin‑editable, realtime. Click a status to change it. Seed loads automatically if empty.</p>

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
