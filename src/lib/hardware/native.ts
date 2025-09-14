// src/lib/hardware/native.ts
import type { Hardware } from './types'
/*
// UNCOMMENT THE FOLLOWING ONCE CAPACITOR IS FULLY CONFIGURED
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { Share } from '@capacitor/share'
import { Device } from '@capacitor/device'
import { PushNotifications } from '@capacitor/push-notifications'
import { Preferences } from '@capacitor/preferences' // for non-secrets
*/

// Mock implementations to avoid breaking the build before Capacitor is set up.
const Camera = { getPhoto: async () => ({ webPath: 'https://picsum.photos/seed/receipt/400/600' }) };
const CameraResultType = { Uri: 'Uri' };
const CameraSource = { Prompt: 'Prompt' };
const Haptics = { impact: async () => {} };
const ImpactStyle = { Heavy: 'Heavy', Medium: 'Medium', Light: 'Light' };
const Share = { share: async () => {} };
const Device = { getInfo: async () => ({ platform: 'web', model: 'unknown', operatingSystem: 'unknown' }) };
const PushNotifications = { requestPermissions: async () => {}, register: async () => {}, addListener: (event: string, cb: any) => {} };
const Preferences = { get: async (o: {key:string}) => ({value: null}), set: async (o:{key:string, value:string}) => {}, remove: async(o:{key:string}) => {} };


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
