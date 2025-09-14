export type TableType = 'percentage'|'wageBracket'|'fixed'
export type Schedule = 'weekly'|'biweekly'|'semimonthly'|'monthly'
export type Filing = 'single'|'married'|'head'

export type Mapping = { upto?: string; rate?: string; tax?: string }
export type MemoryTemplate = {
  tableType: TableType
  schedule?: Schedule
  filing?: Filing
  mapping: Mapping
  headers: string[]          // headers seen when this mapping was saved
  sourceKey?: string         // e.g., percentage, wageBracket_biweekly
  notes?: string
  updatedAt: string
}

export type MemoryDoc = { domain: string; templates: MemoryTemplate[] }

export function domainFromUrl(url?: string): string | null {
  try { if (!url) return null; return new URL(url).hostname.replace(/^www\./,'') } catch { return null }
}

const SYNONYMS: Record<'upto'|'rate'|'tax', RegExp> = {
  upto: /(up\s*to|upper|max(imum)?|threshold|wages?\s*to)/i,
  rate: /(rate|percent|%)/i,
  tax: /(tax|withhold|amount)/i,
}

export function suggestMapping(keys: string[], memory?: MemoryDoc, hint?: { tableType?: TableType }): Mapping {
  const out: Mapping = {}
  // 1) Try last template with same tableType
  const t = memory?.templates?.slice().reverse().find(t => !hint?.tableType || t.tableType===hint.tableType)
  if (t) {
    for (const k of (['upto','rate','tax'] as const)){
      const want = (t.mapping as any)[k]
      if (want && keys.includes(want)) (out as any)[k] = want
    }
  }
  // 2) Fill remaining by synonyms
  for (const k of (['upto','rate','tax'] as const)){
    if ((out as any)[k]) continue
    const rx = SYNONYMS[k]
    const cand = keys.find(h => rx.test(h))
    if (cand) (out as any)[k] = cand
  }
  return out
}
