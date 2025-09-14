// Lightweight OCR wrapper (amount+date extraction) using ONNX Runtime Web.
// Uses WebGPU when available, falls back to WASM. You will replace model + pre/post.
import * as ort from 'onnxruntime-web'

let session: ort.InferenceSession | null = null
let tried = false

function supportsWebGPU(){
  // @ts-ignore
  return !!(globalThis.navigator && (navigator as any).gpu)
}

export async function initOcr(modelUrl = '/models/ocr/ocr-lite.onnx'){
  if (session || tried) return !!session
  tried = true
  const execProviders: ort.InferenceSession.SessionOptions['executionProviders'] = supportsWebGPU() ? ['webgpu','wasm'] : ['wasm']
  // Optional: set wasm path if you self‑host; defaults usually work
  // ort.env.wasm.wasmPaths = '/_static/onnx/';
  try {
    session = await ort.InferenceSession.create(modelUrl, { executionProviders: execProviders })
  } catch (e) {
    console.warn('OCR session init failed', e); session = null
  }
  return !!session
}

export type OcrResult = { amountCents?: number; dateISO?: string; merchant?: string; confidence: number; engine: 'webgpu'|'wasm'|'none' }

// NOTE: For demo, we do not implement full pre/post. Replace with your model’s pipeline.
export async function runOcr(imgData: ImageData): Promise<OcrResult>{
  const ok = await initOcr()
  if (!ok || !session) return { confidence: 0, engine: 'none' }

  // --- Minimal fake inference (placeholder) ---
  // Real flow: preprocess → ort.Tensor → session.run(feeds) → parse outputs
  // Here, we just return a stub so the UI flow works end‑to‑end.
  const engine = supportsWebGPU() ? 'webgpu' : 'wasm'
  return { amountCents: undefined, dateISO: undefined, merchant: undefined, confidence: 0.0, engine }
}