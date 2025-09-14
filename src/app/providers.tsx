'use client'
import { useEffect } from 'react'
import { db } from '@/lib/firebase'
import { enableIndexedDbPersistence } from 'firebase/firestore'

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code == 'failed-precondition') {
        console.warn('Firestore persistence can only be enabled in one tab at a time.');
      } else if (err.code == 'unimplemented') {
        console.log('Firestore persistence is not available in this browser.');
      }
    })
  }, [])
  return <>{children}</>
}
