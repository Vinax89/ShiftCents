'use client'
import { useState } from 'react'
import { recognizeFromUrl } from '@/lib/ocr/ppocr-rec'
import { parseAmount, parseDateISO, parseMerchant } from '@/lib/ocr/parse'

export default function Receipt(){
  const [uri,setUri]=useState<string|undefined>()
  const [out,setOut]=useState<any>(null)
  const [busy,setBusy]=useState(false)

  async function pickFile(){
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'; (input as any).capture = 'environment'
    const p = new Promise<File|null>(res=>{ input.onchange=()=>res(input.files?.[0] ?? null) })
    input.click()
    const file = await p
    if(!file) return
    const url = URL.createObjectURL(file)
    setUri(url)
    setBusy(true)
    try{
      const rec = await recognizeFromUrl(url)
      const amountCents = parseAmount(rec.text)
      const dateISO = parseDateISO(rec.text)
      const merchant = parseMerchant(rec.text)
      setOut({ engine: rec.engine, confidence: +rec.confidence.toFixed(2), text: rec.text.slice(0,200), amountCents, dateISO, merchant })
    } finally { setBusy(false) }
  }

  return (
    <div className="space-y-4">
      <button className="border rounded-xl px-4 py-2" disabled={busy} onClick={pickFile}>Scan Receipt</button>
      {uri && <img src={uri} alt="receipt" className="max-w-full rounded" />}
      {out && <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">{JSON.stringify(out,null,2)}</pre>}
    </div>
  )
}
