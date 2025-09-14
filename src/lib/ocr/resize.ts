import pica from 'pica'

export async function toImageDataFromFile(file: File, maxW = 1280){
  const img = new Image()
  const url = URL.createObjectURL(file)
  try {
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = url })
    const scale = Math.min(1, maxW / (img.width || 1))
    const w = Math.max(1, Math.round(img.width * scale))
    const h = Math.max(1, Math.round(img.height * scale))
    const src = document.createElement('canvas'); src.width = img.width; src.height = img.height
    const dst = document.createElement('canvas'); dst.width = w; dst.height = h
    const sctx = src.getContext('2d')!; sctx.drawImage(img, 0, 0)
    await pica().resize(src, dst, { alpha: false })
    const dctx = dst.getContext('2d', { willReadFrequently: true })!
    const data = dctx.getImageData(0, 0, w, h)
    return data
  } finally { URL.revokeObjectURL(url) }
}