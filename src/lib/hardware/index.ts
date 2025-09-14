// src/lib/hardware/index.ts
import { nativeHardware } from './native'
import { webHardware } from './web'
export const hardware = (globalThis as any).Capacitor ? nativeHardware : webHardware
