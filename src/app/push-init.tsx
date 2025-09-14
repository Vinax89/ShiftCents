'use client'
import { useEffect } from 'react'
import { hardware } from '@/lib/hardware'

export default function PushInit(){
  useEffect(()=>{
    const run = async()=>{ 
      console.log("Attempting to register for push notifications...");
      const token = await hardware.push.register();
      if (token) {
        console.log("Push registration successful, token:", token);
      } else {
        console.log("Push registration failed or was denied.");
      }
    }

    if (typeof window !== 'undefined') {
        if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(run);
        } else {
            setTimeout(run, 1500);
        }
    }
  },[])
  return null
}
