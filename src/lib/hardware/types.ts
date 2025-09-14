export type PhotoFile = { uri: string; mime: string; bytes?: Uint8Array }
export interface Hardware {
  cameraCapture(opts?: { quality?: number; allowGallery?: boolean }): Promise<PhotoFile | null>
  share(text: string, files?: Array<{ uri: string; mime: string }>): Promise<void>
  vibrate(intensity?: 'light' | 'medium' | 'heavy'): void
  device(): Promise<{ platform: 'web' | 'ios' | 'android'; model?: string; os?: string }>
  secureStore: {
    get(key: string): Promise<string | null>
    set(key: string, value: string): Promise<void>
    del(key: string): Promise<void>
  }
  biometrics(): Promise<'available' | 'unavailable'>
  authenticate(prompt?: string): Promise<boolean>
  push: {
    register(): Promise<string | null>
    onMessage(cb: (payload: any) => void): () => void
  }
}
