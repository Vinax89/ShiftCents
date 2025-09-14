'use client'
import { hardware } from '@/lib/hardware'
export default function Goals(){
return (
<div className="grid gap-4 md:grid-cols-2">
{[1,2,3].map(i=> (
<button key={i} className="border rounded-2xl p-4 text-left" onClick={()=>hardware.vibrate('light')}>
<div className="text-lg font-semibold">Goal {i}</div>
<div className="text-sm opacity-70">Tap to quick‑fund (demo)</div>
</button>
))}
</div>
)
}
