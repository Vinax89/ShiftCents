import type { Hardware, PhotoFile } from './types'
import { ensureFcmRegistration } from '@/lib/messaging'

async function pickPhoto(): Promise<PhotoFile | null> {
  return null // Implement via UI <input type="file" accept="image/*" capture>
}

export const webHardware: Hardware = {
  async cameraCapture() { return pickPhoto() },
  async share(text) { if (navigator.share) try { await navigator.share({ text }) } catch {} },
  vibrate(level) { if (navigator.vibrate) navigator.vibrate(level === 'heavy' ? 30 : level === 'medium' ? 20 : 10) },
  async device() { return { platform: 'web', model: navigator.userAgent, os: (navigator as any).platform } },
  secureStore: {
    async get(k) { return localStorage.getItem(k) },
    async set(k, v) { localStorage.setItem(k, v) },
    async del(k) { localStorage.removeItem(k) },
  },
  async biometrics() { return 'unavailable' },
  async authenticate() { return true },
  push: {
    async register() { return await ensureFcmRegistration() },
    onMessage(cb) { navigator.serviceWorker?.addEventListener('message', (e: any) => cb(e.data)); return () => {} },
  },
}
