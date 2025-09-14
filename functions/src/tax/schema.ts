import { z } from 'zod'
export const Bracket = z.object({ upto: z.number().nullable(), rate: z.number() })
export const Table = z.object({ filing: z.enum(['single','married','head']), brackets: z.array(Bracket) })
export const Jurisdiction = z.object({ name: z.string(), tables: z.array(Table) })
export const Corpus = z.object({ year: z.number(), federal: Jurisdiction, states: z.array(Jurisdiction) })
export type Corpus = z.infer<typeof Corpus>
