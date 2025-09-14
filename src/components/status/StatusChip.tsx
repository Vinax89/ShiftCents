'use client'
import { STATUS_META, StatusCode } from '@/lib/status/types'
export function StatusChip({ value }: { value: StatusCode }){
  const m = STATUS_META[value]
  return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${m.color}`}>{m.emoji} {m.label}</span>
}
