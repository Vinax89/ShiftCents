// Lazy App Check init for web clients (no‑op on server)
import { firebaseApp } from '@/lib/firebase'

let inited = false
export async function initAppCheck() {
  if (inited || typeof window === 'undefined') return
  try {
    const { isSupported, initializeAppCheck, ReCaptchaV3Provider } = await import('firebase/app-check')
    if (!(await isSupported())) return
    const key = process.env.NEXT_PUBLIC_RECAPTCHA_KEY
    if (!key) return
    initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaV3Provider(key),
      isTokenAutoRefreshEnabled: true,
    })
    inited = true
  } catch {
    // ignore
  }
}
