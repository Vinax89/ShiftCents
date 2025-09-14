'use client'
import { hardware } from '@/lib/hardware'
import { useState } from 'react'

export default function ReceiptPage() {
  const [uri, setUri] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  return (
    <div className="space-y-4">
      <button className="border rounded-xl px-4 py-2" disabled={busy} onClick={async () => {
        setBusy(true)
        const p = await hardware.cameraCapture({ quality: 80 })
        setUri(p?.uri ?? null)
        setBusy(false)
      }}>Scan Receipt</button>
      {uri && <img src={uri} alt="receipt" className="max-w-full rounded" />}
    </div>
  )
}
