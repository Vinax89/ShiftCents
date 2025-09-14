export function parseAmount(text: string): number | null {
  const m = text.match(/\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+\.[0-9]{2})/) // 12.34 or 1,234.56
  if (!m) return null
  const num = parseFloat(m[1].replace(/,/g,''))
  return Math.round(num * 100)
}
export function parseDateISO(text: string): string | null {
  const m = text.match(/(20\d{2}|\d{2})[\/-](\d{1,2})[\/-](\d{1,2})|([A-Z][a-z]{2,8})\s+(\d{1,2}),\s*(20\d{2})/)
  if (!m) return null
  const iso = new Date(m[0]).toISOString().slice(0,10)
  return iso
}
export function parseMerchant(text: string): string | null {
  // Heuristic: first line with ≥3 letters and no price; fallback to first word block
  const lines = text.split(/\r?\n|\s{2,}/).map(s=>s.trim()).filter(Boolean)
  for (const line of lines){ if (/^[A-Za-z0-9&'.\-\s]{3,}$/.test(line) && !/\d+\.\d{2}/.test(line)) return line.slice(0,64) }
  return lines[0]?.slice(0,64) ?? null
}
