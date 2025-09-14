'use client'
import { useEffect } from 'react'
import { db } from '@/lib/firebase'
import { enableIndexedDbPersistence } from 'firebase/firestore'

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    enableIndexedDbPersistence(db).catch(() => {/* multi-tab fallback */})
  }, [])
  return <>{children}</>
}
