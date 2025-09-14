'use client'
import { hardware } from '@/lib/hardware'
import { useState } from 'react'


export default function Receipt(){
const [uri,setUri] = useState<string|null>(null)
return (
<div className="space-y-4">
<button className="rounded-xl px-4 py-2 border" onClick={async()=>{
const p = await hardware.cameraCapture(); setUri(p?.uri ?? null)
}}>Capture receipt</button>
{uri && <img src={uri} alt="receipt" className="max-w-full rounded"/>}
</div>
)
}
