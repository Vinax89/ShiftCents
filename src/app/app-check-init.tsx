'use client'
import { useEffect } from 'react'
import { initAppCheck } from '@/lib/app-check'

export default function AppCheckInit(){
  useEffect(()=>{ initAppCheck() },[])
  return null
}
