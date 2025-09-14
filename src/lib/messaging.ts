export async function ensureFcmRegistration(): Promise<string | null> {
  try {
    const { isSupported, getMessaging, getToken } = await import('firebase/messaging')
    if (!(await isSupported())) return null
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    if (!vapidKey) return null
    const m = getMessaging()
    return await getToken(m, { vapidKey }).catch(() => null)
  } catch {
    return null
  }
}
