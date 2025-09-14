'use client'
import { useState } from 'react'
import { hardware } from '@/lib/hardware'
import { toImageDataFromFile } from '@/lib/ocr/resize'
import { runOcr } from '@/lib/ocr/runtime'
import { engine } from '@/lib/engine'

export default function Receipt(){
  const [uri,setUri]=useState<string|null>(null)
  const [msg,setMsg]=useState<string>('')
  const [busy,setBusy]=useState(false)

  async function pick(){
    // Web path: prompt for a file using a hidden input via a transient element
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'; (input as any).capture = 'environment'
    const p = new Promise<File|null>(res=>{ input.onchange=()=>res(input.files?.[0] ?? null) })
    input.click()
    const file = await p
    if(!file) return null
    const data = await toImageDataFromFile(file)
    return { file, data, url: URL.createObjectURL(file) }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button className="border rounded-xl px-4 py-2" disabled={busy} onClick={async()=>{
          setBusy(true); setMsg('')
          // Prefer native capture if available (Capacitor); fallback to web picker
          const cap = (globalThis as any).Capacitor
          if (cap && typeof cap.isNativePlatform==='function' && cap.isNativePlatform()){
            const photo = await hardware.cameraCapture({quality:80})
            setUri(photo?.uri ?? null)
            setMsg('Native capture complete. (OCR not implemented for native path in this stub)')
            setBusy(false); return
          }
          const picked = await pick()
          if(!picked){ setBusy(false); return }
          setUri(picked.url)
          const res = await runOcr(picked.data)
          const e = await engine()
          const suggest = e.label_suggest({ amountCents: res.amountCents }, [])
          setMsg(`OCR:${res.engine} conf=${res.confidence.toFixed(2)} | label conf=${(suggest.confidence||0).toFixed(2)}`)
          setBusy(false)
        }}>Scan Receipt</button>
      </div>
      {uri && <img src={uri} alt="receipt" className="max-w-full rounded" />}
      {msg && <p className="text-sm opacity-80">{msg}</p>}
    </div>
  )
}