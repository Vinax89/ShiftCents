import { z } from 'zod'

// Source registry
export const Src = z.object({
  kind: z.enum(['csv','xlsx','html','pdf','fixed']),
  url: z.string().url().optional(), // set for official source
  note: z.string().optional(),
  selector: z.string().optional(), // css selector for HTML table
  sheet: z.string().optional(), // sheet name for xlsx
  headers: z.array(z.string()).optional(), // optional header mapping
  // For fixed rate localities (e.g., STL earnings tax), use rate fields
  rate: z.number().optional(),
  residentRate: z.number().optional(),
  nonResidentRate: z.number().optional(),
})

export const JurisdictionKey = z.object({ code: z.string(), name: z.string() })
export const Filing = z.enum(['single','married','head'])

// Canonical compiled forms
export const CompTable = z.object({ filing: Filing, bands: z.array(z.tuple([ z.number(), z.number() ])) }) // [upto, rate]
export const CompJurisdiction = z.object({ code: z.string(), name: z.string(), tables: z.array(CompTable) })

export const LocalityRate = z.object({ code: z.string(), name: z.string(), residentRate: z.number().nullable(), nonResidentRate: z.number().nullable() })

export const CompiledCorpus = z.object({
  year: z.number(),
  federal: CompJurisdiction,
  states: z.array(CompJurisdiction),
  localities: z.array(LocalityRate),
  meta: z.object({ compiledAt: z.string(), version: z.number(), sources: z.record(z.any()) })
})
export type CompiledCorpus = z.infer<typeof CompiledCorpus>

// Registry document per year
export const Registry = z.object({
  year: z.number(),
  federal: z.record(Src),         // { percentage: Src, wageBracket?: Src }
  states: z.record(z.record(Src)),// { CA: { percentage: Src, ... } }
  localities: z.record(z.record(Src)), // { PHL: { fixed: Src }, NYC: { percentage: Src }, STL: { fixed: Src } }
})
export type Registry = z.infer<typeof Registry>
