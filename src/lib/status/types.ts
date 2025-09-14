export type StatusCode = 'done'|'partial'|'todo'|'verify'
export type Category = 'SPEC-R'|'R11-EXT'|'SPEC-UI'|'FEATURE'|'PLATFORM'
export interface StatusItem { id: string; name: string; category: Category; status: StatusCode; weight?: number; notes?: string; evidence?: string; updatedAt?: string; updatedBy?: string }

export const STATUS_META: Record<StatusCode,{ label:string; emoji:string; color:string }> = {
  done:    { label:'Implemented',          emoji:'✅', color:'bg-green-100 text-green-800' },
  partial: { label:'Planned / In Progress', emoji:'🟡', color:'bg-yellow-100 text-yellow-800' },
  todo:    { label:'Not Started',           emoji:'⛔', color:'bg-red-100 text-red-800' },
  verify:  { label:'Needs Verification',    emoji:'🔶', color:'bg-orange-100 text-orange-800' },
}

export function pct(done:number, total:number){ return total? Math.round((done/total)*100) : 0 }
