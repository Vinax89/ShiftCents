'use client';
import * as ort from 'onnxruntime-web'

let session: ort.InferenceSession | null = null
let labels: string[] | null = null

function supportsWebGPU(){ return !!(globalThis as any)?.navigator?.gpu }

async function loadLabels(url = '/models/ocr/ppocr_keys_v1.txt'){
  if (labels) return labels
  const txt = await fetch(url).then(r=>r.text())
  labels = txt.split(/\r?\n/).filter(l=>l && !l.startsWith('#'))
  return labels
}

export async function initRec(modelUrl = '/models/ocr/en_PP-OCRv3_rec_infer.onnx'){
  if (session) return true
  const execProviders: ort.InferenceSession.SessionOptions['executionProviders'] = supportsWebGPU() ? ['webgpu','wasm'] : ['wasm']
  session = await ort.InferenceSession.create(modelUrl, { executionProviders: execProviders })
  await loadLabels()
  return true
}

// Resize to h=48 with aspect, pad to maxW (default 320), normalize to CHW float32
function preprocess(img: HTMLImageElement, maxW = 320, outH = 48){
  const scale = outH / img.naturalHeight
  const w = Math.min(maxW, Math.max(1, Math.round(img.naturalWidth * scale)))
  const canvas = document.createElement('canvas')
  canvas.width = maxW; canvas.height = outH
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'white'; ctx.fillRect(0,0,maxW,outH)
  ctx.drawImage(img, 0, 0, w, outH)
  const { data } = ctx.getImageData(0,0,maxW,outH)
  // HWC uint8 → CHW float32 in [0,1], mean/std used by PP-OCR (approx 0.5/0.5)
  const chw = new Float32Array(3 * outH * maxW)
  let p = 0
  for (let y=0; y<outH; y++){
    for (let x=0; x<maxW; x++){
      const i = (y*maxW + x) * 4
      const r = data[i] / 255, g = data[i+1] / 255, b = data[i+2] / 255
      chw[0*outH*maxW + y*maxW + x] = (r - 0.5) / 0.5
      chw[1*outH*maxW + y*maxW + x] = (g - 0.5) / 0.5
      chw[2*outH*maxW + y*maxW + x] = (b - 0.5) / 0.5
      p+=4
    }
  }
  return { chw, width:maxW }
}

// Greedy CTC decode: blank is index 0 by convention for PP-OCR
function ctcDecode(logits: Float32Array, timesteps: number, classes: number){
  const result: number[] = []
  const probs: number[] = []
  let prev = -1
  for (let t=0; t<timesteps; t++){
    let maxIdx = 0; let maxVal = -Infinity
    for (let c=0; c<classes; c++){
      const v = logits[t*classes + c]
      if (v > maxVal){ maxVal = v; maxIdx = c }
    }
    if (maxIdx !== 0 && maxIdx !== prev){ result.push(maxIdx); probs.push(maxVal) }
    prev = maxIdx
  }
  const avgLogit = probs.length ? probs.reduce((a,b)=>a+b,0)/probs.length : -Infinity
  return { indices: result, avgLogit }
}

export type RecOut = { text: string; confidence: number; engine: 'webgpu'|'wasm' }

export async function recognizeFromUrl(url: string): Promise<RecOut>{
  if (!session) await initRec()
  if (!session || !labels) throw new Error('OCR session not ready')
  const img = new Image(); img.crossOrigin='anonymous'; img.src = url
  await new Promise<void>((res,rej)=>{ img.onload=()=>res(); img.onerror=rej })
  const { chw, width } = preprocess(img)
  const tensor = new ort.Tensor('float32', chw, [1,3,48,width])
  const feeds: Record<string, ort.Tensor> = {}
  // Try common input names; PP-OCR uses 'x' in many exports
  feeds['x'] = tensor
  const out = await session.run(feeds)
  const first = out[Object.keys(out)[0]] as ort.Tensor
  // shape: [1, T, C]
  const [_, T, C] = first.dims
  const logits = first.data as Float32Array
  const { indices, avgLogit } = ctcDecode(logits, T, C)
  const blankOffset = 0 // 0 is blank, labels[0] is first character
  const chars = indices.map(i => labels![i-1] ?? '').join('')
  const engine = supportsWebGPU() ? 'webgpu' as const : 'wasm' as const
  // Softmax not applied here; avg logit as proxy; map to 0..1 with logistic
  const confidence = 1/(1+Math.exp(-avgLogit))
  return { text: chars, confidence, engine }
}