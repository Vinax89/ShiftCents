import { z } from 'zod'

export const Filing = z.enum(['single','married','head'])
export type Filing = z.infer<typeof Filing>

// Source registry
export const Src = z.object({
  kind: z.enum(['csv','xlsx','html','pdf','fixed']),
  url: z.string().url().optional(),
  note: z.string().optional(),
  selector: z.string().optional(),
  sheet: z.string().optional(),
  headers: z.array(z.string()).optional(),
  // Hints for adapters
  tableType: z.enum(['percentage','wageBracket','fixed']).optional(),
  schedule: z.enum(['weekly','biweekly','semimonthly','monthly']).optional(),
  filing: Filing.optional(),
  // Locality fixed rates
  rate: z.number().optional(),
  residentRate: z.number().optional(),
  nonResidentRate: z.number().optional(),
})

export const CompTable = z.object({ filing: Filing, bands: z.array(z.tuple([ z.number(), z.number() ])) }) // [upto, rate]
export const CompWageBracket = z.object({ filing: Filing, rows: z.array(z.tuple([ z.number(), z.number() ])) }) // [upto, taxAmount]

export const CompPerPeriod = z.object({
  weekly: z.object({ percentage: z.array(CompTable).optional(), wageBracket: z.array(CompWageBracket).optional() }).partial().optional(),
  biweekly: z.object({ percentage: z.array(CompTable).optional(), wageBracket: z.array(CompWageBracket).optional() }).partial().optional(),
  semimonthly: z.object({ percentage: z.array(CompTable).optional(), wageBracket: z.array(CompWageBracket).optional() }).partial().optional(),
  monthly: z.object({ percentage: z.array(CompTable).optional(), wageBracket: z.array(CompWageBracket).optional() }).partial().optional(),
}).partial()

export const CompJurisdiction = z.object({
  code: z.string(),
  name: z.string(),
  tables: z.array(CompTable),
  perPeriod: CompPerPeriod.optional(),
})

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
  federal: z.record(Src),                     // e.g., { percentage: Src, wageBracket_weekly: Src, ... }
  states: z.record(z.record(Src)),            // e.g., { CA: { percentage: Src, wageBracket_biweekly: Src } }
  localities: z.record(z.record(Src)),        // e.g., { NYC: { percentage: Src }, PHL: { fixed: Src } }
})
export type Registry = z.infer<typeof Registry>
