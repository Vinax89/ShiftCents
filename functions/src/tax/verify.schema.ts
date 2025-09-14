import { z } from 'zod'

export const Filing = z.enum(['single','married','head'])
export type Filing = z.infer<typeof Filing>

export const Example = z.object({
  // jurisdiction kind + code
  kind: z.enum(['federal','state','locality']),
  code: z.string().default('FED'),
  // inputs
  filing: Filing,
  wagesAnnual: z.number().nonnegative(),
  // outputs from official doc (expected)
  expectedAnnual: z.number().nonnegative(),
  source: z.string().optional(), // URL or citation
  note: z.string().optional(),
})
export type Example = z.infer<typeof Example>

export const ExampleSet = z.object({ year: z.number(), cases: z.array(Example) })
export type ExampleSet = z.infer<typeof ExampleSet>

export const VerifyParams = z.object({ year: z.number(), tolerance: z.number().default(1) /* dollars */ })
export type VerifyParams = z.infer<typeof VerifyParams>
