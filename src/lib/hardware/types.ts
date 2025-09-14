// src/lib/hardware/types.ts
export type PhotoCapture = { uri: string; bytes?: Uint8Array; mime: string }
export interface Hardware {
  cameraCapture(opts?: { quality?: number; allowGallery?: boolean }): Promise<PhotoCapture|null>
  share(text: string, files?: Array<{ uri: string; mime: string }>): Promise<void>
  vibrate(intensity?: 'light'|'medium'|'heavy'): void
  device(): Promise<{ platform: 'web'|'ios'|'android'; model?: string; os?: string }>
  secureStore: {
    get(key: string): Promise<string|null>
    set(key: string, value: string): Promise<void>
    del(key: string): Promise<void>
  }
  biometrics(): Promise<'available'|'unavailable'>
  authenticate(prompt?: string): Promise<boolean>
  push: {
    register(): Promise<string|null> // returns FCM token
    onMessage(cb: (payload: any) => void): () => void
  }
}
