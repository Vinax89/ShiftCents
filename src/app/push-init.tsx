'use client'
import { useEffect } from 'react'
import { ensureFcmRegistration } from '@/lib/messaging'

export default function PushInit() {
  useEffect(() => {
    const run = async () => { await ensureFcmRegistration() }
    if ('requestIdleCallback' in window) (window as any).requestIdleCallback(run); else setTimeout(run, 1500)
  }, [])
  return null
}
