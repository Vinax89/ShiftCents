'use client'
export function ProgressBar({ value }:{ value:number }){
  return (
    <div className="w-full h-2 rounded bg-gray-200"><div className="h-2 rounded bg-black" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>
  )
}
