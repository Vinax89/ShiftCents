'use client'
import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function SummaryWidget(){
  const [sum,setSum] = useState<any>(null)
  useEffect(()=> {
    if (!db) return;
    return onSnapshot(doc(db,'system/appStatus/summary'), s=> setSum(s.data()||null))
  },[])
  const cats = Object.entries(sum?.categories||{}) as Array<[string, any]>
  return (
    <div className="border rounded-xl p-4 space-y-2">
      <div className="text-sm font-medium">Build Progress</div>
      {cats.length===0? <div className="text-xs opacity-70">No data yet</div> : cats.map(([k,v])=> (
        <div key={k} className="flex items-center gap-2"><div className="w-28 text-xs opacity-70">{k}</div><div className="flex-1 h-2 rounded bg-gray-200"><div className="h-2 rounded bg-black" style={{width:`${v.pct}%`}} /></div><div className="w-10 text-right text-xs">{v.pct}%</div></div>
      ))}
      <div className="text-[10px] opacity-60">Updated {new Date(sum?.updatedAt).toLocaleString()||'—'}</div>
    </div>
  )
}
