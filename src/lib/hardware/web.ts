// src/lib/hardware/web.ts
import type { Hardware, PhotoCapture } from './types'
import { ensureFcmRegistration } from '@/lib/messaging'


async function pwaCapture(): Promise<PhotoCapture|null> {
try {
// Use <input type=file accept="image/*" capture="environment"> pattern
// Implemented in UI; here we only pass through selected file
return null
} catch { return null }
}


export const webHardware: Hardware = {
async cameraCapture(){ return pwaCapture() },
async share(text){ if (navigator.share) await navigator.share({ text }).catch(()=>{}); },
vibrate(i){ if (navigator.vibrate) navigator.vibrate(i==='heavy'?30:i==='medium'?20:10) },
async device(){ return { platform: 'web', model: navigator.userAgent, os: navigator.platform as string } },
secureStore: {
async get(k){ return typeof window !== 'undefined' ? localStorage.getItem(k) : null },
async set(k,v){ if(typeof window !== 'undefined') localStorage.setItem(k,v) },
async del(k){ if(typeof window !== 'undefined') localStorage.removeItem(k) },
},
async biometrics(){ return 'unavailable' },
async authenticate(){ return true },
push: {
async register(){ return await ensureFcmRegistration() },
onMessage(cb){ 
      if (typeof window !== 'undefined' && navigator.serviceWorker) {
        const listener = (e: MessageEvent) => cb(e.data);
        navigator.serviceWorker.addEventListener('message', listener);
        return () => navigator.serviceWorker.removeEventListener('message', listener);
      }
      return ()=>{} 
    },
}
}