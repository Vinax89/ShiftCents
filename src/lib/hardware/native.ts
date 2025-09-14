
// src/lib/hardware/native.ts
import type { Hardware } from './types'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { Share } from '@capacitor/share'
import { Device } from '@capacitor/device'
import { PushNotifications } from '@capacitor/push-notifications'
import { Preferences } from '@capacitor/preferences' // for non‑secrets
// For secrets use a secure storage plugin suited to Keychain/EncryptedSharedPreferences


export const nativeHardware: Hardware = {
  async cameraCapture(){
    const photo = await Camera.getPhoto({ resultType: CameraResultType.Uri, source: CameraSource.Prompt, quality: 80 } as any)
    return photo.webPath ? { uri: photo.webPath, mime: 'image/jpeg' } : null
  },
  async share(text){ await Share.share({ text }) },
  vibrate(i){ Haptics.impact({ style: i==='heavy'?ImpactStyle.Heavy:i==='medium'?ImpactStyle.Medium:ImpactStyle.Light } as any) },
  async device(){ const info = await Device.getInfo(); return { platform: info.platform as any, model: info.model, os: info.operatingSystem as string } },
  secureStore: {
    async get(k){ return (await Preferences.get({ key: k })).value },
    async set(k,v){ await Preferences.set({ key: k, value: v }) },
    async del(k){ await Preferences.remove({ key: k }) },
  },
  async biometrics(){ return 'unavailable' }, // replace with a biometric plugin
  async authenticate(){ return true },
  push: {
    async register(){
      await PushNotifications.requestPermissions();
      await PushNotifications.register();
      return new Promise<string|null>((resolve)=>{
        const handler = (token: any)=>{ resolve(token?.value ?? null) }
        PushNotifications.addListener('registration', handler)
        setTimeout(()=>resolve(null), 10000)
      })
    },
    onMessage(cb){ PushNotifications.addListener('pushNotificationReceived', (n)=>cb(n)); return ()=>{} },
  }
}
