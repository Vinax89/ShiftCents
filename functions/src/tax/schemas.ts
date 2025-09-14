import { z } from 'zod'

export const Filing = z.enum(['single','married','head'])
export type Filing = z.infer<typeof Filing>

export const Src = z.object({
  kind: z.enum(['csv','xlsx','html','pdf','fixed']),
  url: z.string().url().optional(),
  note: z.string().optional(),
  selector: z.string().optional(),
  sheet: z.string().optional(),
  // Mapping chosen in Admin UI (used by adapters)
  columns: z.object({ upto: z.string().optional(), rate: z.string().optional(), tax: z.string().optional() }).optional(),
  // Hints (optional)
  tableType: z.enum(['percentage','wageBracket','fixed']).optional(),
  schedule: z.enum(['weekly','biweekly','semimonthly','monthly']).optional(),
  filing: Filing.optional(),
  // Locality fixed rates
  rate: z.number().optional(),
  residentRate: z.number().optional(),
  nonResidentRate: z.number().optional(),
})

export const CompTable = z.object({ filing: Filing, bands: z.array(z.tuple([ z.number(), z.number() ])) })
export const CompWageBracket = z.object({ filing: Filing, rows: z.array(z.tuple([ z.number(), z.number() ])) })

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

export const Registry = z.object({
  year: z.number(),
  federal: z.record(Src),
  states: z.record(z.record(Src)),
  localities: z.record(z.record(Src)),
})
export type Registry = z.infer<typeof Registry>
