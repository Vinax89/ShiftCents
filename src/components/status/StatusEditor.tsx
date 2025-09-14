'use client'
import { useState } from 'react'
import { STATUS_META, StatusCode } from '@/lib/status/types'

export function StatusEditor({ value, onChange }:{ value: StatusCode, onChange:(v:StatusCode)=>void }){
  const [open,setOpen]=useState(false)
  const opts: StatusCode[] = ['done','partial','verify','todo']
  return (
    <div className="relative">
      <button className="border rounded px-2 py-1 text-xs" onClick={()=>setOpen(o=>!o)}>{STATUS_META[value].emoji} {STATUS_META[value].label}</button>
      {open && (
        <div className="absolute z-10 mt-1 border rounded bg-white shadow text-xs">
          {opts.map(o=> (
            <button key={o} className="block w-full text-left px-3 py-1 hover:bg-gray-100" onClick={()=>{ onChange(o); setOpen(false) }}>
              {STATUS_META[o].emoji} {STATUS_META[o].label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
