'use client'
import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Category } from '@/lib/status/types'

type PointDoc = { ts: string; pct?: number; total?: number; done?: number; categories?: Record<string, any> }

export default function BurndownSparkline({ days=30, width=260, height=56, category }: { days?: number; width?: number; height?: number; category?: Category | 'ALL' }){
  const [rows,setRows] = useState<PointDoc[]>([])

  useEffect(()=>{
    if (!db) return;
    const qy = query(collection(db, 'system/appStatus/history'), orderBy('ts','asc'), limit(2000))
    return onSnapshot(qy, snap => {
      const all = snap.docs.map(d=> d.data() as any) as PointDoc[]
      setRows(all.slice(-1000))
    })
  },[])

  const series = useMemo(()=>{
    const arr: Array<{ t:number; v:number }> = []
    for (const r of rows){
      const t = new Date(r.ts).getTime()
      let pctDone: number | null = null
      if (!category || category === 'ALL'){
        pctDone = typeof r.pct === 'number' ? r.pct : (r.total ? Math.round(((r.done||0)/(r.total||1))*100) : null)
      } else {
        const cat = r.categories?.[category]
        if (cat){
          pctDone = typeof cat.pct === 'number' ? cat.pct : (cat.total ? Math.round(((cat.done||0)/(cat.total||1))*100) : null)
        }
      }
      if (pctDone == null) continue
      const remaining = Math.max(0, 100 - pctDone)
      arr.push({ t, v: remaining })
    }
    if (!arr.length){
      const now = Date.now()
      return [ { t: now-1, v: 100 }, { t: now, v: 100 } ]
    }
    return arr
  }, [rows, category])

  const minV = 0, maxV = 100
  const minT = series[0].t, maxT = series[series.length-1].t || (Date.now())
  const w = width, h = height, pad = 2
  const x = (t:number) => pad + (w-2*pad) * ((t - minT) / Math.max(1, (maxT - minT)))
  const y = (v:number) => pad + (h-2*pad) * (1 - (v - minV) / (maxV - minV))
  const d = series.map((p,i) => `${i?'L':'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')
  const last = series[series.length-1]
  const first = series[0]
  const delta = Math.round((last.v - first.v)*10)/10

  return (
    <div className="flex items-center gap-3">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Burndown sparkline">
        <polyline fill="none" stroke="currentColor" strokeWidth="2" points={d.replace(/[ML]/g,'')} />
      </svg>
      <div className="text-xs leading-tight">
        <div><b>Remaining{category && category!=='ALL' ? ` — ${category}`:''}</b>: {Math.round((last.v||0))}%</div>
        <div className={delta<=0? 'text-green-700':'text-red-700'}>{delta<=0?'↓':'↑'} {Math.abs(delta)} pts</div>
      </div>
    </div>
  )
}
