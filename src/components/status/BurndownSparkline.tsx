'use client'
import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'

type Point = { ts: string; pct: number; total?: number; done?: number }

export default function BurndownSparkline({ days=30, width=260, height=56 }: { days?: number; width?: number; height?: number }){
  const [rows,setRows] = useState<Point[]>([])

  useEffect(()=>{
    if (!db) return;
    const qy = query(collection(db, 'system/appStatus/history'), orderBy('ts','asc'), limit(1000))
    return onSnapshot(qy, snap => {
      const all = snap.docs.map(d=> d.data() as any).map(x=> ({ ts: x.ts, pct: x.pct as number })) as Point[]
      // keep only last N days worth (approx — use last 500 points to be safe, then slice)
      setRows(all.slice(-500))
    })
  },[])

  // remaining% = 100 - pct
  const pts = useMemo(()=> rows.map(r => ({ t: new Date(r.ts).getTime(), v: Math.max(0, 100 - (r.pct||0)) })), [rows])
  const series = pts.length? pts : [{ t: Date.now()-1, v: 100 }, { t: Date.now(), v: 100 }]

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
        <div><b>Remaining</b>: {Math.round((last.v||0))}%</div>
        <div className={delta<=0? 'text-green-700':'text-red-700'}>{delta<=0?'↓':'↑'} {Math.abs(delta)} pts</div>
      </div>
    </div>
  )
}
