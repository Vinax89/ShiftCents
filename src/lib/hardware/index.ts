// src/lib/hardware/index.ts
import { nativeHardware } from './native'
import { webHardware } from './web'

const isCapacitor = () => {
  if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
    return true;
  }
  return false;
}
export const hardware = isCapacitor() ? nativeHardware : webHardware
