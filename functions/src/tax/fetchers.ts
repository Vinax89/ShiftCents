import { getStorage } from 'firebase-admin/storage'

export async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`)
  const arr = new Uint8Array(await res.arrayBuffer())
  return Buffer.from(arr)
}

export async function cacheRaw(year: number, key: string, buf: Buffer){
  const bucket = getStorage().bucket()
  const file = bucket.file(`tax-sources/${year}/${key}`)
  await file.save(buf, { resumable: false, contentType: 'application/octet-stream' })
}
